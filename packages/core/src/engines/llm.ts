import type { Engine, EngineEventMap, StepEngine } from "@/types/engine";
import { createEngineState, type EngineState } from "./state";
import type { Router, RouterCtx } from "./router";
import { workingMemories } from "@/wm";
import type { Runner } from "@/managers/runner";
import type { InputMemory, OutputMemory, ActionCallMemory } from "@/types/wm";
import type { AnyAgent } from "@/types/agent";
import type { ContextState, ContextStateApi } from "@/types/context";
import type { WorkingMemoryCtx } from "@/types/wm";
import { type ErrorRef } from "./handlers/errors";
import { prepareContexts } from "./handlers/context";
import type { EventEmitter } from "@/types/managers";
import type { Input } from "@/types/components";
import type { LanguageModel, LLMGenerateSettings } from "@/types/models";
import type { SystemRef } from "@/types/system";
import type { ActionCtxRef, OutputCtxRef, ToolCtxRef } from "@/types/refs";
import type { AnyMemory, MemoryChunk } from "@/types/memory";

const DEFAULT_MAX_STEPS = 5;

export function getMaxSteps(state: LLMEngineState) {
  return state.components.contexts.reduce(
    (maxSteps, ctxState) => Math.max(maxSteps, ctxState.settings.maxSteps ?? 0),
    DEFAULT_MAX_STEPS
  );
}

export function shouldContinue(state: LLMEngineState) {
  for (const ctx of state.components.contexts) {
    if (ctx.context.hooks?.shouldContinue?.(ctx)) return true;
  }

  const pendingResults = state.chain.filter((mem) =>
    mem.labels.includes("unprocessed")
  );

  return pendingResults.length > 0;
}

export async function handleChunk(
  engine: Engine,
  state: LLMEngineState,
  chunk: MemoryChunk
) {
  switch (chunk.type) {
    case "memory":
      state.__memories.set(chunk.memory.id, chunk.memory);
      await engine.push(chunk.memory, chunk.done);
      break;
    case "done":
      const memory = state.__memories.get(chunk.id);
      if (memory) await engine.push(memory, true);
      break;
    case "data":
    case "content":
      state.__memories.get(chunk.id)?.chunks.push(chunk);
      break;
  }
}

export async function handleMemory<TMemory extends AnyMemory>({
  memory,
  routerCtx,
}: {
  memory: TMemory;
  routerCtx: RouterCtx;
}): Promise<any> {
  const { engine, router, state, controller } = routerCtx;

  if (state.chain.find((mem) => mem.id === memory.id)) {
    console.log("HANDLE TWICE", memory);
    return;
  }

  state.chain.push(memory);

  if (!state.running || controller.signal.aborted) {
    throw new Error("stopped");
  }

  try {
    let res: any;
    switch (memory.kind) {
      case "thought":
        {
          memory.parent ??= memory.parent ?? {
            id: state.currentStep!.id,
            kind: state.currentStep!.kind,
          };
          memory.raw = memory.chunks
            .filter((c) => c.type === "content")
            .map((c) => c.content)
            .join("")
            .trim();
        }
        break;
      case "input": {
        memory.parent ??= memory.parent ?? {
          id: state.currentStep!.id,
          kind: state.currentStep!.kind,
        };
        res = await router.input(memory as InputMemory, routerCtx);
        break;
      }
      case "output": {
        memory.parent ??= memory.parent ?? {
          id: state.currentStep!.id,
          kind: state.currentStep!.kind,
        };
        res = await router.output(memory as OutputMemory, routerCtx);
        break;
      }
      case "action_call": {
        memory.parent ??= memory.parent ?? {
          id: state.currentStep!.id,
          kind: state.currentStep!.kind,
        };
        res = await router.action_call(memory as ActionCallMemory, routerCtx);
        break;
      }
    }

    return res;
  } catch (error) {
    console.log("handleMemory error", { memory, error });
    state.chain.push(memory);
    // state.chain.push(memory);
    const errorRef: ErrorRef = { memory, error };
    state.errors.push(errorRef);
    engine.push(workingMemories.error(errorRef), true);
  } finally {
  }
}

export type EngineCreateParams = {
  agent: AnyAgent;
  ctx: ContextState;
  wm: WorkingMemoryCtx;
  events: EventEmitter<EngineEventMap>;
  router: Router;
  runner: Runner;
};

export type LLMEngineComponents = {
  outputs: OutputCtxRef[];
  inputs: Input[];
  actions: ActionCtxRef[];
  tools: ToolCtxRef[];
  contexts: ContextState[];
};

export type LLMEngineState = EngineState<LLMEngineComponents>;

export type EngineRunParams = {
  model: LanguageModel;
  setttings: LLMGenerateSettings;
  systems: SystemRef[];
  memories: AnyMemory[];
};

type LLMEngine = Engine<LLMEngineState, EngineRunParams, LLMEngineComponents> &
  StepEngine;

type CustomLLMEngineFactory<
  TEngine extends LLMEngine = LLMEngine,
  CreateParams = any,
> = (
  params: CreateParams & {
    engine: TEngine;
    state: LLMEngineState;
    controller: AbortController;
  }
) => Partial<TEngine>;

type LLMEngineApi = Partial<LLMEngine>;

type LLMEngineFactoryConfig = Pick<LLMEngine, "name" | "version"> & {
  create: CustomLLMEngineFactory<LLMEngine, EngineCreateParams>;
};

export function createLLMEngineFactory(config: LLMEngineFactoryConfig) {
  return ({
    ctx,
    wm,
    agent,
    router,
    runner,
    events,
  }: EngineCreateParams): LLMEngine => {
    const state: LLMEngineState = createEngineState<LLMEngineComponents>({
      wm,
      ctx,
      components: {
        actions: [],
        contexts: [],
        inputs: [],
        outputs: [],
        tools: [],
      },
    });

    const controller = new AbortController();

    const ctxStateApi: ContextStateApi = {
      async push(memory) {
        await engine.push(memory);
      },
      emit({ name, args }) {
        engine.push(
          workingMemories.event({
            name,
            schema: ctx.context.events[name],
            content: args,
          })
        );
      },
      async callAction(call) {
        return engine.push(call);
      },
    };

    const engine: LLMEngine = {
      name: config.name,
      version: config.version,
      __state: state,
      signal: controller.signal,

      __handlePromise(promise: Promise<any>) {
        state.promises.push(promise);
        promise.finally(() => {
          state.promises.splice(state.promises.indexOf(promise), 1);
        });
      },

      components() {
        return state.components;
      },

      results() {
        return state.defer.promise;
      },

      isRunning() {
        return state.running;
      },

      getMaxSteps() {
        return Infinity;
      },

      getStep() {
        return state.currentStep?.content.step ?? 0;
      },

      // getStep() {
      //   return state.step;
      // },

      async prepareRun(params) {
        state.params = {};

        await runner.try("engine.prepareContexts", prepareContexts, {
          agent,
          ctx,
          wm,
          components: state.params.components,
          engine,
        });

        Object.assign(state.components, ctx.components);

        // const runMemory = workingMemories.run({});
        // state.run = runMemory;
        // engine.push(runMemory);

        if (params.memories) {
          await engine.pushMemories(params.memories);
        }

        // state.step = 0;
        // await router.push(run);
      },

      // async prepareStep() {
      //   const { actions, contexts, inputs, outputs } = await runner.try(
      //     "engine.prepareContexts",
      //     prepareContexts,
      //     {
      //       agent,
      //       ctx,
      //       agentCtxState: undefined,
      //       wm,
      //       params: state.params,
      //       engine,
      //     }
      //   );
      //   Object.assign(state, { actions, contexts, inputs, outputs });
      // },

      async stop() {
        state.running = false;
        controller.abort("stop");
      },

      async pushChunk(chunk) {
        await handleChunk(engine, state, chunk);
      },

      async push(memory, done = true) {
        if (!state.running) {
          state.__queue.push(memory);
          return;
        }

        if (!done) {
          return;
        }

        return await runner.try("engine.handleMemory", handleMemory, {
          memory,
          routerCtx: {
            agent,
            api: ctxStateApi,
            controller,
            engine,
            router,
            state,
          },
        });
      },

      async settled() {
        console.log("settling");
        while (state.promises.length > 0) {
          await Promise.allSettled(state.promises);
        }
      },

      async start() {},

      async run() {
        throw new Error("not implemented");
      },

      prepareStep() {
        throw new Error("not implemented");
      },

      runStep() {
        throw new Error("not implemented");
      },

      shouldContinue() {
        if (controller.signal.aborted) return false;
        if (state.errors.length > 0) {
        }
        return shouldContinue(state);
      },

      // getMaxSteps() {
      //   return getMaxSteps(state);
      // },
      async pushMemories(memories) {
        for (const memory of memories) {
          await engine.push(memory);
        }
      },

      async *stream() {
        // yield* state.chain;
      },
    };

    Object.assign(
      engine,
      config.create({
        runner,
        ctx,
        wm,
        agent,
        router,
        events,
        controller,
        engine,
        state,
      })
    );

    return engine;
  };
}
