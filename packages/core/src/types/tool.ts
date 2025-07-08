import type { AnyAgent } from "./agent";
import type { AnyContext } from "./context";
import type { ToolCallMemory } from "./wm";
import type { RunContextState } from "./run";
import type { InferSchema, MaybePromise, Resolver, Schema } from "./utils";

export type AnyTool = Tool<any, any, any>;

export type InferToolSchema<TTool extends AnyTool> =
  TTool extends Tool<infer Schema, any, any> ? Schema : never;

export type InferToolArgs<TTool extends AnyTool> = InferSchema<
  InferToolSchema<TTool>
>;

export type InferToolResult<TTool extends AnyTool> =
  TTool extends Tool<any, infer Result, any> ? Result : never;

interface ToolContext extends RunContextState<AnyContext> {}

export interface ToolCallContext<TTool extends AnyTool = AnyTool>
  extends ToolContext {
  tool: TTool;
  memory: ToolCallMemory;
  abortSignal: AbortSignal;
}

export type ToolHandler<
  TTool extends AnyTool = AnyTool,
  TAgent extends AnyAgent = AnyAgent,
> = (
  args: InferToolArgs<TTool>,
  ctx: ToolCallContext<TTool>,
  agent: TAgent
) => MaybePromise<InferToolResult<TTool>>;

export interface Tool<
  TSchema extends Schema = Schema,
  TResult = any,
  TAgent extends AnyAgent = AnyAgent,
> {
  name: string;
  description?: string;
  instructions?: string;
  schema?: TSchema;
  install?: (agent: TAgent) => Promise<void> | void;
  handler: ToolHandler<this>;
  onSuccess?: (
    result: TResult,
    ctx: ToolCallContext<this>,
    agent: TAgent
  ) => Promise<void> | void;
  retry?:
    | boolean
    | number
    | ((failureCount: number, error: unknown) => boolean);
  onError?: (
    err: unknown,
    ctx: ToolCallContext<this>,
    agent: TAgent
  ) => MaybePromise<any>;
  queueKey?: Resolver<string, [ctx: ToolCallContext<this>]>;
  parser?: (ref: ToolCallMemory) => InferSchema<Schema>;
  callFormat?: "json" | "xml";
  examples?: string[];
}

export type ToolConfig<
  TSchema extends Schema = Schema,
  TResult = any,
  TAgent extends AnyAgent = AnyAgent,
> = Omit<Tool<TSchema, TResult, TAgent>, "name">;
