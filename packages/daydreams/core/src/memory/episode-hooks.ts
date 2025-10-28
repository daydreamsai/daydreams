import type {
  AnyAgent,
  AnyContext,
  AnyRef,
  ContextState,
  Episode,
  WorkingMemory,
  EpisodeHooks as HooksType,
} from "../types";

// =============================================================================
// EPISODE MANAGEMENT AND DETECTION
// =============================================================================

// Episode tracking state (per context)
const episodeState = new Map<
  string,
  {
    currentEpisodeLogs: AnyRef[];
    episodeStarted: boolean;
  }
>();
/**
 * Handles episode detection and storage using context-defined hooks
 *
 * Episodes are sequences of interactions that form meaningful units of conversation
 * or task execution. This function manages the lifecycle of episodes using hooks
 * defined in the context configuration.
 *
 * @template TContext - The context type
 * @param workingMemory - Current working memory state
 * @param ref - The log reference being processed
 * @param contextState - Current context state
 * @param agent - Agent instance for memory operations
 * @returns Promise that resolves when episode processing is complete
 */
export async function handleEpisodeHooks<TContext extends AnyContext>(
  workingMemory: WorkingMemory,
  ref: AnyRef,
  contextState: ContextState<TContext>,
  agent: AnyAgent
): Promise<void> {
  try {
    const hooks = contextState.context.episodeHooks;
    const contextId = contextState.id;

    // Initialize episode state for this context if needed
    if (!episodeState.has(contextId)) {
      episodeState.set(contextId, {
        currentEpisodeLogs: [],
        episodeStarted: false,
      });
    }

    const state = episodeState.get(contextId)!;

    // Check if we should start a new episode
    const shouldStart = hooks?.shouldStartEpisode
      ? await hooks.shouldStartEpisode(ref, workingMemory, contextState, agent)
      : defaultShouldStartEpisode(ref, workingMemory, contextState);

    if (shouldStart && !state.episodeStarted) {
      // Start new episode
      state.currentEpisodeLogs = [ref];
      state.episodeStarted = true;
      agent.logger.debug("context:episode", "Started new episode", {
        contextId,
        refId: ref.id,
        refType: ref.ref,
      });
      return;
    }

    // Add current ref to episode if one is active
    if (state.episodeStarted) {
      state.currentEpisodeLogs.push(ref);
    }

    // Check if we should end the current episode
    const shouldEnd = hooks?.shouldEndEpisode
      ? await hooks.shouldEndEpisode(ref, workingMemory, contextState, agent)
      : defaultShouldEndEpisode(ref, workingMemory, contextState);

    if (
      shouldEnd &&
      state.episodeStarted &&
      state.currentEpisodeLogs.length > 0
    ) {
      // Create and store the episode
      const episodeData = hooks?.createEpisode
        ? await hooks.createEpisode(
            state.currentEpisodeLogs,
            contextState,
            agent
          )
        : defaultCreateEpisode(state.currentEpisodeLogs, contextState);

      const episodeType = hooks?.classifyEpisode
        ? hooks.classifyEpisode(episodeData, contextState)
        : "conversation";

      const metadata = hooks?.extractMetadata
        ? hooks.extractMetadata(
            episodeData,
            state.currentEpisodeLogs,
            contextState
          )
        : {};

      // Build a normalized Episode and store via episodic memory for indexing
      const logs = state.currentEpisodeLogs;
      const startTime = logs[0]?.timestamp ?? Date.now();
      const endTime = ref.timestamp ?? Date.now();

      const candidate: any = episodeData;
      const providedLogs: AnyRef[] | undefined = Array.isArray(candidate?.logs)
        ? (candidate.logs as AnyRef[])
        : undefined;
      const summary: string | undefined =
        typeof candidate?.summary === "string" ? candidate.summary : undefined;
      const input = "input" in candidate ? candidate.input : undefined;
      const output = "output" in candidate ? candidate.output : undefined;
      const extraMeta: Record<string, any> =
        candidate?.metadata && typeof candidate.metadata === "object"
          ? candidate.metadata
          : {};

      const rawLogs =
        providedLogs && providedLogs.length > 0 ? providedLogs : logs;
      const finalLogs = sanitizeEpisodeLogs(rawLogs, hooks as HooksType | undefined);
      const finalSummary = summary ?? generateBasicSummary(finalLogs);

      const episode: Episode = {
        id: `${contextId}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        contextId,
        type: episodeType,
        summary: finalSummary,
        logs: finalLogs,
        metadata: { ...metadata, ...extraMeta },
        timestamp: endTime,
        startTime,
        endTime,
        duration: Math.max(0, endTime - startTime),
        input,
        output,
        context: contextId,
      };

      await agent.memory.episodes.store(episode);

      agent.logger.debug("context:episode", "Stored episode using hooks", {
        contextId,
        episodeType,
        logCount: state.currentEpisodeLogs.length,
        duration: ref.timestamp - (state.currentEpisodeLogs[0]?.timestamp || 0),
        episode,
      });

      if (!hooks?.createEpisode) {
        // TODO: add fact and entity extraction
      }

      // Reset episode state
      state.currentEpisodeLogs = [];
      state.episodeStarted = false;
    }
  } catch (error) {
    agent.logger.warn("context:episode", "Episode hook handling failed", {
      error: error instanceof Error ? error.message : error,
      contextId: contextState.id,
      refId: ref.id,
    });
  }
}

function generateBasicSummary(logs: AnyRef[]): string {
  const inputs = logs.filter((l) => l.ref === "input");
  const outputs = logs.filter((l) => l.ref === "output");
  const actions = logs.filter((l) => l.ref === "action_call");
  const parts: string[] = [];
  if (inputs.length > 0) {
    const first = inputs[0] as any;
    const msg = first?.content ?? first?.data?.content ?? "";
    if (msg) parts.push(`User: ${String(msg)}`);
  }
  if (actions.length > 0) {
    const names = actions
      .map((a: any) => a.name)
      .filter(Boolean)
      .join(", ");
    if (names) parts.push(`Actions: ${names}`);
  }
  if (outputs.length > 0) {
    const last = outputs[outputs.length - 1] as any;
    const msg = last?.content ?? last?.data?.content ?? "";
    if (msg) parts.push(`Assistant: ${String(msg)}`);
  }
  return parts.join(" | ");
}

function sanitizeEpisodeLogs(logs: AnyRef[], hooks?: HooksType): AnyRef[] {
  const defaultAllowed = [
    "input",
    "output",
    "action_call",
    "action_result",
    "event",
  ] as const;
  const includeRefs = hooks?.includeRefs || (defaultAllowed as any);
  const allowed = new Set(includeRefs);

  // First pass: filter by allowed refs and sanitize
  const filtered = logs
    .filter((l) => allowed.has(l.ref))
    .map((l) => sanitizeLogEntry(l, hooks));

  // Second pass: dedupe near-identical outputs that sometimes appear twice
  // Key by (name + content or data JSON). Keep the first occurrence.
  const seen = new Set<string>();
  const deduped: AnyRef[] = [];
  for (const l of filtered) {
    if (l.ref !== "output") {
      deduped.push(l);
      continue;
    }
    const name = (l as any).name ?? "";
    const dataStr = safeStringify((l as any).data ?? (l as any).content ?? "");
    const key = `out:${name}:${dataStr}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(l);
  }

  return deduped;
}

function safeStringify(v: unknown): string {
  try {
    return typeof v === "string" ? v : JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function sanitizeLogEntry<T extends AnyRef>(log: T, hooks?: HooksType): T {
  const copy: any = { ...log };
  if (copy.data && typeof copy.data === "object") {
    const d: any = { ...copy.data };
    for (const key of ["prompt", "instructions", "system", "template", "xml"]) {
      if (key in d) d[key] = "[redacted]";
    }
    if (copy.ref === "action_result") {
      if (typeof hooks?.actionResultRedactor === "function") {
        copy.data = hooks.actionResultRedactor(d);
      } else {
        const maxBytes = hooks?.maxActionResultBytes ?? 4096;
        try {
          const s = JSON.stringify(d);
          if (s.length > maxBytes) {
            copy.data = {
              __truncated: true,
              __bytes: s.length,
              __keys: Object.keys(d),
            };
          } else {
            copy.data = d;
          }
        } catch {
          copy.data = d;
        }
      }
      return copy as T;
    }
    copy.data = d;
  }
  return copy as T;
}

/**
 * Default episode start detection when no custom hooks are provided
 * @template TContext - The context type
 * @param ref - The log reference being evaluated
 * @param workingMemory - Current working memory state
 * @param contextState - Current context state
 * @returns True if an episode should start, false otherwise
 */
function defaultShouldStartEpisode<TContext extends AnyContext>(
  ref: AnyRef,
  workingMemory: WorkingMemory,
  contextState: ContextState<TContext>
): boolean {
  // Start episode on input refs (beginning of interaction)
  return ref.ref === "input";
}

/**
 * Default episode end detection when no custom hooks are provided
 * @template TContext - The context type
 * @param ref - The log reference being evaluated
 * @param workingMemory - Current working memory state
 * @param contextState - Current context state
 * @returns True if the current episode should end, false otherwise
 */
function defaultShouldEndEpisode<TContext extends AnyContext>(
  ref: AnyRef,
  workingMemory: WorkingMemory,
  contextState: ContextState<TContext>
): boolean {
  // End episode on processed output refs (end of interaction)
  return ref.ref === "output" && ref.processed;
}

/**
 * Default episode creation when no custom hooks are provided
 * Creates a structured episode from collected logs
 * @template TContext - The context type
 * @param logs - Array of log references that make up the episode
 * @param contextState - Current context state
 * @returns Episode data object with structured information
 */
function defaultCreateEpisode<TContext extends AnyContext>(
  logs: AnyRef[],
  contextState: ContextState<TContext>
): any {
  const inputs = logs.filter((log) => log.ref === "input");
  const outputs = logs.filter((log) => log.ref === "output");
  const actions = logs.filter((log) => log.ref === "action_call");
  const results = logs.filter((log) => log.ref === "action_result");
  const thoughts = logs.filter((log) => log.ref === "thought");

  return {
    type: "episode",
    context: contextState.id,
    inputs,
    outputs,
    actions,
    results,
    thoughts,
    allLogs: logs,
    summary: `Episode with ${inputs.length} inputs, ${outputs.length} outputs, ${actions.length} actions`,
    duration:
      logs.length > 0
        ? (logs[logs.length - 1]?.timestamp || 0) - (logs[0]?.timestamp || 0)
        : 0,
  };
}
