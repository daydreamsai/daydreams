import type {
  AnyContext,
  ContextState,
  InferSchema,
  Log,
  WorkingMemory,
} from "@daydreamsai/core";

export interface RunParams {
  context: {
    type: string;
    args: any;
  };

  chain: Log[];

  model?: string;

  abortSignal?: AbortSignal;
}

export interface SendParams {
  context: {
    type: string;
    args: any;
  };

  input: {
    type: string;
    data: any;
  };

  model?: string;

  abortSignal?: AbortSignal;
}

export type ContextStateData<T extends AnyContext = AnyContext> = Pick<
  ContextState<T>,
  "memory" | "settings"
>;

export interface Handlers {
  getContext<T extends AnyContext = AnyContext>(params: {
    context: string;
    args: InferSchema<T>;
  }): Promise<ContextStateData<T>>;
  getContextById<T extends AnyContext = AnyContext>(
    contextId: string
  ): Promise<ContextStateData<T> | null>;
  saveContext(contextId: string, state: ContextStateData): Promise<boolean>;
  deleteContext(contextId: string): Promise<void>;
  getWorkingMemory(contextId: string): Promise<WorkingMemory>;
  run(params: RunParams): Promise<void>;
  send(params: SendParams): Promise<void>;
}
