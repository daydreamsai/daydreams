/**
 * @fileoverview Context management and working memory utilities for Dreams AI agents
 *
 * This module provides the core functionality for managing conversation contexts,
 * working memory, and episode detection. It includes:
 *
 * - Context factory function for creating typed context definitions
 * - Working memory management and manipulation utilities
 * - Episode detection and lifecycle management
 * - Context state persistence and loading
 * - Fact and entity extraction from conversations
 *
 * @module context
 */

import { z, type ZodRawShape } from "zod/v4";
import type {
  AnyAction,
  AnyAgent,
  AnyContext,
  AnyRef,
  Context,
  ContextConfig,
  ContextSettings,
  ContextState,
  InferSchemaArguments,
  Log,
  WorkingMemory,
} from "./types";
import { formatContextLog } from "./formatters";
import { memory } from "./utils";
import { LogEventType, StructuredLogger } from "./logging-events";

// =============================================================================
// CONTEXT CREATION AND CONFIGURATION
// =============================================================================

/**
 * Creates a typed context configuration with builder methods
 *
 * This is the main factory function for creating context definitions in Dreams.
 * Contexts define reusable conversation patterns, memory structures, and behaviors
 * that can be executed by agents.
 *
 * @template TMemory - Type of memory data stored by this context
 * @template Args - Zod schema type for validating context arguments
 * @template Ctx - Type of context options/configuration data
 * @template Actions - Array type of actions available to this context
 * @template Events - Record type of events this context can emit
 *
 * @param config - Context configuration object defining behavior and structure
 * @returns A typed context configuration with fluent builder methods
 *
 * @example
 * ```typescript
 * const chatContext = context({
 *   type: "chat",
 *   schema: z.object({
 *     userId: z.string(),
 *     sessionId: z.string()
 *   }),
 *   setup: async (args) => ({
 *     startTime: Date.now(),
 *     userId: args.userId
 *   }),
 *   create: () => ({ messages: [], metadata: {} })
 * });
 * ```
 */
export function context<
  TMemory = any,
  Args extends z.ZodTypeAny | ZodRawShape = any,
  Ctx = any,
  Actions extends AnyAction[] = AnyAction[],
  Events extends Record<string, z.ZodTypeAny | z.ZodRawShape> = Record<
    string,
    z.ZodTypeAny | z.ZodRawShape
  >
>(
  config: ContextConfig<TMemory, Args, Ctx, Actions, Events>
): Context<TMemory, Args, Ctx, Actions, Events> {
  const ctx: Context<TMemory, Args, Ctx, Actions, Events> = {
    ...config,
    setActions(actions) {
      Object.assign(ctx, { actions });
      return ctx as any;
    },
    setInputs(inputs) {
      ctx.inputs = inputs;
      return ctx;
    },
    setOutputs(outputs) {
      ctx.outputs = outputs;
      return ctx;
    },
    use(composer) {
      ctx.__composers = ctx.__composers?.concat(composer) ?? [composer];
      return ctx;
    },
  };

  return ctx;
}

// =============================================================================
// WORKING MEMORY UTILITIES
// =============================================================================

/**
 * Retrieves and sorts working memory logs
 * @param memory - Working memory object
 * @param includeThoughts - Whether to include thought logs (default: true)
 * @returns Sorted array of memory logs
 */
export function getWorkingMemoryLogs(
  memory: Partial<WorkingMemory>,
  includeThoughts = true
): Log[] {
  return [
    ...(memory.inputs ?? []),
    ...(memory.outputs ?? []),
    ...(memory.calls ?? []),
    ...((includeThoughts ? memory.thoughts : undefined) ?? []),
    ...(memory.results ?? []),
    ...(memory.events ?? []),
  ].sort((a, b) => (a.timestamp > b.timestamp ? 1 : -1));
}

/**
 * Retrieves all working memory logs including system logs
 * @param memory - Working memory object
 * @param includeThoughts - Whether to include thought logs (default: true)
 * @returns Sorted array of all memory logs including steps and runs
 */
export function getWorkingMemoryAllLogs(
  memory: Partial<WorkingMemory>,
  includeThoughts = true
): AnyRef[] {
  return [
    ...(memory.inputs ?? []),
    ...(memory.outputs ?? []),
    ...(memory.calls ?? []),
    ...((includeThoughts ? memory.thoughts : undefined) ?? []),
    ...(memory.results ?? []),
    ...(memory.events ?? []),
    ...(memory.steps ?? []),
    ...(memory.runs ?? []),
  ].sort((a, b) => (a.timestamp >= b.timestamp ? 1 : -1));
}

/**
 * Formats working memory logs for display or processing
 * @param params - Configuration for formatting
 * @param params.memory - Working memory to format
 * @param params.processed - Whether to include processed or unprocessed logs
 * @param params.size - Optional limit on number of logs to include
 * @returns Array of formatted log strings
 */
export function formatWorkingMemory({
  memory,
  processed,
  size,
}: {
  memory: Partial<WorkingMemory>;
  processed: boolean;
  size?: number;
}) {
  let logs = getWorkingMemoryLogs(memory, false).filter(
    (i) => i.processed === processed
  );

  if (size) {
    logs = logs.slice(-size);
  }

  return logs.map((i) => formatContextLog(i)).flat();
}

/**
 * Creates a default working memory object
 * @returns Empty working memory with initialized arrays
 */
export function createWorkingMemory(): WorkingMemory {
  return {
    inputs: [],
    outputs: [],
    thoughts: [],
    calls: [],
    results: [],
    runs: [],
    steps: [],
    events: [],
  };
}

/**
 * Adds a log reference to the appropriate working memory collection
 * @param workingMemory - The working memory object to update
 * @param ref - The log reference to add
 * @throws Error if workingMemory or ref is null/undefined, or if ref type is invalid
 */
export function pushToWorkingMemory(workingMemory: WorkingMemory, ref: AnyRef) {
  if (!workingMemory || !ref) {
    throw new Error("workingMemory and ref must not be null or undefined");
  }

  switch (ref.ref) {
    case "action_call":
      workingMemory.calls.push(ref);
      break;
    case "action_result":
      workingMemory.results.push(ref);
      break;
    case "input":
      workingMemory.inputs.push(ref);
      break;
    case "output":
      workingMemory.outputs.push(ref);
      break;
    case "thought":
      workingMemory.thoughts.push(ref);
      break;
    case "event":
      workingMemory.events.push(ref);
      break;
    case "step":
      workingMemory.steps.push(ref);
      break;
    case "run":
      workingMemory.runs.push(ref);
      break;
    default:
      throw new Error("invalid ref");
  }
}

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
async function handleEpisodeHooks<TContext extends AnyContext>(
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

      // Store the episode using the unified memory API
      await agent.memory.remember(episodeData, {
        type: "episode",
        context: contextId,
        metadata: {
          episodeType,
          logCount: state.currentEpisodeLogs.length,
          startTime: state.currentEpisodeLogs[0]?.timestamp,
          endTime: ref.timestamp,
          ...metadata,
        },
      });

      agent.logger.debug("context:episode", "Stored episode using hooks", {
        contextId,
        episodeType,
        logCount: state.currentEpisodeLogs.length,
        duration: ref.timestamp - (state.currentEpisodeLogs[0]?.timestamp || 0),
      });

      // Also run fact and entity extraction if no custom episode creation
      if (!hooks?.createEpisode) {
        await tryLegacyExtraction(
          state.currentEpisodeLogs,
          contextState,
          agent
        );
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

/**
 * Legacy fact and entity extraction for default episodes
 * Processes logs to extract structured information when custom episode hooks aren't provided
 * @template TContext - The context type
 * @param logs - Array of log references from the episode
 * @param contextState - Current context state
 * @param agent - Agent instance for memory operations
 * @returns Promise that resolves when extraction is complete
 */
async function tryLegacyExtraction<TContext extends AnyContext>(
  logs: AnyRef[],
  contextState: ContextState<TContext>,
  agent: AnyAgent
): Promise<void> {
  try {
    // Find input/output pairs for legacy extraction
    const inputs = logs.filter((log) => log.ref === "input");
    const outputs = logs.filter((log) => log.ref === "output");

    for (const output of outputs) {
      // Find matching input for this output
      const matchingInput = inputs
        .filter((input) => input.timestamp <= output.timestamp)
        .sort((a, b) => b.timestamp - a.timestamp)[0];

      if (matchingInput) {
        await tryExtractFacts(matchingInput, output, contextState, agent);
        await tryExtractEntitiesAndRelationships(
          matchingInput,
          output,
          contextState,
          agent
        );
      }
    }
  } catch (error) {
    agent.logger.warn("context:episode", "Legacy extraction failed", {
      error: error instanceof Error ? error.message : error,
      contextId: contextState.id,
    });
  }
}

/**
 * Attempts to extract entities and relationships from conversation content
 *
 * Uses pattern matching to identify entities (people, organizations, places, products)
 * and relationships between them from input and output text content.
 *
 * @template TContext - The context type
 * @param inputRef - Input reference containing conversation input
 * @param outputRef - Output reference containing conversation output
 * @param contextState - Current context state
 * @param agent - Agent instance for storing extracted data
 * @returns Promise that resolves when extraction and storage is complete
 */
async function tryExtractEntitiesAndRelationships<TContext extends AnyContext>(
  inputRef: any,
  outputRef: any,
  contextState: ContextState<TContext>,
  agent: AnyAgent
): Promise<void> {
  try {
    // Extract entities and relationships from both input and output content
    const inputContent =
      typeof inputRef.content === "string"
        ? inputRef.content
        : JSON.stringify(inputRef.content);
    const outputContent =
      typeof outputRef.content === "string"
        ? outputRef.content
        : JSON.stringify(outputRef.content);

    const conversationText = `${inputContent} ${outputContent}`;

    // Simple entity patterns - can be enhanced with NER
    const entityPatterns = [
      // People (proper names)
      /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g,
      // Organizations (capitalized words, often with Inc, Ltd, Corp, etc.)
      /\b[A-Z][a-zA-Z\s&]+(Inc|Ltd|Corp|Company|Organization|Agency|Department)\b/g,
      // Places (capitalized locations)
      /\b(?:in|at|from|to) ([A-Z][a-zA-Z\s]+)\b/g,
      // Products/Services (often quoted or capitalized)
      /\b[A-Z][a-zA-Z0-9\s]+(?:API|SDK|Platform|Service|System|Tool|App|Software)\b/g,
    ];

    const relationshipPatterns = [
      // "X is Y" relationships
      /([A-Z][a-zA-Z\s]+) is (?:a|an|the) ([a-zA-Z\s]+)/g,
      // "X works for Y" relationships
      /([A-Z][a-zA-Z\s]+) works (?:for|at) ([A-Z][a-zA-Z\s]+)/g,
      // "X created Y" relationships
      /([A-Z][a-zA-Z\s]+) (?:created|developed|built|made) ([A-Z][a-zA-Z\s]+)/g,
      // "X uses Y" relationships
      /([A-Z][a-zA-Z\s]+) (?:uses|utilizes|employs) ([A-Z][a-zA-Z\s]+)/g,
    ];

    const extractedEntities = new Set<string>();
    const extractedRelationships: Array<{
      from: string;
      to: string;
      type: string;
    }> = [];

    // Extract entities
    for (const pattern of entityPatterns) {
      let match;
      while ((match = pattern.exec(conversationText)) !== null) {
        const entity = match[1] || match[0];
        if (entity && entity.trim().length > 2) {
          extractedEntities.add(entity.trim());
        }
      }
    }

    // Extract relationships
    for (const pattern of relationshipPatterns) {
      let match;
      while ((match = pattern.exec(conversationText)) !== null) {
        const from = match[1]?.trim();
        const to = match[2]?.trim();
        if (from && to && from.length > 2 && to.length > 2) {
          // Determine relationship type based on the pattern used
          let relationshipType = "related_to";
          if (pattern.source.includes("is")) relationshipType = "is_a";
          else if (pattern.source.includes("works"))
            relationshipType = "works_for";
          else if (pattern.source.includes("created"))
            relationshipType = "created";
          else if (pattern.source.includes("uses")) relationshipType = "uses";

          extractedRelationships.push({
            from,
            to,
            type: relationshipType,
          });

          // Add entities from relationships
          extractedEntities.add(from);
          extractedEntities.add(to);
        }
      }
    }

    // Store entities and relationships using the unified memory API
    if (extractedEntities.size > 0 || extractedRelationships.length > 0) {
      await agent.memory.remember(
        {
          entities: Array.from(extractedEntities).map((name) => ({
            id: name.toLowerCase().replace(/\s+/g, "_"),
            type: "entity",
            name,
            properties: {
              source: "conversation",
              context: contextState.id,
              extractedAt: Date.now(),
            },
          })),
          relationships: extractedRelationships.map((rel) => ({
            id: `${rel.from}_${rel.type}_${rel.to}`
              .toLowerCase()
              .replace(/\s+/g, "_"),
            from: rel.from.toLowerCase().replace(/\s+/g, "_"),
            to: rel.to.toLowerCase().replace(/\s+/g, "_"),
            type: rel.type,
            properties: {
              source: "conversation",
              context: contextState.id,
              extractedAt: Date.now(),
            },
          })),
        },
        {
          type: "graph",
          context: contextState.id,
          metadata: {
            source: "conversation",
            inputId: inputRef.id,
            outputId: outputRef.id,
            entityCount: extractedEntities.size,
            relationshipCount: extractedRelationships.length,
          },
        }
      );

      agent.logger.debug(
        "context:graph",
        "Extracted entities and relationships",
        {
          contextId: contextState.id,
          entityCount: extractedEntities.size,
          relationshipCount: extractedRelationships.length,
          inputId: inputRef.id,
          outputId: outputRef.id,
        }
      );
    }
  } catch (error) {
    agent.logger.warn(
      "context:graph",
      "Failed to extract entities and relationships",
      {
        error: error instanceof Error ? error.message : error,
        contextId: contextState.id,
      }
    );
  }
}

/**
 * Attempts to extract and store facts from conversation content
 *
 * Uses pattern matching to identify factual statements, definitions, and numerical
 * information from conversation text. This is a basic implementation that could
 * be enhanced with ML-based fact extraction models.
 *
 * @template TContext - The context type
 * @param inputRef - Input reference containing conversation input
 * @param outputRef - Output reference containing conversation output
 * @param contextState - Current context state
 * @param agent - Agent instance for storing extracted facts
 * @returns Promise that resolves when fact extraction and storage is complete
 * @todo Enhance with ML-based fact extraction models for better accuracy
 */
async function tryExtractFacts<TContext extends AnyContext>(
  inputRef: any,
  outputRef: any,
  contextState: ContextState<TContext>,
  agent: AnyAgent
): Promise<void> {
  try {
    // Extract facts from both input and output content
    const inputContent =
      typeof inputRef.content === "string"
        ? inputRef.content
        : JSON.stringify(inputRef.content);
    const outputContent =
      typeof outputRef.content === "string"
        ? outputRef.content
        : JSON.stringify(outputRef.content);

    // Look for factual patterns in the content
    const conversationText = `${inputContent} ${outputContent}`;

    // Simple fact patterns - can be enhanced with more sophisticated extraction
    const factualPatterns = [
      // Declarative statements
      /(?:^|\. )([A-Z][^.!?]*(?:is|are|was|were|has|have|had|will be|will have|can|could|should|would|must)[^.!?]*[.!?])/g,
      // Definitions
      /(?:^|\. )([A-Z][^.!?]*(?:means|refers to|is defined as|is called|is known as)[^.!?]*[.!?])/g,
      // Numerical facts
      /(?:^|\. )([A-Z][^.!?]*(?:\d+|numbers?|amounts?|costs?|prices?|dates?|years?)[^.!?]*[.!?])/g,
    ];

    const extractedFacts: string[] = [];

    for (const pattern of factualPatterns) {
      let match;
      while ((match = pattern.exec(conversationText)) !== null) {
        const fact = match[1].trim();
        if (fact.length > 10 && fact.length < 500) {
          // Reasonable fact length
          extractedFacts.push(fact);
        }
      }
    }

    // Store each extracted fact
    for (const factStatement of extractedFacts) {
      await agent.memory.remember(factStatement, {
        type: "fact",
        context: contextState.id,
        metadata: {
          source: "conversation",
          inputId: inputRef.id,
          outputId: outputRef.id,
          extractedAt: Date.now(),
          contextType: contextState.context.type,
        },
      });
    }

    if (extractedFacts.length > 0) {
      agent.logger.debug("context:facts", "Extracted facts from conversation", {
        contextId: contextState.id,
        factCount: extractedFacts.length,
        inputId: inputRef.id,
        outputId: outputRef.id,
      });
    }
  } catch (error) {
    agent.logger.warn("context:facts", "Failed to extract facts", {
      error: error instanceof Error ? error.message : error,
      contextId: contextState.id,
    });
  }
}

/**
 * Pushes an entry to working memory and handles episode detection
 *
 * This is the main function for adding entries to working memory while
 * automatically handling episode lifecycle management through context hooks.
 *
 * @template TContext - The context type
 * @param workingMemory - Working memory object to update
 * @param ref - Log reference to add
 * @param contextState - Current context state
 * @param agent - Agent instance for episode processing
 * @returns Promise resolving to the updated working memory
 */
export async function pushToWorkingMemoryWithManagement<
  TContext extends AnyContext
>(
  workingMemory: WorkingMemory,
  ref: AnyRef,
  contextState: ContextState<TContext>,
  agent: AnyAgent
): Promise<WorkingMemory> {
  pushToWorkingMemory(workingMemory, ref);

  // Handle episode detection and storage using hooks
  await handleEpisodeHooks(workingMemory, ref, contextState, agent);

  return workingMemory;
}

/**
 * Counts the total number of entries across all working memory collections
 * @param workingMemory - Working memory object to count
 * @returns Total number of entries in working memory
 */
export function getWorkingMemorySize(workingMemory: WorkingMemory): number {
  return (
    workingMemory.inputs.length +
    workingMemory.outputs.length +
    workingMemory.thoughts.length +
    workingMemory.calls.length +
    workingMemory.results.length +
    workingMemory.runs.length +
    workingMemory.steps.length +
    workingMemory.events.length
  );
}

/**
 * Default working memory configuration
 *
 * Provides a standard memory container configuration that creates
 * working memory instances with the default structure and initialization.
 */
export const defaultWorkingMemory = memory<WorkingMemory>({
  key: "working-memory",
  create: createWorkingMemory,
});

// =============================================================================
// CONTEXT STATE MANAGEMENT
// =============================================================================

/**
 * Generates a unique context identifier from context definition and arguments
 * @template TContext - The context type
 * @param context - Context definition
 * @param args - Context arguments conforming to the context's schema
 * @returns Unique context identifier string (type:key or just type)
 */
export function getContextId<TContext extends AnyContext>(
  context: TContext,
  args: z.infer<TContext["schema"]>
) {
  const key = context.key ? context.key(args) : undefined;
  return key ? [context.type, key].join(":") : context.type;
}

/**
 * Creates a new context state instance with initialized memory and configuration
 *
 * This function handles the complete setup of a context state including:
 * - ID generation and key resolution
 * - Settings configuration and merging
 * - Memory initialization (loading existing or creating new)
 * - Options setup through context.setup function
 * - Structured logging of context creation
 *
 * @template TContext - The context type
 * @param params - Configuration object for context state creation
 * @param params.agent - Agent instance
 * @param params.context - Context definition
 * @param params.args - Context arguments
 * @param params.contexts - Array of related context IDs (default: [])
 * @param params.settings - Initial context settings (default: {})
 * @returns Promise resolving to the new context state
 */
export async function createContextState<TContext extends AnyContext>({
  agent,
  context,
  args,
  contexts = [],
  settings: initialSettings = {},
}: {
  agent: AnyAgent;
  context: TContext;
  args: InferSchemaArguments<TContext["schema"]>;
  contexts?: string[];
  settings?: ContextSettings;
}): Promise<ContextState<TContext>> {
  const key = context.key ? context.key(args) : undefined;
  const id = key ? [context.type, key].join(":") : context.type;

  // Log structured context create event if structured logger is available
  const structuredLogger =
    agent.container?.resolve<StructuredLogger>("structuredLogger");
  if (structuredLogger) {
    structuredLogger.logEvent({
      eventType: LogEventType.CONTEXT_CREATE,
      timestamp: Date.now(),
      requestContext: {
        requestId: "context-create", // Default since we may not have request context
        trackingEnabled: false,
      },
      contextType: context.type,
      contextId: id,
      argsHash: key,
    });
  }

  const settings: ContextSettings = {
    model: context.model,
    maxSteps: context.maxSteps,
    maxWorkingMemorySize: context.maxWorkingMemorySize,
    modelSettings: {
      ...(agent.modelSettings || {}),
      ...(context.modelSettings || {}),
      ...(initialSettings.modelSettings || {}),
    },
    ...initialSettings,
  };

  const options = context.setup
    ? await context.setup(args, settings, agent)
    : {};

  const memory =
    (context.load
      ? await context.load(id, { options, settings })
      : await agent.memory.kv.get(`memory:${id}`)) ??
    (context.create
      ? await Promise.try(
          context.create,
          { key, args, id, options, settings },
          agent
        )
      : {});

  return {
    id,
    key,
    args,
    options,
    context,
    memory,
    settings,
    contexts,
  };
}

// =============================================================================
// PERSISTENCE AND STORAGE
// =============================================================================

/**
 * Retrieves working memory for a context, creating it if it doesn't exist
 * @param agent - Agent instance for memory access
 * @param contextId - Unique identifier for the context
 * @returns Promise resolving to the working memory object
 */
export async function getContextWorkingMemory(
  agent: AnyAgent,
  contextId: string
) {
  let workingMemory = await agent.memory.kv.get<WorkingMemory>(
    ["working-memory", contextId].join(":")
  );

  if (!workingMemory) {
    workingMemory = await defaultWorkingMemory.create();
    await agent.memory.kv.set(
      ["working-memory", contextId].join(":"),
      workingMemory
    );
  }

  return workingMemory;
}

/**
 * Persists working memory for a context to storage
 * @param agent - Agent instance for memory access
 * @param contextId - Unique identifier for the context
 * @param workingMemory - Working memory object to save
 * @returns Promise resolving when save is complete
 */
export async function saveContextWorkingMemory(
  agent: AnyAgent,
  contextId: string,
  workingMemory: WorkingMemory
) {
  return await agent.memory.kv.set(
    ["working-memory", contextId].join(":"),
    workingMemory
  );
}

/**
 * Snapshot format for persisting context state to storage
 * Models are stored as string IDs rather than object references
 */
type ContextStateSnapshot = {
  /** Unique context identifier */
  id: string;
  /** Context type name */
  type: string;
  /** Context arguments */
  args: any;
  /** Optional context key */
  key?: string;
  /** Context settings with model stored as string ID */
  settings: Omit<ContextSettings, "model"> & { model?: string };
  /** Array of related context IDs */
  contexts: string[];
};

/**
 * Persists context state and memory to storage
 *
 * Saves both the context metadata (settings, args, etc.) and the context's
 * memory data. Uses custom save function if provided by the context, otherwise
 * saves memory to default key-value storage.
 *
 * @param agent - Agent instance for storage access
 * @param state - Context state to save
 * @returns Promise resolving when save is complete
 */
export async function saveContextState(agent: AnyAgent, state: ContextState) {
  const { id, context, key, args, settings, contexts } = state;

  // Log structured context update event
  const structuredLogger =
    agent.container?.resolve<StructuredLogger>("structuredLogger");
  if (structuredLogger) {
    structuredLogger.logEvent({
      eventType: LogEventType.CONTEXT_UPDATE,
      timestamp: Date.now(),
      requestContext: {
        requestId: "context-save", // Default since we may not have request context
        trackingEnabled: false,
      },
      contextType: context.type,
      contextId: id,
      updateType: "state",
      details: {
        hasMemory: !!state.memory,
        contextCount: contexts.length,
        hasCustomSave: !!state.context.save,
      },
    });
  }

  await agent.memory.kv.set<ContextStateSnapshot>(`context:${id}`, {
    id,
    type: context.type,
    key,
    args,
    settings: {
      ...settings,
      model:
        typeof settings.model === "string"
          ? settings.model
          : settings.model?.modelId,
    },
    contexts,
  });

  if (state.context.save) {
    await state.context.save(state);
  } else {
    await agent.memory.kv.set<any>(`memory:${id}`, state.memory);
  }
}

/**
 * Loads context state metadata from storage
 * @param agent - Agent instance for storage access
 * @param context - Context definition
 * @param contextId - Unique identifier for the context
 * @returns Promise resolving to context state metadata or null if not found
 * @todo Implement agent model resolution for loaded contexts
 */
export async function loadContextState(
  agent: AnyAgent,
  context: AnyContext,
  contextId: string
): Promise<Omit<ContextState, "options" | "memory"> | null> {
  const state = await agent.memory.kv.get<ContextStateSnapshot>(
    `context:${contextId}`
  );

  if (!state) return null;

  return {
    ...state,
    context,
    settings: {
      ...state?.settings,
      // TODO: Implement agent model resolution
      model: undefined,
    },
  };
}

// =============================================================================
// CONTEXT UTILITIES AND HELPERS
// =============================================================================

/**
 * Saves the index of all active context IDs to storage
 * @param agent - Agent instance for storage access
 * @param contextIds - Set of active context IDs
 * @returns Promise resolving when index is saved
 */
export async function saveContextsIndex(
  agent: AnyAgent,
  contextIds: Set<string>
) {
  await agent.memory.kv.set<string[]>(
    "contexts",
    Array.from(contextIds.values())
  );
}

/**
 * Retrieves context metadata for a given context ID
 * @param contexts - Map of loaded context states
 * @param contextId - Context ID to retrieve data for
 * @returns Context metadata object
 */
function getContextData(
  contexts: Map<string, ContextState>,
  contextId: string
) {
  if (contexts.has(contextId)) {
    const state = contexts.get(contextId)!;
    return {
      id: contextId,
      type: state.context.type,
      key: state.key,
      args: state.args,
      settings: state.settings,
    };
  }

  const [type, key] = contextId.split(":");

  return {
    id: contextId,
    type,
    key,
  };
}

/**
 * Retrieves metadata for all active contexts
 * @param contextIds - Set of context IDs to retrieve
 * @param contexts - Map of loaded context states
 * @returns Array of context metadata objects
 */
export function getContexts(
  contextIds: Set<string>,
  contexts: Map<string, ContextState>
) {
  return Array.from(contextIds.values())
    .filter((t) => !!t)
    .map((id) => getContextData(contexts, id));
}

/**
 * Deletes all data associated with a context from storage
 * @param agent - Agent instance for storage access
 * @param contextId - Unique identifier for the context to delete
 * @returns Promise resolving when deletion is complete
 */
export async function deleteContext(agent: AnyAgent, contextId: string) {
  await agent.memory.kv.delete(`context:${contextId}`);
  await agent.memory.kv.delete(`memory:${contextId}`);
  await agent.memory.kv.delete(`working-memory:${contextId}`);

  // Clean up episode state to prevent memory leak
  episodeState.delete(contextId);
}
