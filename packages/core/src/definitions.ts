import type { AgentConfig, Extension } from "./types/agent";
import type {
  MemoryDefinition,
  MemoryKindRecord,
  MemoryMutationRecord,
  MemoryStore,
} from "./types/memory";
import type { Task } from "./types/tasks";
import type { Action, ActionConfig } from "./types/action";
import type { AnyAgent } from "./types/agent";
import type {
  Input,
  InputConfig,
  Output,
  OutputConfig,
  OutputMemoryResponse,
} from "./types/components";
import type { AnyContext } from "./types/context";
import type { InferSchema, Schema } from "./types/utils";
import type { Tool } from "./types/tool";

// function make<Kind extends string>(k: Kind) {
//   return {
//     kind: k,
//   };
// }

// function make<Kind extends string, T>(
//   kind: Kind,
//   config: T
// ): T extends { kind: Kind } ? T : T & { kind: Kind } {
//   return {
//     kind,
//     ...config,
//   } as any;
// }

export function input<
  TSchema extends Schema = Schema,
  TData = any,
  TContext extends AnyContext = AnyContext,
  TAgent extends AnyAgent = AnyAgent
>(
  def: Omit<Input<TSchema, TData, TContext, TAgent>, "kind">
): Input<TSchema, TData, TContext, TAgent> {
  return def;
}

export function output<
  TSchema extends Schema = Schema,
  TResponse extends OutputMemoryResponse = OutputMemoryResponse,
  TContext extends AnyContext = AnyContext,
  TAgent extends AnyAgent = AnyAgent
>(config: Output<TSchema, TResponse, TContext, TAgent>) {
  return config;
}

export function action<
  TContext extends AnyContext,
  TSchema extends Schema,
  TResult,
  TError,
  Deps,
  TMemory,
  TAgent extends AnyAgent
>(config: Action<TContext, TSchema, TResult, TError, Deps, TMemory, TAgent>) {
  return config;
}

export type PromptRenderer<
  TSchema extends Schema = Schema,
  Content = string
> = (params: InferSchema<TSchema>) => Content;

export type Prompt<
  TName extends string = string,
  TSchema extends Schema = Schema,
  Renderer extends PromptRenderer<TSchema, any> = PromptRenderer<TSchema, any>
> = {
  name: TName;
  schema?: TSchema;
  content: Renderer;
};

export function prompt<
  TName extends string = string,
  TSchema extends Schema = Schema,
  Renderer extends PromptRenderer<TSchema, any> = PromptRenderer<TSchema, any>
>(
  config: Partial<{
    name: TName;
    schema: TSchema;
    content: Renderer;
  }>
): Prompt<TName, TSchema, Renderer> {
  // if (typeof content === "function") {
  //   return {
  //     ...config,
  //     content: config,
  //   } as any;
  // }

  return {
    config,
    ...config,
  } as any;
}

type Instruction<TSchema extends Schema = Schema> = {
  name: string;
  schema?: TSchema;
  prompt: string;
};

export function instruction<TSchema extends Schema>(
  config: Instruction<TSchema>
) {
  return config;
}

type Components<
  Inputs extends Record<string, InputConfig> = Record<string, InputConfig>
> = {
  inputs: Inputs;
  outputs: Record<string, OutputConfig> | Output[];
  actions: Record<string, ActionConfig> | Action[];
};

export type Capabilities<
  TSchema extends Schema = Schema,
  Inputs extends Record<string, InputConfig> = Record<string, InputConfig>
> = {
  name: string;
  schema?: TSchema;
  instructions?: Instruction[];
  uses: Partial<Components<Inputs>>;
  render?: any;
};

export function capabilities<
  TSchema extends Schema = Schema,
  Inputs extends Record<string, InputConfig> = Record<string, InputConfig>
>(config: Capabilities<TSchema, Inputs>) {
  return config;
}

export function memory<Kind extends string, TSchema extends Schema = Schema>(
  def: MemoryDefinition<Kind, TSchema>
): MemoryDefinition<Kind, TSchema> {
  return def;
}

export function memoryStore<
  Data = any,
  TSchema extends Schema = Schema,
  TMemories extends MemoryKindRecord = MemoryKindRecord,
  Deps = any,
  TMutation extends MemoryMutationRecord = MemoryMutationRecord
>(def: MemoryStore<Data, TSchema, TMemories, Deps, TMutation>) {
  return def;
}

export function extension(def: Extension) {
  return def;
}

export function task<Params = any, Result = any>(def: Task<Params, Result>) {
  return def;
}

export function tool<TSchema extends Schema, Result = any>(
  def: Tool<TSchema, Result>
) {
  return def;
}

export function agent<
  TContext extends AnyContext | undefined = undefined
  // TAgentEventMap extends AgentEventMap = AgentEventMap,
  // TRegistry extends DefaultRegistry = DefaultRegistry,
>(config: Partial<AgentConfig<TContext>>) {
  return config;
}

// agent({
//   uses: {
//     outputs: {},
//   },

//   systems: [{}],

//   context: {
//     name: "type",
//     schema: { id: z.string() },
//     uses: {
//       inputs: {},
//     },
//   },
// });

// type Model<
//   Kind extends string = string,
//   TProvider extends string = string,
//   ModelId extends string = string,
//   Params = any,
//   Result = any,
// > = {
//   provider: TProvider;
//   modelId: ModelId;
//   handler: Handler<Params, Promise<Result>, ModelCtx>;
// };

// function model<
//   Kind extends string,
//   TProvider extends string,
//   ModelId extends string,
// >(config: Model<Kind, TProvider, ModelId>) {
//   return config;
// }

// type ModelFactory<Kind extends string, TProvider extends string> = <
//   ModelId extends string,
// >(
//   modelId: ModelId
// ) => Model<Kind, TProvider, ModelId>;

// type ModelProvider<
//   Name extends string,
//   TRecord extends Record<string, ModelFactory<any, Name>>,
// > = {
//   name: Name;
//   models: TRecord;
// };

// type ModelCtx = {
//   provider: ModelProvider<any, any>;
// };

// function modelProvider<
//   Name extends string,
//   TRecord extends Record<string, ModelFactory<any, Name>>,
// >(
//   config: ModelProvider<Name, TRecord>
// ): { models: { [K in keyof TRecord]: TRecord[K] } } {
//   return config;
// }

// function llm<TProvider extends string, Models extends string>(
//   provider: TProvider,
//   models: Array<Models>,
//   handler: Handler<string, Promise<string>, ModelCtx>
// ) {
//   return <ModelKey extends Models>(modelId: ModelKey) =>
//     model({
//       provider,
//       modelId,
//       handler,
//     });
// }

// type Handler<Params = any, Result = any, Ctx = any, Runtime = any> = (
//   params: Params,
//   ctx: Ctx,
//   runtime: Runtime
// ) => Result;

// function handler<Params = any, Result = any, Ctx = any>(
//   fn: Handler<Params, Result, Ctx>
// ) {
//   return fn;
// }

// const gemini = llm(
//   "google",
//   ["gemini-pro", "test"],
//   handler(async (test, { provider }) => "true")
// );

// const google = modelProvider({
//   name: "google",
//   models: {
//     llm: llm("google", ["test", "test-flash"], async () => {
//       return "";
//     }),
//   },
// });

// google.models;

// type Program<Params, Result, Ctx, Runtime> = {
//   name: string;
//   runtime?: () => Runtime;
//   ctx?: (runtime: Runtime) => Ctx;
//   // events?: EventMap;
//   handler: Handler<Params, Result, Ctx, Runtime>;
//   stop?: () => void;
// };

// // type Runtime<T> = T;

// function runtime<T>(config: { create: () => T }): Factory<T> {
//   return config.create;
// }

// function program<Params, Result, Ctx, Runtime>(
//   config: Program<Params, Result, Ctx, Runtime>
// ) {
//   return config;
// }

// program({
//   name: "run",

//   runtime(): Agent {
//     return {} as any;
//   },

//   ctx(agent) {
//     const logger: Logger = agent.container.resolve("logger");
//     const events: EventEmitter = agent.container.resolve("events");
//     const memory: MemoryManager = agent.container.resolve("memory");
//     const ctxs: ContextManager = agent.container.resolve("ctxs");

//     return {
//       logger,
//       events,
//       memory,
//       ctxs,
//     };
//   },

//   async handler(
//     params: RunParams<any, any, any>,
//     { ctxs, events, logger, memory },
//     agent
//   ) {
//     const {
//       context: { ref: context, args },
//     } = params;

//     const ctxId = ctxs.getId({ context, args });
//     // if (enginesRunning.has(ctxId)) {
//     //   logger.debug("agent:run", "Context already running", {
//     //     id: ctxId,
//     //   });
//     //   const engine = enginesRunning.get(ctxId)!;
//     //   params.chain?.forEach((el) => engine.pushLog(el));
//     //   return engine.state.defer.promise;
//     // }
//     const ctx = await ctxs.get({ context, args });
//     const wm = context.wm
//       ? await memory.get(await resolve(context.wm, [ctx, agent]), {
//           id: ctxId,
//         })
//       : await agent.getWorkingMemory(ctxId);
//     // todo: context model -> context engine
//     // resolveModel on contextState?
//     const createEngine = resolve(
//       context.engine,
//       [ctx, agent],
//       agent.container.resolve("engine")
//     ) as EngineFactory;

//     const engine = createEngine({
//       agent,
//       ctx,
//       wm,
//       events: events as any,
//     });

//     // enginesRunning.set(ctxId, engine);

//     if (params.abortSignal) {
//       params.abortSignal.addEventListener("abort", engine.stop, {
//         signal: engine.controller.signal,
//       });
//     }

//     await engine.start();
//     await engine.prepareRun(params);
//     // todo: and isIdle
//     while (engine.isRunning()) {
//       if (!engine.shouldContinue()) {
//         await engine.stop();
//         break;
//       }

//       logger.info(
//         "agent:run",
//         `Starting step ${engine.getStep()}/${engine.getMaxSteps()}`,
//         {
//           contextId: ctx.id,
//         }
//       );

//       try {
//         await engine.prepareStep();
//         await engine.runStep();
//         await engine.settled();
//         await Promise.all(
//           engine
//             .getContexts()
//             .map((state) => state.context.hooks?.onStep?.(state, agent))
//         );
//         await memory.save(wm);
//         await Promise.all(
//           engine.getContexts().map((state) => ctxs.save(state))
//         );
//       } catch (error) {
//         console.error(error);
//         if (context.onError) {
//           try {
//             await context.onError(error, ctx, agent);
//           } catch (error) {}
//         }
//       }
//     }

//     await Promise.all(
//       engine
//         .getContexts()
//         .map((state) => state.context.hooks?.onRun?.(ctx, agent))
//     );

//     await Promise.allSettled(
//       [
//         memory.save(wm),
//         engine.getContexts().map((state) => ctxs.save(state)),
//       ].flat()
//     );

//     const result = await engine.chain();

//     // enginesRunning.delete(ctx.id);

//     logger.info("agent:run", "Run completed", {
//       contextId: ctx.id,
//       chainLength: result.length,
//     });

//     return result;
//   },
// });

// type Controller<State, Ctx, Runtime> = {
//   state: State;
//   subscribes?: {};
//   handler: Handler<Event, State, Ctx, Runtime>;
// };

// function controller() {}

// program/handler + systems runtime.run(program, params, { services,  hooks })

// runtime.ctx({ systems }).abort()

// runtime.hook(program, hooks)

// function createController() {
//   return new AbortController();
// }

// const controller = createController();

// controller.signal.

export type MaybeAsyncGenerator<
  T = unknown,
  TReturn = any,
  TNext = any
> = AsyncGenerator<T, TReturn, TNext>;

export type TokenYieldRecord<YieldRecord extends Record<string, any>> = {
  [Token in keyof YieldRecord]: YieldRecord[Token];
};

export type TokenYieldRecordApi<YieldRecord extends Record<string, any>> = {
  [Token in keyof YieldRecord]: (args: InferSchema<YieldRecord[Token]>) => {
    type: Token;
    data: InferSchema<YieldRecord[Token]>;
  };
};

export type TokenYieldRecordYield<YieldRecord extends Record<string, any>> = {
  [Token in keyof YieldRecord]: {
    type: Token;
    data: InferSchema<YieldRecord[Token]>;
  };
}[keyof YieldRecord];

export function tokens<YieldRecord extends Record<string, any>>(
  def: TokenYieldRecord<YieldRecord>
) {
  return def;
}

export type StreamCtx<TStream extends AnyStream> = {
  stream: TStream;
  tokens: InferStreamYield<TStream> extends Record<string, any>
    ? TokenYieldRecordApi<InferStreamYield<TStream>>
    : undefined;
};

export type InferStreamYield<TStream extends AnyStream> =
  TStream extends Stream<any, infer Yield, any, any> ? Yield : never;

export type AnyStream = Stream<any, any, any, any>;

export interface Stream<
  TSchema extends Schema = Schema,
  TYield extends Schema | Record<string, Schema> = Schema,
  TNext = any,
  TReturn extends Schema = Schema
> {
  args: TSchema;
  yields: TYield extends Record<string, Schema>
    ? TokenYieldRecord<TYield>
    : TYield;
  returns: TReturn;
  next: TNext;
  handler: (
    args: InferSchema<TSchema>,
    ctx: StreamCtx<this>
  ) => MaybeAsyncGenerator<
    TYield extends Record<string, Schema>
      ? TokenYieldRecordYield<TYield> | void
      : TYield extends Schema
      ? InferSchema<TYield>
      : never,
    InferSchema<TReturn>,
    TNext | void
  >;
}

export function stream<
  TSchema extends Schema = Schema,
  TYield extends Schema | Record<string, Schema> = Schema,
  TNext = any,
  TReturn extends Schema = Schema
>(def: Stream<TSchema, TYield, TNext, TReturn>) {
  return def;
}

// interface TokenStream<
//   TSchema extends Schema = Schema,
//   Tokens extends Record<string, Schema> = Record<string, Schema>,
//   TNext extends Schema = Schema,
//   TReturn extends Schema = Schema,
// > extends Stream {}

// function tokenStream<
//   TSchema extends Schema = Schema,
//   TYield extends Schema = Schema,
//   TNext extends Schema = Schema,
//   TReturn extends Schema = Schema,
// >(def: Stream<TSchema, TYield, TReturn, TNext>) {
//   return def;
// }
