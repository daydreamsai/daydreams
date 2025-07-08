import type { AnyAgent } from "./agent";
import type { Evaluator } from "./components";
import type { AnyContext, ContextStateApi } from "./context";
import type { ActionCallMemory, ActionResultMemory } from "./wm";
import type { Memory, MemoryStore } from "./memory";
import type { RunContextState } from "./run";
import type { InferSchema, MaybePromise, Resolver, Schema } from "./utils";

export type AnyAction = Action<any, any, any, any, any, any, any>;

export type AnyActionWithContext<Ctx extends AnyContext> = Action<
  any,
  any,
  any,
  Ctx,
  any,
  any
>;

type InferActionSchema<TAction> =
  TAction extends Action<any, infer Schema> ? Schema : never;

type InferActionArgs<TAction> = InferSchema<InferActionSchema<TAction>>;

type InferActionResult<TAction> =
  TAction extends Action<any, any, infer Result> ? Result : never;

type InferActionContext<TAction> =
  TAction extends Action<any, any, any, infer TContext> ? TContext : never;

type InferActionMemory<TAction> =
  TAction extends Action<any, any, any, infer TContext, infer TMemory>
    ? TContext
    : never;

interface ActionContext<TAction extends AnyAction>
  extends RunContextState<InferActionContext<TAction>> {}

export interface ActionCallContext<TAction extends AnyAction = AnyAction>
  extends ActionContext<TAction>,
    ContextStateApi<InferActionContext<TAction>> {
  memory: ActionCallMemory<InferActionArgs<TAction>>;
  abortSignal: AbortSignal;
}

export type ActionHandler<
  TAction extends AnyAction = AnyAction,
  TAgent extends AnyAgent = AnyAgent,
> = (
  args: InferActionArgs<TAction>,
  ctx: ActionCallContext<TAction>,
  agent: TAgent
) => MaybePromise<InferActionResult<TAction>>;

export interface Action<
  TContext extends AnyContext = AnyContext,
  TSchema extends Schema = Schema,
  TResult = any,
  TError = unknown,
  Deps = any,
  TMemory = any,
  TAgent extends AnyAgent = AnyAgent,
> {
  name: string;

  description?: string;
  instructions?: string;

  schema?: TSchema;
  memory?: Resolver<MemoryStore<TMemory>, []>;
  context?: Resolver<TContext, []>;

  install?: (agent: TAgent) => Promise<void> | void;

  setup?: (ctx: RunContextState<TContext>) => Deps;

  enabled?: (ctx: ActionContext<this>) => boolean;

  handler: ActionHandler<this>;

  format?: (result: ActionResultMemory<string, TResult>) => string | string[];

  evaluator?: Evaluator<TResult, RunContextState<TContext>, TAgent>;

  onSuccess?: (
    result: ActionResultMemory<string, TResult>,
    ctx: ActionCallContext<this>,
    agent: TAgent
  ) => Promise<void> | void;

  retry?: boolean | number | ((failureCount: number, error: TError) => boolean);

  onError?: (
    err: TError,
    ctx: ActionCallContext<this>,
    agent: TAgent
  ) => MaybePromise<any>;

  queueKey?: Resolver<string, [ctx: ActionCallContext<this>]>;

  parser?: (ref: ActionCallMemory) => InferSchema<Schema>;

  callFormat?: "json" | "xml" | "text" | "jsx";

  examples?: string[];
}

export type ActionConfig<
  TContext extends AnyContext = AnyContext,
  TSchema extends Schema = Schema,
  TResult = any,
  TError = unknown,
  Deps = any,
  TMemory = any,
  TAgent extends AnyAgent = AnyAgent,
> = Omit<
  Action<TContext, TSchema, TResult, TError, Deps, TMemory, TAgent>,
  "name"
>;
