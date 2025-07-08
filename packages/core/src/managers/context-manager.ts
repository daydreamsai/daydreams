import { z } from "zod";
import { resolve } from "../utils";
import { getContextId } from "../context";
import { workingMemory } from "../wm";
import type { Logger } from "./logger";
import type {
  AnyContext,
  Context,
  ContextManager,
  ContextSettings,
  ContextState,
  ContextStateCtx,
  InferContextArgs,
  InferContextDeps,
  InferContextState,
} from "@/types/context";
import type { KVStore, MemoryStore, MemoryStoreManager } from "@/types/memory";
import type { Registry } from "@/types/managers";
import type { Container } from "@/types/container";
import { parseSchema } from "@/engines/handlers/parse";
import { memoryStore } from "@/definitions";
import type { AnyAgent } from "@/types/agent";
import type { Optional } from "@/types/utils";

function getContexKey(context: AnyContext, id: string) {
  return [context.name, id].join(":");
}

function splitContexKey(contextKey: string): [name: string, id: string] {
  return contextKey.split(":") as [name: string, id: string];
}

// todo: indexes
export function createContextManager({
  kv,
  registry,
  container,
  memories,
}: {
  kv: KVStore;
  registry: Registry;
  container: Container;
  memories: MemoryStoreManager;
}): ContextManager {
  const ids = new Set<string>();
  const ctxs = new Map<string, ContextState>();

  async function loadContextState<TContext extends AnyContext>(params: {
    context: TContext;
    id: string;
  }) {
    const contextKey = getContexKey(params.context, params.id);
    const state = await memories.load(contextStateMemory, contextKey);

    if (state?.data) {
      const ctx = await createContext({
        agent: container.resolve("agent"),
        context: params.context,
        args: state.data.args,
        settings: {
          ...state.data.settings,
          model: undefined,
        },
        memories,
      });

      ctxs.set(contextKey, ctx);
      return ctx;
    }

    return null;
  }

  return {
    ids,
    ctxs,

    getId(params) {
      return getContextId(params.context, params.args);
    },

    async getById(context, id) {
      const contextKey = getContexKey(context, id);
      if (ctxs.has(contextKey))
        return ctxs.get(contextKey)! as ContextState<typeof context>;

      return await loadContextState({ context, id });
    },

    async get(params) {
      let ctx = await this.load(params);

      if (!ctx) {
        ctx = await createContext({
          agent: container.resolve("agent"),
          context: params.context,
          args: params.args,
          memories,
        });

        await this.save(ctx);
      }

      return ctx;
    },

    async load(params) {
      const context = registry.resolve("context", params.context);

      const args = parseSchema(context.schema, params.args);
      const id = getContextId(context, args);
      const contextKey = getContexKey(context, id);

      if (!ctxs.has(contextKey) && ids.has(contextKey)) {
        return loadContextState({ context: context, id });
      }

      return (
        (ctxs.get(contextKey) as ContextState<typeof params.context>) ?? null
      );
    },

    async save(ctx) {
      const { id, context } = ctx;

      const contextKey = getContexKey(context, id);

      ids.add(contextKey);
      ctxs.set(contextKey, ctx);

      await memories.set(
        contextStateMemory,
        { id: getContexKey(context, id) },
        getContextStateSnaphost(ctx)
      );

      if (ctx.state) {
        await memories.save(ctx.state.memory);
      }

      await saveContextsIndex(kv, ids);

      return true;
    },

    async del({ context, id }) {
      const contextKey = getContexKey(context, id);

      ctxs.delete(contextKey);
      ids.delete(contextKey);

      if (context.state && typeof context.state !== "function") {
        // await memories.del(
        //   {
        //     name: context.name,
        //     ...context.state,
        //   },
        //   id
        // );
      }

      await memories.del(contextStateMemory, contextKey);
      await memories.del(workingMemory, contextKey);
    },
  };
}

export async function loadContexts({
  kv,
  ctxs,
  logger,
}: {
  kv: KVStore;
  ctxs: ContextManager;
  logger: Logger;
}) {
  logger.debug("ctxs:boot", "Loading saved contexts");
  const savedContexts = await kv.get<string[]>("contexts");

  if (savedContexts) {
    for (const id of savedContexts) {
      ctxs.ids.add(id);
    }
  }
}

async function resolveContextState<TContext extends Context>({
  context,
  id,
  args,
  deps,
  settings,
  agent,
  memories,
}: {
  context: TContext;
  id: string;
  args: InferContextArgs<TContext>;
  deps: InferContextDeps<TContext>;
  settings: ContextSettings;
  agent: AnyAgent;
  memories: MemoryStoreManager;
}): Promise<
  InferContextState<TContext> extends undefined
    ? undefined
    : ContextStateCtx<InferContextState<TContext>>
> {
  let config:
    | (Optional<
        MemoryStore<InferContextState<TContext>, any, any>,
        "name" | "create"
      > & { initial?: InferContextState<TContext> })
    | undefined = undefined;

  if (typeof context.state === "function") {
    config = await resolve(context.state, [
      { id, args, settings, deps },
      agent,
    ]);
  } else if (context.state) {
    config = context.state;
  }

  if (config) {
    const mem = memoryStore({
      ...config,
      create: config.create ?? (() => config.initial as any),
      name: config.name ?? context.name,
    });

    const memState = await memories.get(mem, id);

    const ctx: ContextStateCtx<InferContextState<TContext>> = {
      memory: memState,
      set(params) {
        if (typeof params === "function") {
          memState.data = (params as any)(memState.data);
        } else {
          memState.data = params;
        }
      },
      get() {
        return memState.data;
      },
    };

    return ctx as any;
  }

  return undefined as any;
  // return await agent.memory.get(memory as InferContextMemory<TContext>, args);
}

export async function createContext<TContext extends AnyContext>({
  agent,
  context,
  args,
  settings: initialSettings = {},
  memories,
  // contexts = [],
}: {
  agent: AnyAgent;
  context: TContext;
  args: InferContextArgs<TContext>;
  settings?: ContextSettings;
  memories: MemoryStoreManager;
  // contexts?: string[];
}): Promise<ContextState<TContext>> {
  const id = getContextId(context, args);

  const settings: ContextSettings = {
    ...context.settings,
    ...initialSettings,
  };

  const deps = context.setup
    ? await context.setup({ id, args, settings }, agent)
    : undefined;

  const state = await resolveContextState({
    agent,
    id,
    args,
    context,
    deps,
    settings,
    memories,
  });

  return {
    id,
    args,
    deps,
    settings,
    context,
    state,
  };
}

export type ContextStateSnapshot = {
  id: string;
  name: string;
  args: any;
  settings: Omit<ContextSettings, "model"> & { model?: string };
  // contexts: string[];
};

export async function saveContextsIndex(kv: KVStore, contextIds: Set<string>) {
  await kv.set<string[]>("contexts", Array.from(contextIds.values()));
}

function getContextData(
  contexts: Map<string, ContextState>,
  contextKey: string
) {
  const [name, id] = splitContexKey(contextKey);

  if (contexts.has(contextKey)) {
    const state = contexts.get(contextKey)!;
    return {
      id,
      name: state.context.name,
      args: state.args,
      settings: state.settings,
    };
  }

  return {
    id,
    name,
  };
}

const contextStateMemory = memoryStore({
  name: "ctx",
  schema: {
    id: z.string(),
  },
  id: ({ id }) => id,
  create(): ContextStateSnapshot | undefined {
    return undefined;
  },
});

function getContextStateSnaphost(state: ContextState): ContextStateSnapshot {
  return {
    id: state.id,
    name: state.context.name,
    args: state.args,
    settings: {
      ...state.settings,
      model: state.settings.model?.modelId,
    },
  };
}
