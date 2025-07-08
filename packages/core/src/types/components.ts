import type { AnyAgent } from "./agent";
import type { AnyContext, InferContextArgs } from "./context";
import type { InputMemory, OutputMemory } from "./wm";
import type { RunContextState } from "./run";
import type { InferSchema, MaybePromise, Schema } from "./utils";

export type Instruction = string | string[];

export type Event<TSchema extends Schema = Schema> = {
  name: string;
  schema: TSchema;
};

export type OutputMemoryResponse = Pick<OutputMemory, "content"> & {
  processed?: boolean;
};

export interface OutputCtx<
  TSchema extends Schema = Schema,
  TContext extends AnyContext = AnyContext,
> extends RunContextState<TContext> {
  memory: OutputMemory<InferSchema<TSchema>>;
}

export interface Output<
  TSchema extends Schema = Schema,
  TResponse = any,
  TContext extends AnyContext = AnyContext,
  TAgent extends AnyAgent = AnyAgent,
> {
  // kind: "output";
  name: string;
  description?: string;
  instructions?: string;
  schema?: TSchema;
  context?: TContext;
  install?: (agent: TAgent) => MaybePromise<void>;
  enabled?: (ctx: RunContextState<TContext>) => boolean;
  handler?: (
    data: InferSchema<TSchema>,
    ctx: OutputCtx<TSchema, TContext>,
    agent: TAgent
  ) => MaybePromise<TResponse>;

  // format?: (res: OutputMemory<TResponse["data"]>) => string | string[] | XMLElement;
  /** Optional evaluator for this specific output */
  // evaluator?: Evaluator<OutputResponse, RunContextState<Context>, TAgent>;

  examples?: string[];

  outputFormat?: "json" | "xml" | "text" | "jsx";
}

export type AnyOutput = Output<any, any, any, any>;

export interface InputCtx<
  TSchema extends Schema = Schema,
  TContext extends AnyContext = AnyContext,
> extends RunContextState<TContext> {
  memory: InputMemory<InferSchema<TSchema>>;
}

export type AnyInput = Input<any, any, any>;

export interface Input<
  TSchema extends Schema = Schema,
  TResult = any,
  TContext extends AnyContext = AnyContext,
  TAgent extends AnyAgent = AnyAgent,
> {
  // kind: "input";
  name: string;
  description?: string;
  schema?: TSchema;
  context?: TContext;
  install?: (agent: TAgent) => MaybePromise<void>;
  enabled?: (ctx: RunContextState<TContext>) => Promise<boolean> | boolean;

  handler?: (
    data: InferSchema<Schema>,
    ctx: InputCtx<TSchema, TContext>,
    agent: TAgent
  ) => MaybePromise<TResult>;

  // format?: (
  //   ref: InputMemory<InferSchema<Schema>>
  // ) => string | string[] | XMLElement;

  __subscribe?: (
    send: <TContext extends AnyContext>(
      context: TContext,
      args: InferContextArgs<TContext>,
      data: InferSchema<Schema>
    ) => MaybePromise<void>,
    agent: TAgent
  ) => (() => void) | void | Promise<void | (() => void)>;
}

export type InferInputSchema<TInput extends Input> =
  TInput extends Input<infer Schema> ? Schema : never;

export type Evaluator<
  Data = any,
  Context extends RunContextState<any> = RunContextState<any>,
  TAgent extends AnyAgent = AnyAgent,
> = {
  name: string;
  description?: string;
  schema?: Schema;
  prompt?: string;
  handler?: (
    data: Data,
    ctx: Context,
    agent: TAgent
  ) => Promise<boolean> | boolean;
  onFailure?: (ctx: Context, agent: TAgent) => Promise<void> | void;
};

export type OutputConfig<
  TSchema extends Schema = Schema,
  TResponse = any,
  TContext extends AnyContext = AnyContext,
  TAgent extends AnyAgent = AnyAgent,
> = Omit<Output<TSchema, TResponse, TContext, TAgent>, "kind" | "name">;

export type InputConfig<
  TSchema extends Schema = Schema,
  TResult = any,
  TContext extends AnyContext = AnyContext,
  TAgent extends AnyAgent = AnyAgent,
> = Omit<Input<TSchema, TResult, TContext, TAgent>, "kind" | "name">;

export type SendInput<TInput extends AnyInput | string = string> =
  TInput extends AnyInput
    ? { ref: TInput; args: InferInputSchema<TInput> }
    : { ref: TInput; args: any };
