import { z, type ZodRawShape } from "zod";
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
import {
  resolveCapabilityConfig,
  createCapabilityIndex,
  getActiveCapabilities,
} from "./capabilities";

/**
 * Creates a context configuration
 * @template Memory - Type of working memory
 * @template Args - Zod schema type for context arguments
 * @template Ctx - Type of context data
 * @template Exports - Type of exported data
 * @param ctx - Context configuration object
 * @returns Typed context configuration
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

/**
 * Default working memory config
 * Provides a memory container with standard working memory structure
 */
export const defaultWorkingMemory = memory<WorkingMemory>({
  key: "working-memory",
  create: createWorkingMemory,
});

export function getContextId<TContext extends AnyContext>(
  context: TContext,
  args: z.infer<TContext["schema"]>
) {
  const key = context.key ? context.key(args) : undefined;
  return key ? [context.type, key].join(":") : context.type;
}

/**
 * Resolves a dynamic resolver function or returns the static value
 */
async function resolveDynamic<T>(
  resolver: T | ((state: any) => T | Promise<T>) | undefined,
  state: any
): Promise<T | undefined> {
  if (typeof resolver === "function") {
    return await (resolver as (state: any) => T | Promise<T>)(state);
  }
  return resolver;
}

/**
 * Initializes capability awareness for a context state if enabled at framework level
 */
async function initializeCapabilityAwareness<TContext extends AnyContext>(
  contextState: ContextState<TContext>
): Promise<void> {
  // Check if capability awareness is enabled at context level or framework level
  const contextConfig = contextState.context.capabilityAwareness;

  // For now, we'll get the agent from global context or try to resolve it
  // In the future, this should be passed through the context resolution chain
  const agent =
    (contextState as any).agent || (globalThis as any).__currentAgent;

  if (!agent) {
    // If no agent available, skip capability awareness initialization
    return;
  }

  // Get framework-level configuration from agent
  // Access the agent's capability awareness configuration if available
  const frameworkConfig = (agent as any).capabilityAwareness || {
    enabled: true,
  };

  // Resolve effective configuration
  const effectiveConfig = resolveCapabilityConfig(
    frameworkConfig,
    contextConfig
  );

  if (!effectiveConfig.enabled) {
    return; // Capability awareness disabled
  }

  // Initialize capability namespace if not already present
  if (!contextState._capabilities) {
    contextState._capabilities = {
      index: createCapabilityIndex(),
      active: [],
      strategy: {
        type: "context-aware",
        maxActiveActions: effectiveConfig.maxActiveCapabilities,
      },
      config: effectiveConfig,
      lastDiscovery: undefined,
    };
  }

  // If auto-discovery is enabled and we haven't discovered yet, trigger discovery
  if (
    effectiveConfig.autoDiscover &&
    contextState._capabilities.index.actions.size === 0
  ) {
    try {
      const { discoverAgentCapabilities } = await import("./capabilities");
      contextState._capabilities.index = await discoverAgentCapabilities(
        agent,
        effectiveConfig.sources
      );
      contextState._capabilities.lastDiscovery = Date.now();
    } catch (error) {
      // If discovery fails, continue without capability awareness
      console.warn("Failed to auto-discover capabilities:", error);
    }
  }
}

/**
 * Resolves all dynamic capabilities for a context state
 */
export async function resolveContextCapabilities<TContext extends AnyContext>(
  contextState: ContextState<TContext>
): Promise<void> {
  const { context } = contextState;
  const now = Date.now();

  // Initialize capability awareness if enabled (framework-level)
  await initializeCapabilityAwareness(contextState);

  // Resolve actions
  if (context.actions) {
    contextState._resolvedActions = await resolveDynamic(
      context.actions,
      contextState
    );
  }

  // Resolve inputs
  if (context.inputs) {
    contextState._resolvedInputs = await resolveDynamic(
      context.inputs,
      contextState
    );
  }

  // Resolve outputs
  if (context.outputs) {
    contextState._resolvedOutputs = await resolveDynamic(
      context.outputs,
      contextState
    );
  }

  // Resolve contexts
  if (context.contexts) {
    contextState._resolvedContexts = await resolveDynamic(
      context.contexts,
      contextState
    );
  }

  // Resolve focus
  if (context.focus) {
    contextState._resolvedFocus = await resolveDynamic(
      context.focus,
      contextState
    );
  }

  // Resolve capabilities
  if (context.capabilities) {
    contextState._resolvedCapabilities = await resolveDynamic(
      context.capabilities,
      contextState
    );
  }

  // Resolve loading strategy
  if (context.loadingStrategy) {
    contextState._resolvedLoadingStrategy = await resolveDynamic(
      context.loadingStrategy,
      contextState
    );
  }

  // Add dynamically loaded capabilities to resolved actions
  if (
    contextState._capabilities?.index &&
    contextState._capabilities.active.length > 0
  ) {
    const activeCapabilities = getActiveCapabilities(contextState as any);

    if (activeCapabilities.length > 0) {
      contextState._resolvedActions = [
        ...(contextState._resolvedActions || []),
        ...activeCapabilities,
      ];
    }
  }

  // Update resolution timestamp
  contextState._lastResolution = now;
}

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
      : await agent.memory.store.get(`memory:${id}`)) ??
    (context.create
      ? await context.create({ key, args, id, options, settings }, agent)
      : {});

  const contextState: ContextState<TContext> = {
    id,
    key,
    args,
    options,
    context,
    memory,
    settings,
    contexts,
  };

  // Store agent reference temporarily for capability resolution
  (contextState as any).agent = agent;

  // Resolve dynamic capabilities
  await resolveContextCapabilities(contextState);

  // Clean up agent reference (not needed in persisted state)
  delete (contextState as any).agent;

  return contextState;
}

export async function getContextWorkingMemory(
  agent: AnyAgent,
  contextId: string
) {
  let workingMemory = await agent.memory.store.get<WorkingMemory>(
    ["working-memory", contextId].join(":")
  );

  if (!workingMemory) {
    workingMemory = await defaultWorkingMemory.create();
    await agent.memory.store.set(
      ["working-memory", contextId].join(":"),
      workingMemory
    );
  }

  return workingMemory;
}

export async function saveContextWorkingMemory(
  agent: AnyAgent,
  contextId: string,
  workingMemory: WorkingMemory
) {
  return await agent.memory.store.set(
    ["working-memory", contextId].join(":"),
    workingMemory
  );
}

type ContextStateSnapshot = {
  id: string;
  type: string;
  args: any;
  key?: string;
  settings: Omit<ContextSettings, "model"> & { model?: string };
  contexts: string[];
};

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

  await agent.memory.store.set<ContextStateSnapshot>(`context:${id}`, {
    id,
    type: context.type,
    key,
    args,
    settings: {
      ...settings,
      model: settings.model?.modelId,
    },
    contexts,
  });

  if (state.context.save) {
    await state.context.save(state);
  } else {
    await agent.memory.store.set<any>(`memory:${id}`, state.memory);
  }
}
export async function loadContextState(
  agent: AnyAgent,
  context: AnyContext,
  contextId: string
): Promise<Omit<ContextState, "options" | "memory"> | null> {
  const state = await agent.memory.store.get<ContextStateSnapshot>(
    `context:${contextId}`
  );

  if (!state) return null;

  return {
    ...state,
    context,
    settings: {
      ...state?.settings,
      // todo: agent resolve model?
      model: undefined,
    },
  };
}

export async function saveContextsIndex(
  agent: AnyAgent,
  contextIds: Set<string>
) {
  await agent.memory.store.set<string[]>(
    "contexts",
    Array.from(contextIds.values())
  );
}

function getContextData(
  contexts: Map<string, ContextState>,
  contextId: string
) {
  // todo: verify type?
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

export function getContexts(
  contextIds: Set<string>,
  contexts: Map<string, ContextState>
) {
  return Array.from(contextIds.values())
    .filter((t) => !!t)
    .map((id) => getContextData(contexts, id));
}

export async function deleteContext(agent: AnyAgent, contextId: string) {
  await agent.memory.store.delete(`context:${contextId}`);
  await agent.memory.store.delete(`memory:${contextId}`);
  await agent.memory.store.delete(`working-memory:${contextId}`);
}
