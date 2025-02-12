import { randomUUIDv7 } from "bun";
import type { Debugger } from "./types";
import type { Logger } from "./logger";

export type TaskOptions = {
  limit?: number;
  retry?: number;
  debug?: Debugger;
};

export type TaskContext = {
  callId: string;
  debug: Debugger;
};

export type Task<Params, Result> = {
  (params: Params, options?: TaskOptions): Promise<Result>;
};

export function task<Params, Result>(
  key: string,
  fn: (params: Params, ctx: TaskContext) => Promise<Result>,
  defaultOptions?: TaskOptions
): Task<Params, Result> {
  async function call(params: Params, callOptions?: TaskOptions) {
    const callId = randomUUIDv7();

    const options = {
      ...defaultOptions,
      ...callOptions,
    };

    console.log([key, callId], params, options);
    try {
      const res = await Promise.resolve(
        fn(params, {
          callId,
          debug: options?.debug ?? (() => {}),
        })
      );
      console.log([key, callId], res);
      return res;
    } catch (error) {
      console.log([key, callId], { error });
      throw error;
    }
  }

  return Object.assign(call, {});
}
