import { v7 as randomUUIDv7 } from "uuid";
import type { MaybePromise } from "../types";
import pDefer, { type DeferredPromise } from "p-defer";
import type { Logger } from "../logger";

type TaskContext = {
  taskId: string;
  abortSignal: AbortSignal;
};

type TaskOptions = {
  concurrency?: number;
  retry?: number | boolean | ((failureCount: number, err: unknown) => boolean);
  priority?: number;
  queueKey?: string;
  timeoutMs?: number;
};

export type Task<Params = any, Result = any, TError = any> = {
  key: string;
  handler: (params: Params, ctx: TaskContext) => MaybePromise<Result>;
  concurrency?: number;
  retry?: boolean | number | ((failureCount: number, error: TError) => boolean);
  priority?: number;
  queueKey?: string;
  timeoutMs?: number;
};

type InferTaskParams<T extends Task<any, any>> = T extends Task<
  infer Params,
  any
>
  ? Params
  : unknown;
type InferTaskResult<T extends Task<any, any>> = T extends Task<
  any,
  infer Result
>
  ? Result
  : unknown;

type TaskInstance<TTask extends Task<any, any> = Task<any, any>> = {
  id: string;
  task: TTask;
  params: InferTaskParams<TTask>;
  options: Omit<TaskOptions, "concurrency">;
  createdAt: Date;
  attempts: number;
  controller: AbortController;
  promise: DeferredPromise<InferTaskResult<TTask>>;
  lastError?: unknown;
};

type Queue = {
  concurrency: number;
  tasks: TaskInstance[];
  running: Set<string>;
};

export class TaskRunner {
  queues = new Map<string, Queue>();
  processing = new Set<string>();
  private logger: Logger;

  constructor(concurrency: number, logger: Logger) {
    this.logger = logger;
    this.queues.set("main", { concurrency, tasks: [], running: new Set() });
    this.logger.debug("task:runner", "TaskRunner initialized", {
      defaultConcurrency: concurrency,
      queueKey: "main",
    });
  }

  setQueue(queueKey: string, concurrency: number) {
    const queue = this.queues.get(queueKey);
    const isNewQueue = !queue;

    this.queues.set(queueKey, {
      tasks: queue?.tasks ?? [],
      running: queue?.running ?? new Set(),
      concurrency,
    });

    this.logger.info(
      "task:queue",
      isNewQueue ? "Created new queue" : "Updated queue",
      {
        queueKey,
        concurrency,
        existingTasks: queue?.tasks.length ?? 0,
        runningTasks: queue?.running.size ?? 0,
      }
    );
  }

  private processQueue(queueKey: string) {
    if (this.processing.has(queueKey)) return;

    const queue = this.queues.get(queueKey);
    if (!queue) {
      this.logger.warn(
        "task:queue",
        "Attempted to process non-existent queue",
        { queueKey }
      );
      return;
    }

    this.processing.add(queueKey);

    this.logger.trace("task:queue", "Processing queue", {
      queueKey,
      pendingTasks: queue.tasks.length,
      runningTasks: queue.running.size,
      concurrency: queue.concurrency,
    });

    try {
      while (queue.tasks.length > 0 && queue.running.size < queue.concurrency) {
        queue.tasks.sort(
          (a, b) => (b.options.priority ?? 0) - (a.options.priority ?? 0)
        );
        const instance = queue.tasks.shift();

        if (!instance) break;

        queue.running.add(instance.id);

        this.logger.debug("task:execution", "Starting task", {
          taskId: instance.id,
          taskKey: instance.task.key,
          queueKey,
          attempts: instance.attempts,
          priority: instance.options.priority ?? 0,
        });

        this.processTask(instance)
          .then((res) => {
            this.logger.info("task:execution", "Task completed successfully", {
              taskId: instance.id,
              taskKey: instance.task.key,
              attempts: instance.attempts,
              executionTime: Date.now() - instance.createdAt.getTime(),
            });
            instance.promise.resolve(res);
          })
          .catch((err) => {
            this.logger.error("task:execution", "Task failed", {
              taskId: instance.id,
              taskKey: instance.task.key,
              attempts: instance.attempts,
              executionTime: Date.now() - instance.createdAt.getTime(),
              error: err instanceof Error ? err.message : String(err),
              errorStack: err instanceof Error ? err.stack : undefined,
            });
            instance.promise.reject(err);
          })
          .finally(() => {
            queue.running.delete(instance.id);
            this.processQueue(queueKey);
          });
      }
    } finally {
      this.processing.delete(queueKey);
    }
  }

  private async processTask(instance: TaskInstance) {
    while (true) {
      instance.attempts++;

      if (instance.attempts > 1) {
        const delayMs = 250 * instance.attempts;
        this.logger.debug("task:retry", "Delaying before retry attempt", {
          taskId: instance.id,
          taskKey: instance.task.key,
          attempt: instance.attempts,
          delayMs,
        });
        await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
      }

      instance.controller.signal.throwIfAborted();

      try {
        const startTime = Date.now();
        const result = await instance.task.handler(instance.params, {
          taskId: instance.id,
          abortSignal: instance.controller.signal,
        });

        this.logger.trace("task:handler", "Task handler completed", {
          taskId: instance.id,
          taskKey: instance.task.key,
          attempt: instance.attempts,
          handlerTime: Date.now() - startTime,
        });

        return result;
      } catch (error) {
        instance.lastError = error;
        const retry = instance.options.retry;

        this.logger.warn("task:execution", "Task handler failed", {
          taskId: instance.id,
          taskKey: instance.task.key,
          attempt: instance.attempts,
          error: error instanceof Error ? error.message : String(error),
          errorType:
            error instanceof Error ? error.constructor.name : typeof error,
          retryConfig: retry === undefined ? "none" : typeof retry,
        });

        let shouldRetry = false;

        if (retry) {
          if (typeof retry === "boolean" && retry) {
            shouldRetry = true;
          } else if (typeof retry === "number" && retry >= instance.attempts) {
            shouldRetry = true;
          } else if (
            typeof retry === "function" &&
            retry(instance.attempts, error)
          ) {
            shouldRetry = true;
          }
        }

        if (shouldRetry) {
          this.logger.info("task:retry", "Retrying task", {
            taskId: instance.id,
            taskKey: instance.task.key,
            attempt: instance.attempts,
            nextAttempt: instance.attempts + 1,
            maxRetries: typeof retry === "number" ? retry : "unlimited",
          });
          continue;
        }

        this.logger.error(
          "task:execution",
          "Task failed after all retry attempts",
          {
            taskId: instance.id,
            taskKey: instance.task.key,
            totalAttempts: instance.attempts,
            finalError: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined,
          }
        );

        throw error;
      }
    }
  }

  async enqueueTask<TTask extends Task<any, any, any>>(
    task: TTask,
    params: InferTaskParams<TTask>,
    options?: Omit<TaskOptions, "concurrency"> & { abortSignal?: AbortSignal }
  ): Promise<InferTaskResult<TTask>> {
    const queueKey = options?.queueKey ?? "main";

    if (!this.queues.has(queueKey)) {
      this.logger.error("task:enqueue", "Invalid queue specified", {
        queueKey,
        availableQueues: Array.from(this.queues.keys()),
      });
      throw new Error("Invalid queue");
    }

    const { key, handler, ...defaultTaskToptions } = task;

    const controller = new AbortController();
    const deferPromise = pDefer<InferTaskResult<TTask>>();

    const instance: TaskInstance<TTask> = {
      id: randomUUIDv7(),
      task,
      params,
      options: {
        ...defaultTaskToptions,
        ...options,
      },
      controller,
      attempts: 0,
      createdAt: new Date(),
      promise: deferPromise,
    };

    this.logger.info("task:enqueue", "Task enqueued", {
      taskId: instance.id,
      taskKey: task.key,
      queueKey,
      priority: instance.options.priority ?? 0,
      retry:
        instance.options.retry !== undefined
          ? typeof instance.options.retry === "number"
            ? `max ${instance.options.retry}`
            : String(instance.options.retry)
          : "none",
      timeoutMs: instance.options.timeoutMs,
    });

    if (instance.options?.timeoutMs) {
      const timeoutSignal = AbortSignal.timeout(instance.options.timeoutMs);

      timeoutSignal.addEventListener(
        "abort",
        () => {
          controller.abort(timeoutSignal.reason);
        },
        {
          once: true,
          signal: controller.signal,
        }
      );
    }

    if (options?.abortSignal) {
      function signalListener() {
        controller.abort(options!.abortSignal!.reason);
      }

      options.abortSignal.addEventListener("abort", signalListener, {
        once: true,
        signal: controller.signal,
      });
    }

    controller.signal.addEventListener(
      "abort",
      () => {
        this.logger.warn("task:abort", "Task aborted", {
          taskId: instance.id,
          taskKey: task.key,
          reason: controller.signal.reason,
          attempts: instance.attempts,
          executionTime: Date.now() - instance.createdAt.getTime(),
        });
        deferPromise.reject(controller.signal.reason);
      },
      {
        once: true,
      }
    );

    const queue = this.queues.get(queueKey)!;
    queue.tasks.push(instance);

    this.logger.trace("task:queue", "Queue state after enqueue", {
      queueKey,
      pendingTasks: queue.tasks.length,
      runningTasks: queue.running.size,
      concurrency: queue.concurrency,
    });

    setTimeout(() => this.processQueue(queueKey), 0);

    return deferPromise.promise;
  }
}

export function task<Params = any, Result = any>(
  definition: Task<Params, Result>
) {
  return definition;
}
