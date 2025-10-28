import {
  createResultsTemplateResolver,
  getValueByPath,
  handleActionCall,
  handleOutput,
  prepareActionCall,
  prepareContexts,
  prepareOutputRef,
  resolveActionCall,
} from "../handlers";
import {
  type ActionResult,
  type AnyAgent,
  type AnyContext,
  type AnyRef,
  type ContextState,
  type ContextStateApi,
  type EventRef,
  type Handlers,
  type Log,
  type RunRef,
  type StepRef,
  type TemplateResolver,
  type WorkingMemory,
  type LogChunk,
  type ActionCallContext,
  type State,
  type Router,
  ParsingError,
} from "../types";
import pDefer from "p-defer";
import { pushToWorkingMemory } from "../memory/utils";
import { randomUUIDv7 } from "../utils";
import { handleEpisodeHooks } from "../memory/episode-hooks";
import { createErrorEvent, formatError } from "./prettify-error";
import { handleInput } from "../handlers";

export function createEngine({
  agent,
  ctxState,
  agentCtxState,
  workingMemory,
  subscriptions,
  handlers,
  __chunkSubscriptions,
}: {
  agent: AnyAgent;
  ctxState: ContextState;
  agentCtxState?: ContextState;
  workingMemory: WorkingMemory;
  subscriptions: Set<(log: AnyRef, done: boolean) => void>;
  handlers?: Partial<Handlers>;
  __chunkSubscriptions?: Set<(chunk: LogChunk) => void>;
}) {
  const controller = new AbortController();

  function __getOutputContentKey(o: any): string {
    try {
      const v = o?.data ?? o?.content ?? "";
      const s = typeof v === "string" ? v : JSON.stringify(v);
      const name = o?.name ?? "";
      return `${name}:${s}`;
    } catch {
      return String(o?.name ?? "") + ":[unserializable]";
    }
  }

  const state: State = {
    running: false,
    step: -1,

    ctxState,

    chain: [],

    inputs: [],
    outputs: [],
    actions: [],
    contexts: [],

    results: [],

    promises: [],

    errors: [],

    defer: pDefer<AnyRef[]>(),
  };

  function pushPromise(promise: Promise<any>) {
    state.promises.push(promise);

    promise.finally(() => {
      state.promises.splice(state.promises.indexOf(promise), 1);
    });
  }

  function pushLogToSubscribers(log: AnyRef, done: boolean) {
    if (ctxState.context.episodeHooks && done) {
      handleEpisodeHooks(workingMemory, log, ctxState, agent).catch((error) => {
        agent.logger.warn("context:episode", "Episode processing failed", {
          error: error instanceof Error ? error.message : error,
          contextId: ctxState.id,
          refId: log.id,
        });
      });
    }
    try {
      handlers?.onLogStream?.(structuredClone(log), done);
    } catch (error) {
      agent.logger.error("engine:handler", "onLogStream handler error", {
        error: error instanceof Error ? error.message : String(error),
        errorType:
          error instanceof Error ? error.constructor.name : typeof error,
        logRef: log.ref,
        logId: log.id,
        done,
        contextId: ctxState.id,
      });
    }

    for (const subscriber of subscriptions) {
      try {
        subscriber(structuredClone(log), done);
      } catch (error) {
        agent.logger.error("engine:subscriber", "Log subscriber error", {
          error: error instanceof Error ? error.message : String(error),
          errorType:
            error instanceof Error ? error.constructor.name : typeof error,
          logRef: log.ref,
          logId: log.id,
          done,
          contextId: ctxState.id,
        });
      }
    }
  }

  function __pushLogChunkToSubscribers(log: LogChunk) {
    if (__chunkSubscriptions) {
      for (const subscriber of __chunkSubscriptions) {
        try {
          subscriber(structuredClone(log));
        } catch (error) {
          agent.logger.error("engine:chunk", "Chunk subscriber error", {
            error: error instanceof Error ? error.message : String(error),
            errorType:
              error instanceof Error ? error.constructor.name : typeof error,
            chunkType: log.type,
            contextId: ctxState.id,
          });
        }
      }
    }
  }

  async function pushLog<TRef extends AnyRef = AnyRef>(
    log: TRef,
    options?: any
  ): Promise<any> {
    // throw?
    if (!state.running) {
      agent.logger.error("engine:state", "Engine not running", {
        contextId: ctxState.id,
        logRef: log.ref,
        logId: log.id,
      });
      throw new Error("not running!");
    }

    try {
      // Respect aborts but handle them via error catch to generate error event
      controller.signal.throwIfAborted();

      if (log.ref !== "output") {
        state.chain.push(log);
      }

      let res: any;

      switch (log.ref) {
        case "input":
          await router.input(log);
          break;
        case "output":
          // Trace incoming output stub for duplicate investigation
          agent.logger.trace("engine:output", "Routing output stub", {
            id: (log as any).id,
            name: (log as any).name,
            step: state.step,
            contentKey: __getOutputContentKey(log as any),
          });
          res = await router.output(log);
          break;
        case "action_call":
          res = await router.action_call(log, options);
          break;
      }

      if (log.ref !== "output") {
        pushToWorkingMemory(workingMemory, log);
      }

      return res;
    } catch (error) {
      agent.logger.error("engine:push", "Error processing log", {
        error: error instanceof Error ? error.message : String(error),
        errorType:
          error instanceof Error ? error.constructor.name : typeof error,
        errorStack: error instanceof Error ? error.stack : undefined,
        logRef: log.ref,
        logId: log.id,
        contextId: ctxState.id,
        options,
        ...(error instanceof ParsingError && {
          parsingError:
            error.parsingError instanceof Error
              ? {
                  message: error.parsingError.message,
                  name: error.parsingError.constructor.name,
                }
              : error.parsingError,
        }),
      });

      if (log.ref === "output") {
        state.chain.push(log);
      }

      const errorRef = { log, error };
      state.errors.push(errorRef);

      const eventRef = createErrorEvent(errorRef);

      // If aborted or not running, avoid re-entering router; notify directly
      if (controller.signal.aborted || !state.running) {
        try {
          pushLogToSubscribers(eventRef, true);
        } catch {}
        try {
          __pushLogChunkToSubscribers({ type: "log", done: true, log: eventRef });
        } catch {}
        // Optionally persist the error event
        try {
          pushToWorkingMemory(workingMemory, eventRef);
        } catch {}
      } else {
        // Normal path: push via router; swallow errors to avoid unhandled rejections
        try {
          await __push(eventRef, true, true);
        } catch {}
      }

      pushToWorkingMemory(workingMemory, log);
    } finally {
      // Avoid streaming the initial output stub; only stream processed outputs
      if (log.ref !== "output") {
        pushLogToSubscribers(log, true);
      }
    }
  }

  async function __push<TRef extends AnyRef = AnyRef>(
    log: TRef,
    done: boolean = true,
    __pushChunk: boolean = true
  ): Promise<any> {
    try {
      if (done) {
        return await pushLog(log);
      } else {
        pushLogToSubscribers(log, false);
      }
    } finally {
      if (__pushChunk) {
        __pushLogChunkToSubscribers({
          type: "log",
          done,
          log,
        });
      }
    }
  }

  const ctxStateApi: ContextStateApi<AnyContext> = {
    push: (log) => pushLog(log),
    emit(event, args, options) {
      const eventRef: EventRef = {
        ref: "event",
        id: randomUUIDv7(),
        name: event as string,
        data: args,
        processed: options?.processed ?? true,
        timestamp: Date.now(),
      };
      __push(eventRef, true, true);
    },
    async callAction(call, options) {
      const res = await pushLog(call, options);
      __pushLogChunkToSubscribers({ type: "log", log: call, done: true });
      return res;
    },
    __getRunResults() {
      return state.results;
    },
  };

  const defaultResolvers: Record<string, TemplateResolver> = {
    calls: createResultsTemplateResolver(state.results),
    shortTermMemory: async (path) => {
      const shortTermMemory = state.contexts.find(
        (state) => state.context.type === "shortTermMemory"
      );
      if (!shortTermMemory) throw new Error("short term memory not found");
      const value = getValueByPath(shortTermMemory.memory, path);
      if (value === undefined)
        throw new Error("invalid short term memory resultPath");
      return value;
    },
  };

  async function templateResolver(
    key: string,
    path: string,
    ctx: ActionCallContext,
    resolvers: Record<string, TemplateResolver<ActionCallContext>>
  ) {
    if (resolvers[key]) return resolvers[key](path, ctx);
    throw new Error("template engine key not implemented");
  }

  const router: Router = {
    async input(log) {
      await handleInput({
        agent,
        ctxState,
        inputRef: log,
        inputs: state.inputs,
        logger: agent.logger,
        workingMemory,
      });
    },

    async action_call(call, options = {}) {
      if (call.processed) throw new Error("Already processed");

      const defer = pDefer<ActionResult>();

      pushPromise(defer.promise);
      state.results.push(defer.promise);

      const action = resolveActionCall({
        call,
        actions: state.actions,
        logger: agent.logger,
      });

      call.processed = true;

      const actionCtxState =
        state.contexts.find(
          (subCtxState: any) => subCtxState.id === action.ctxRef.id
        ) ?? ctxState;

      const templateResolvers = {
        ...defaultResolvers,
        ...ctxState.context.__templateResolvers,
        ...options.templateResolvers,
      };

      const callCtx = await prepareActionCall({
        agent,
        call,
        action,
        state: actionCtxState,
        workingMemory,
        api: ctxStateApi,
        abortSignal: controller.signal,
        agentState: agentCtxState,
        logger: agent.logger,
        templateResolver: (key, path, callCtx) =>
          templateResolver(key, path, callCtx, templateResolvers),
      }).catch((err) => {
        defer.reject(err);
        throw err;
      });

      handleActionCall({
        call,
        callCtx,
        action,
        agent,
        logger: agent.logger,
        taskRunner: agent.taskRunner,
        abortSignal: controller.signal,
        queueKey: options.queueKey,
      })
        .catch((error) => {
          const result: ActionResult = {
            ref: "action_result",
            id: randomUUIDv7(),
            callId: call.id,
            data: { error: formatError(error) },
            name: call.name,
            timestamp: Date.now(),
            processed: false,
          };

          return result;
        })
        .then((res) => {
          defer.resolve(res);
          __push(res, true, true);
          return res;
        });

      return await defer.promise;
    },

    async output(outputRef) {
      const { output } = prepareOutputRef({
        outputRef,
        outputs: state.outputs,
        logger: agent.logger,
      });

      const res = await handleOutput({
        agent,
        logger: agent.logger,
        state:
          state.contexts.find(
            (subCtxState) => subCtxState.id === output.ctxRef.id
          ) ?? ctxState,
        workingMemory,
        output,
        outputRef,
      });

      const refs = Array.isArray(res) ? res : [res];

      for (const ref of refs) {
        agent.logger.debug("agent:output", "Output processed status", {
          name: ref.name,
          processed: ref.processed,
        });

        state.chain.push(ref);

        pushToWorkingMemory(workingMemory, ref);

        // Trace processed output for potential duplication
        agent.logger.trace("engine:output", "Processed output", {
          id: (ref as any).id,
          name: (ref as any).name,
          step: state.step,
          contentKey: __getOutputContentKey(ref as any),
        });

        // Stream processed output refs to subscribers and chunk listeners without re-entering router
        try {
          pushLogToSubscribers(ref as any, true);
        } catch (error) {
          agent.logger.error(
            "engine:subscriber",
            "Failed to notify subscribers for output",
            {
              error: error instanceof Error ? error.message : String(error),
              logRef: (ref as any).ref,
              logId: (ref as any).id,
              contextId: ctxState.id,
            }
          );
        }

        try {
          __pushLogChunkToSubscribers({ type: "log", done: true, log: ref as any });
        } catch (error) {
          agent.logger.error("engine:chunk", "Failed to emit chunk for output", {
            error: error instanceof Error ? error.message : String(error),
            logRef: (ref as any).ref,
            logId: (ref as any).id,
            contextId: ctxState.id,
          });
        }
      }

      return refs;
    },
  };

  const runRef: RunRef = {
    id: randomUUIDv7(),
    ref: "run",
    type: ctxState.context.type,
    data: {},
    processed: false,
    timestamp: Date.now(),
  };

  async function createStep() {
    const newStep: StepRef = {
      ref: "step",
      id: randomUUIDv7(),
      step: state.step,
      type: "main",
      data: {},
      processed: false,
      timestamp: Date.now(),
    };

    agent.logger.trace("engine:step", "Creating new step", {
      stepId: newStep.id,
      stepNumber: state.step,
      contextId: ctxState.id,
    });

    await __push(newStep, true, true);

    return newStep;
  }

  return {
    state,
    controller,

    async setParams(params: State["params"]) {
      state.params = params;
    },

    async prepare() {
      const { actions, contexts, inputs, outputs } = await prepareContexts({
        agent,
        ctxState,
        agentCtxState,
        workingMemory,
        params: state.params,
      });

      Object.assign(state, { actions, contexts, inputs, outputs });
    },

    async stop() {
      agent.logger.info("engine:lifecycle", "Stopping engine", {
        contextId: ctxState.id,
        step: state.step,
        pendingPromises: state.promises.length,
        errors: state.errors.length,
      });
      state.running = false;
      controller.abort("stop");
    },

    async pushChunk(chunk: LogChunk) {
      __pushLogChunkToSubscribers(chunk);
    },

    async push(log: Log, done: boolean = true, pushChunk: boolean = true) {
      return await __push(log, done, pushChunk);
    },

    async settled() {
      while (state.promises.length > 0) {
        await Promise.allSettled(state.promises);
      }
    },

    async start() {
      if (state.running) {
        agent.logger.error("engine:lifecycle", "Engine already running", {
          contextId: ctxState.id,
        });
        throw new Error("alredy running");
      }

      agent.logger.info("engine:lifecycle", "Starting engine", {
        contextId: ctxState.id,
        contextType: ctxState.context.type,
        hasAgentContext: !!agentCtxState,
      });

      state.running = true;

      await this.prepare();

      await __push(runRef, true, true);

      state.step = 1;

      agent.logger.debug("engine:lifecycle", "Engine started successfully", {
        contextId: ctxState.id,
        step: state.step,
        actions: state.actions.length,
        inputs: state.inputs.length,
        outputs: state.outputs.length,
      });

      return createStep();
    },

    async nextStep() {
      await this.prepare();
      return createStep();
    },

    shouldContinue() {
      if (controller.signal.aborted) {
        agent.logger.debug("engine:control", "Engine aborted", {
          contextId: ctxState.id,
          step: state.step,
          reason: controller.signal.reason,
        });
        return false;
      }

      if (state.errors.length > 0) {
        agent.logger.warn("agent:run", "Continuing despite error", {
          errors: state.errors,
          step: state.step,
        });
      }

      for (const ctx of state.contexts) {
        if (!ctx.context.shouldContinue) continue;

        if (
          ctx.context.shouldContinue({
            ...ctx,
            workingMemory,
          })
        )
          return true;
      }

      const pendingResults = state.chain.filter(
        (i) => i.ref !== "thought" && i.processed === false
      );

      return pendingResults.length > 0;
    },
  };
}
