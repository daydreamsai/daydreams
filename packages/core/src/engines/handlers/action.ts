import type {
  ActionCallContext,
  ActionConfig,
  AnyAction,
} from "@/types/action";
import type {
  ActionCallMemory,
  ActionResultMemory,
  WorkingMemoryCtx,
} from "@/types/wm";
import { parseContent, parseSchema } from "./parse";
import { NotFoundError, ParsingError } from "./errors";
import type { ActionCtxRef } from "@/types/refs";
import type {
  AnyContext,
  Context,
  ContextState,
  ContextStateApi,
} from "@/types/context";
import type { AnyAgent } from "@/types/agent";
import type { Engine } from "@/types/engine";
import { runActionTask } from "@/tasks/actions";
import { TaskManager } from "@/managers/tasks";
import { workingMemories } from "@/wm";

export function parseActionCallContent({
  memory,
  action,
}: {
  memory: ActionCallMemory;
  action: AnyAction;
}) {
  try {
    if (memory.chunks.length > 0) {
      memory.raw = memory.chunks
        .filter((chunk) => chunk.type === "content")
        .map((c) => c.content)
        .join("")
        .trim();
    }

    if (action.parser) {
      return action.parser(memory);
    } else {
      return parseContent({
        content: memory.raw,
        schema: action.schema,
        parser: action.callFormat,
      });
    }
  } catch (error) {
    throw new ParsingError(memory, error);
  }
}

export async function resolveActionCall({
  memory,
  actions,
}: {
  memory: ActionCallMemory;
  actions: ActionCtxRef[];
}) {
  const contextKey = undefined;
  const action = actions.find(
    (a) =>
      (contextKey ? contextKey === a.ctx.id : true) &&
      a.action.name === memory.name
  );

  if (!action) throw new NotFoundError(memory);

  return action;
}

export async function prepareAction({
  action,
  context,
  ctx,
  wm,
  agent,
  engine,
}: {
  action: AnyAction;
  context: AnyContext;
  ctx: ContextState<AnyContext>;
  wm: WorkingMemoryCtx;
  agent: AnyAgent;
  engine: Engine;
}): Promise<ActionCtxRef | undefined> {
  if (action.context && action.context.name !== context.name) return undefined;

  const enabled = action.enabled
    ? action.enabled({
        ctx,
        wm,
        engine,
      })
    : true;

  return enabled
    ? {
        action,
        ctx: {
          name: ctx.context.name,
          id: ctx.id,
        },
      }
    : undefined;
}

export async function prepareActions(params: {
  context: Context;
  ctx: ContextState<AnyContext>;
  wm: WorkingMemoryCtx;
  agent: AnyAgent;
  engine: Engine;
  actions: AnyAction[] | Record<string, ActionConfig>;
}): Promise<ActionCtxRef[]> {
  return Promise.all(
    Array.isArray(params.actions)
      ? params.actions.map((action) =>
          prepareAction({
            action,
            ...params,
          })
        )
      : Object.entries(params.actions).map(([name, action]) =>
          prepareAction({
            action: {
              name,
              ...action,
            },
            ...params,
          })
        )
  ).then((t) => t.filter((t) => !!t));
}

export async function handleActionCall({
  action,
  agent,
  abortSignal,
  ctx,
  queueKey,
}: {
  ctx: ActionCallContext;
  action: AnyAction;
  agent: AnyAgent;
  abortSignal: AbortSignal;
  queueKey: string | undefined;
}): Promise<ActionResultMemory> {
  const data = await agent.container.resolve<TaskManager>("tasks").enqueue(
    runActionTask,
    {
      action,
      agent,
      ctx,
    },
    {
      retry: action.retry,
      abortSignal,
      // queueKey: queueKey ?? (await resolve(action.queueKey, [callCtx])),
    }
  );

  const result = workingMemories.action_result(
    {
      name: action.name,
      schema: action.schema,
      content: data,
    },
    ctx.memory
  );

  // if (action.format) result.formatted = action.format(result);

  if (action.onSuccess) {
    await Promise.try(action.onSuccess, result, ctx, agent);
  }

  return result;
}

export async function prepareActionCall({
  memory,
  action: { action },
  ctx,
  api,
  wm,
  abortSignal,
  engine,
}: {
  memory: ActionCallMemory;
  action: ActionCtxRef;
  ctx: ContextState<AnyContext>;
  api: ContextStateApi<AnyContext>;
  wm: WorkingMemoryCtx;
  abortSignal: AbortSignal;
  engine: Engine;
}) {
  const callCtx: ActionCallContext<any> = {
    ctx,
    wm,
    memory,
    engine,
    abortSignal,
    ...api,
    // __thread:
  };

  memory.content = memory.raw
    ? parseSchema(action.schema, memory.raw)
    : parseActionCallContent({ memory, action });

  return callCtx;
}
