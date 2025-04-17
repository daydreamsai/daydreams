import { v7 as randomUUIDv7 } from "uuid";
import type { MaybePromise } from "./types";
import pDefer, { type DeferredPromise } from "p-defer";

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

type Task<Params = any, Result = any, TError = any> = {
  key: string;
  handler: (params: Params, ctx: TaskContext) => MaybePromise<Result>;
  concurrency?: number;
  retry?: boolean | number | ((failureCount: number, error: TError) => boolean);
  priority?: number;
  queueKey?: string;
  timeoutMs?: number;
};

type InferTaskParams<T extends Task<any, any>> =
  T extends Task<infer Params, any> ? Params : unknown;
type InferTaskResult<T extends Task<any, any>> =
  T extends Task<any, infer Result> ? Result : unknown;

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

  constructor(concurrency: number) {
    this.queues.set("main", { concurrency, tasks: [], running: new Set() });
  }

  setQueue(queueKey: string, concurrency: number) {
    const queue = this.queues.get(queueKey);

    this.queues.set(queueKey, {
      tasks: queue?.tasks ?? [],
      running: queue?.running ?? new Set(),
      concurrency,
    });
  }

  private processQueue(queueKey: string) {
    if (this.processing.has(queueKey)) return;

    const queue = this.queues.get(queueKey);
    if (!queue) return;

    this.processing.add(queueKey);

    try {
      while (queue.tasks.length > 0 && queue.running.size < queue.concurrency) {
        queue.tasks.sort(
          (a, b) => (b.options.priority ?? 0) - (a.options.priority ?? 0)
        );
        const instance = queue.tasks.shift();

        if (!instance) break;

        queue.running.add(instance.id);

        this.processTask(instance)
          .then((res) => {
            instance.promise.resolve(res);
          })
          .catch((err) => {
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
      instance.controller.signal.throwIfAborted();

      try {
        instance.attempts++;

        if (instance.attempts > 1) {
          await new Promise<void>((resolve) =>
            setTimeout(resolve, 250 * instance.attempts)
          );
        }

        const result = await Promise.try(
          instance.task.handler,
          instance.params,
          {
            taskId: instance.id,
            abortSignal: instance.controller.signal,
          }
        );

        return result;
      } catch (error) {
        const retry = instance.options.retry;

        if (retry) {
          if (typeof retry === "boolean" && retry) continue;
          if (typeof retry === "number" && retry >= instance.attempts) continue;
          if (typeof retry === "function" && retry(instance.attempts, error))
            continue;
        }

        throw error;
      }
    }
  }

  enqueueTask<TTask extends Task<any, any, any>>(
    task: TTask,
    params: InferTaskParams<TTask>,
    options?: Omit<TaskOptions, "concurrency"> & { abortSignal?: AbortSignal }
  ): Promise<InferTaskResult<TTask>> {
    const queueKey = options?.queueKey ?? "main";

    if (!this.queues.has(queueKey)) {
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
      });

      deferPromise.promise.finally(() => {
        options.abortSignal?.removeEventListener("abort", signalListener);
      });
    }

    controller.signal.addEventListener(
      "abort",
      () => {
        deferPromise.reject(controller.signal.reason);
      },
      {
        once: true,
      }
    );

    this.queues.get(queueKey)!.tasks.push(instance);

    setTimeout(() => this.processQueue(queueKey), 0);

    return deferPromise.promise;
  }
}

export function task<Params = any, Result = any>(
  definition: Task<Params, Result>
) {
  return definition;
}
