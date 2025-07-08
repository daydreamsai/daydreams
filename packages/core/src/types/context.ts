import type {
  EventsRecord,
  Handler,
  InferSchema,
  MaybePromise,
  Optional,
  Resolver,
  Schema,
} from "./utils";
import type {
  AnyMemory,
  AnyMemoryStore,
  Memory,
  MemoryStore,
  MemoryStoreCtx,
} from "./memory";
import type { WorkingMemory, ActionCallMemory, ActionResultMemory } from "./wm";
import type { ActionConfig, AnyAction } from "./action";
import type { AnyAgent } from "./agent";
import type { InputConfig, Instruction, OutputConfig } from "./components";
import type { LanguageModel, LLMGenerateSettings } from "./models";
import type { RunContextState } from "./run";
import type { Engine, EngineFactory } from "./engine";
import type { LLMEngineComponents } from "@/engines/llm";

export type AnyContext = Context<any, any, any, any, any>;

export type InferContextMemoryStore<TContext extends AnyContext> =
  TContext extends Context<infer TMemory> ? MemoryStore<TMemory> : never;

export type InferContextState<TContext extends AnyContext> =
  TContext extends Context<infer TState, any, any, any, any> ? TState : never;

export type InferContextArgs<TContext extends AnyContext> =
  TContext extends Context<any, infer Schema> ? InferSchema<Schema> : never;

export type InferContextDeps<TContext extends AnyContext> =
  TContext extends Context<any, any, infer Deps, any, any> ? Deps : never;

export type Event<TSchema extends Schema = Schema> = {
  name: string;
  schema: TSchema;
};

export type ContextsEventsRecord<T extends Record<string, Event>> = {
  [K in keyof T]: T[K]["schema"];
};

export type ContextConfig<TContext extends AnyContext> = Optional<
  TContext,
  "name"
>;

type ContextInit<TSchema extends Schema = Schema, Deps = any> = {
  id: string;
  args: InferSchema<TSchema>;
  deps: Deps;
  settings: ContextSettings;
};

export type ContextActions<
  TContext extends AnyContext,
  TActions extends AnyAction[],
> = TActions;

export type ContextResolver<
  Value = any,
  TContext extends AnyContext = AnyContext,
> = Resolver<Value, [ctx: ContextState<TContext>, agent: AnyAgent]>;

type ContextHooks<TContext extends AnyContext = AnyContext> = {
  shouldContinue?: (ctx: ContextState<TContext>) => boolean;

  onRun?: (ctx: ContextState<TContext>, agent: AnyAgent) => Promise<void>;
  onStep?: (ctx: ContextState<TContext>, agent: AnyAgent) => Promise<void>;
  onError?: (
    error: unknown,
    ctx: ContextState<TContext>,
    agent: AnyAgent
  ) => Promise<void>;
};

export type ContextComponents<
  TContext extends AnyContext = AnyContext,
  TAction extends AnyAction[] = AnyAction[],
> = {
  prompts: string;
  instructions: Resolver<Instruction, [ContextState<TContext>]>;
};

export type ContextCapabilities<
  TContext extends AnyContext = AnyContext,
  TAction extends AnyAction[] = AnyAction[],
> = {
  memories: Record<string, Memory>;
  actions: ContextResolver<
    ContextActions<TContext, TAction> | Record<string, ActionConfig>,
    TContext
  >;
  inputs: ContextResolver<Record<string, InputConfig>, TContext>;
  outputs: ContextResolver<Record<string, OutputConfig>, TContext>;
  contexts: ContextRef[];
};

export interface Context<
  TMemory = any,
  TSchema extends Schema = Schema,
  Deps = any,
  Events extends EventsRecord = EventsRecord,
  TCapabilities extends ContextCapabilities = ContextCapabilities,
> {
  // kind: "context";
  /** Unique name identifier for this context */
  name: string;
  /** Zod schema for validating context arguments */
  schema: TSchema;
  /** Function to generate a unique id from context arguments */
  id?: (args: InferSchema<TSchema>) => string;

  // description?: string;

  /** Setup function to initialize context deps */
  setup?: (
    config: {
      id: string;
      args: InferSchema<TSchema>;
      settings: ContextSettings;
    },
    agent: AnyAgent
  ) => MaybePromise<Deps>;

  wm?: ContextResolver<MemoryStore<WorkingMemory>, this>;

  state?: Resolver<
    Omit<MemoryStore<TMemory, any, any>, "name" | "create"> & {
      initial?: TMemory;
    },
    [ContextInit, AnyAgent]
  >;

  loader?: (ctx: ContextState<this>, agent: AnyAgent) => MaybePromise<void>;

  settings?: ContextSettings;

  events?: ContextResolver<Events, this>;

  uses?:
    | Partial<ContextCapabilities>
    | ((
        ctx: ContextState<this>,
        agent: AnyAgent
      ) => Partial<ContextCapabilities>);

  hooks?: ContextHooks<this>;

  // uses?: ContextResolver<ContextRefArray<SubContextRefs>, this>;
  engine?: ContextResolver<EngineFactory<Engine> | Engine, this>;
  // systems?: ContextResolver<SystemRefs<Systems>, this>;

  start?: (ctx: RunContextState<this>) => MaybePromise<void>;
  stop?: (ctx: RunContextState<this>) => MaybePromise<void>;

  run?: (chain: AnyMemory[], ctx: RunContextState<this>) => MaybePromise<any>;

  render?: (
    params: Readonly<{
      components: LLMEngineComponents;
      chain: AnyMemory[];
    }>,
    ctx: RunContextState<this>
  ) => any;

  handlers?: Record<string, Handler<any, any, ContextState<this>>>;
}

export type ContextSettings = {
  model?: LanguageModel;
  maxSteps?: number;
  maxWorkingMemorySize?: number;
  modelSettings?: LLMGenerateSettings;
};

export type ContextRef<TContext extends AnyContext = AnyContext> = {
  context: TContext;
  args: InferContextArgs<TContext>;
};

export type ContextsRefRecord<T extends Record<string, AnyContext>> = {
  [K in keyof T]: ContextRef<T[K]>;
};

export type ContextRefArray<T extends AnyContext[] = AnyContext[]> = {
  [K in keyof T]: ContextRef<T[K]>;
};

type InferContextEvents<TContext extends AnyContext> =
  TContext extends Context<any, any, any, any, infer Events> ? Events : never;

type ContextEventEmitter<TContext extends AnyContext> = <
  T extends Extract<string, keyof InferContextEvents<TContext>>,
>(event: {
  id?: string;
  name: T;
  args: InferSchema<InferContextEvents<TContext>[T]>;
  processed?: boolean;
}) => void;

export interface ContextStateApi<TContext extends AnyContext = AnyContext> {
  emit: ContextEventEmitter<TContext>;
  push(memory: AnyMemory): Promise<void>;
  callAction: (
    call: ActionCallMemory,
    options?: Partial<{
      queueKey: string;
    }>
    // ) => Promise<ActionResultMemory>;
  ) => Promise<any>;
}

export interface ContextStateCtx<State = any> {
  memory: MemoryStoreCtx<AnyMemoryStore>;
  get(): Readonly<State>;
  set(mutate: (state: State) => State): void;
  set(state: State): void;
}

export type ContextTreeRoot<TContext extends AnyContext = AnyContext> = {
  node: ContextTreeNode<TContext>;
};

export type ContextTreeNode<TContext extends AnyContext = AnyContext> = {
  ctx: ContextState<TContext>;
  depth: number;
  parent: ContextTreeNode | ContextTreeRoot;
  components: Partial<{}>;
  children: ContextTreeNode[] | undefined;
};

// export type ContextThread<TContext extends AnyContext = AnyContext> = {
//   id: string;
//   name?: string;
//   root: ContextTreeRoot<TContext>;
// };

export interface ContextState<TContext extends AnyContext = AnyContext> {
  id: string;
  context: TContext;
  args: InferContextArgs<TContext>;
  deps: InferContextDeps<TContext>;
  state: InferContextState<TContext> extends undefined
    ? undefined
    : ContextStateCtx<InferContextState<TContext>>;
  settings: ContextSettings;
  components?: any;
  // children?: any;
  threads?: ContextThreadState<TContext>[];
}

export interface ContextThreadState<TContext extends AnyContext = AnyContext> {
  id: string;
  ctx: ContextState<TContext>;
  // root: ContextTreeRoot<TContext>;
}

// export interface ContextConfigApi {
//   setActions<
//     TContext extends AnyContext,
//     TActions extends Action<Schema, any, unknown, TContext, AnyAgent, any>[],
//   >(
//     ctx: TContext,
//     actions: TActions
//   ): AnyContext;
// }

// export interface ContextStateApi<TContext extends AnyContext = AnyContext> {
//   emit: ContextEventEmitter<TContext>;
//   push: (memory: Memory) => Promise<any>;
//   callAction: (
//     call: ActionCallMemory,
//     options?: Partial<{
//       queueKey: string;
//     }>
//   ) => Promise<ActionResultMemory>;
// }

export interface ContextManager {
  getId<TContext extends AnyContext = AnyContext>(params: {
    context: TContext;
    args: InferContextArgs<TContext>;
  }): string;

  // get<TContext extends AnyContext>(
  //   context: TContext,
  //   args: InferContextArgs<TContext>
  // ): Promise<ContextState<TContext>>;

  get<TContext extends AnyContext>(params: {
    context: TContext;
    args: InferContextArgs<TContext>;
  }): Promise<ContextState<TContext>>;

  getById<TContext extends AnyContext>(
    context: TContext,
    id: string
  ): Promise<ContextState<TContext> | null>;

  load<TContext extends AnyContext>(params: {
    context: TContext;
    args: InferContextArgs<TContext>;
  }): Promise<ContextState<TContext> | null>;

  save(state: ContextState<AnyContext>): Promise<boolean>;

  del<TContext extends AnyContext>(params: {
    context: TContext;
    id: string;
  }): Promise<void>;
}
