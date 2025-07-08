import type { MaybePromise } from "./utils";

export type TaskContext = {
  taskId: string;
  abortSignal: AbortSignal;
};

export type TaskOptions = {
  concurrency?: number;
  retry?: number | boolean | ((failureCount: number, err: unknown) => boolean);
  priority?: number;
  queueKey?: string;
  timeoutMs?: number;
};

export type Task<Params = any, Result = any, TError = unknown> = {
  name: string;
  handler: (params: Params, ctx: TaskContext) => MaybePromise<Result>;
  concurrency?: number;
  retry?: boolean | number | ((failureCount: number, error: TError) => boolean);
  priority?: number;
  queueKey?: string;
  timeoutMs?: number;
};

export type InferTaskParams<T extends Task<any, any>> =
  T extends Task<infer Params, any> ? Params : unknown;

export type InferTaskResult<T extends Task<any, any>> =
  T extends Task<any, infer Result> ? Result : unknown;
