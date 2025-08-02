import {
  createResultsTemplateResolver,
  getValueByPath,
  handleActionCall,
  handleInput,
  handleOutput,
  NotFoundError,
  ParsingError,
  prepareActionCall,
  prepareContexts,
  prepareOutputRef,
  resolveActionCall,
} from "./handlers";
import type {
  ActionCall,
  ActionCtxRef,
  ActionResult,
  AnyAction,
  AnyAgent,
  AnyContext,
  AnyRef,
  ContextRef,
  ContextState,
  ContextStateApi,
  EventRef,
  Handlers,
  Input,
  InputConfig,
  InputRef,
  Log,
  Output,
  OutputCtxRef,
  OutputRef,
  RunRef,
  StepRef,
  TemplateResolver,
  WorkingMemory,
  LogChunk,
  ActionCallContext,
} from "./types";
import pDefer, { type DeferredPromise } from "p-defer";
import {
  pushToWorkingMemory,
  pushToWorkingMemoryWithManagement,
} from "./context";
import { createEventRef, randomUUIDv7 } from "./utils";
import { ZodError, type ZodIssue } from "zod/v4";

type CallOptions = Partial<{
  templateResolvers: Record<string, TemplateResolver>;
  queueKey: string;
}>;

// type Router<TLog extends AnyRef = AnyRef> = {
//   [K in TLog["ref"]]: K extends "action_call"
//     ? (
//         log: ActionCall,
//         options?: Partial<{
//           templateResolvers: Record<string, TemplateResolver>;
//         }>
//       ) => MaybePromise<ActionResult>
//     : TLog extends { ref: K }
//       ? (log: TLog) => MaybePromise<void>
//       : never;
// };

interface Router {
  input(ref: InputRef): Promise<void>;
  output(ref: OutputRef): Promise<OutputRef[]>;
  action_call(call: ActionCall, options: CallOptions): Promise<ActionResult>;
}

type ErrorRef = {
  log: AnyRef;
  error: unknown;
};

type State = {
  running: boolean;
  step: number;
  chain: AnyRef[];
  ctxState: ContextState;

  inputs: Input[];
  outputs: OutputCtxRef[];
  actions: ActionCtxRef[];
  contexts: ContextState[];

  promises: Promise<any>[];

  errors: ErrorRef[];

  results: Promise<ActionResult>[];

  params?: Partial<{
    outputs: Record<string, Omit<Output<any, any, any, any>, "type">>;
    inputs: Record<string, InputConfig>;
    actions: AnyAction[];
    contexts: ContextRef[];
  }>;

  defer: DeferredPromise<AnyRef[]>;
};

type Engine = ReturnType<typeof createEngine>;

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
    try {
      handlers?.onLogStream?.(structuredClone(log), done);
    } catch (error) {}

    for (const subscriber of subscriptions) {
      try {
        subscriber(structuredClone(log), done);
      } catch (error) {}
    }
  }

  function __pushLogChunkToSubscribers(log: LogChunk) {
    if (__chunkSubscriptions) {
      for (const subscriber of __chunkSubscriptions) {
        try {
          subscriber(structuredClone(log));
        } catch (error) {}
      }
    }
  }

  async function pushLog<TRef extends AnyRef = AnyRef>(
    log: TRef,
    options?: any
  ): Promise<any> {
    // throw?
    if (!state.running) throw new Error("not running!");

    // todo: still push?
    controller.signal.throwIfAborted();

    if (log.ref !== "output") {
      state.chain.push(log);
    }

    try {
      let res: any;

      switch (log.ref) {
        case "input":
          await router.input(log);
          break;
        case "output":
          res = await router.output(log);
          break;
        case "action_call":
          res = await router.action_call(log, options);
          break;
      }

      if (log.ref !== "output") {
        if (agent.memory) {
          const updatedMemory = await pushToWorkingMemoryWithManagement(
            workingMemory,
            log,
            ctxState,
            agent
          );
          Object.assign(workingMemory, updatedMemory);
        } else {
          pushToWorkingMemory(workingMemory, log);
        }
      }

      return res;
    } catch (error) {
      if (log.ref === "output") {
        state.chain.push(log);
      }

      const errorRef = { log, error };

      state.errors.push(errorRef);

      __push(createErrorEvent(errorRef), true, true);

      if (agent.memory) {
        const updatedMemory = await pushToWorkingMemoryWithManagement(
          workingMemory,
          log,
          ctxState,
          agent
        );
        Object.assign(workingMemory, updatedMemory);
      } else {
        pushToWorkingMemory(workingMemory, log);
      }
    } finally {
      pushLogToSubscribers(log, true);
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
      call.processed = true;

      const defer = pDefer<ActionResult>();

      pushPromise(defer.promise);
      state.results.push(defer.promise);

      const action = resolveActionCall({
        call,
        actions: state.actions,
        logger: agent.logger,
      });

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
          type: ref.type,
          processed: ref.processed,
        });

        state.chain.push(ref);

        if (agent.memory) {
          const updatedMemory = await pushToWorkingMemoryWithManagement(
            workingMemory,
            ref,
            ctxState,
            agent
          );
          Object.assign(workingMemory, updatedMemory);
        } else {
          pushToWorkingMemory(workingMemory, ref);
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
      if (state.running) throw new Error("alredy running");

      state.running = true;

      await this.prepare();

      await __push(runRef, true, true);

      state.step = 1;
      return createStep();
    },

    async nextStep() {
      await this.prepare();
      return createStep();
    },

    shouldContinue() {
      if (controller.signal.aborted) return false;

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

function prettifyZodError(error: ZodError): string {
  if (!error || !error.issues || error.issues.length === 0) {
    return "Validation failed, but no specific issues were provided.";
  }

  const errorMessages = error.issues.map((issue: ZodIssue) => {
    const pathString = issue.path.join(".");
    return `- Field \`${pathString || "object root"}\`: ${
      issue.message
    } (Code: ${issue.code})`;
  });

  return `Validation Errors:\n${errorMessages.join("\n")}`;
}

function formatError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      cause: error.cause,
      // stack: error.stack,
    };
  }

  return JSON.stringify(error);
}

function createErrorEvent(errorRef: ErrorRef) {
  if (errorRef.error instanceof NotFoundError) {
    if (
      errorRef.error.ref.ref === "input" ||
      errorRef.error.ref.ref === "output"
    ) {
      return createEventRef({
        name: "error",
        data: {
          ref: {
            ref: errorRef.log.ref,
            id: errorRef.log.id,
            type: errorRef.error.ref.type,
          },
          error: {
            name: "NotFoundError",
            message: "Invalid type",
          },
        },
        processed: false,
      });
    } else if (errorRef.error.ref.ref === "action_call") {
      return createEventRef({
        name: "error",
        data: {
          ref: {
            ref: errorRef.log.ref,
            id: errorRef.log.id,
            name: errorRef.error.ref.name,
          },
          error: {
            name: "NotFoundError",
            message: "Invalid action name",
          },
        },
        processed: false,
      });
    }
  }

  if (errorRef.error instanceof ParsingError) {
    return createEventRef({
      name: "error",
      data: {
        ref: {
          ref: errorRef.log.ref,
          id: errorRef.log.id,
          data: errorRef.error.ref.content,
        },
        error: {
          name: "ParsingError",
          message:
            errorRef.error.parsingError instanceof ZodError
              ? prettifyZodError(errorRef.error.parsingError)
              : JSON.stringify(errorRef.error.parsingError),
        },
      },
      processed: false,
    });
  }

  return createEventRef({
    name: "error",
    data: {
      ref: {
        type: errorRef.log.ref,
        id: errorRef.log.id,
      },
      error: formatError(errorRef.error),
    },
    processed: false,
  });
}
