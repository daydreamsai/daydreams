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

  const settings: ContextSettings = {
    model: context.model,
    maxSteps: context.maxSteps,
    maxWorkingMemorySize: context.maxWorkingMemorySize,
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
