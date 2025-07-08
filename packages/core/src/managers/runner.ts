import { parseSchema } from "@/engines/handlers/parse";
import type {
  SystemRef,
  SystemCtx,
  AnySystem,
  SystemHandler,
} from "@/types/system";
import type {
  Handler,
  InferHandlerParams,
  InferHandlerResult,
} from "@/types/utils";
import pDefer from "p-defer";

export type Runner = {
  states: Map<string, SystemCtx>;

  run<THandler extends Handler, TError = Error>(
    key: string,
    handler: THandler,
    params: InferHandlerParams<THandler>,
    systems?: SystemRef[]
  ): Promise<[undefined, InferHandlerResult<THandler>] | [TError, undefined]>;

  try<THandler extends Handler>(
    key: string,
    handler: THandler,
    params: InferHandlerParams<THandler>,
    systems?: SystemRef[]
  ): Promise<InferHandlerResult<THandler>>;

  catch<THandler extends Handler>(
    key: string,
    handler: THandler,
    params: InferHandlerParams<THandler>,
    systems?: SystemRef[]
  ): Promise<undefined | unknown>;

  runSync<THandler extends Handler>(
    key: string,
    handler: THandler,
    params: InferHandlerParams<THandler>,
    systems?: SystemRef[]
  ): InferHandlerResult<THandler>;
};

function get<T extends Record<string, any>>(obj: T, key: string) {
  // console.log({ obj, key, value: obj[key] });
  if (key in obj) return obj[key];
  return undefined;
}

function getSystemKey(system: AnySystem, id: string) {
  return [system.name, id].join(":");
}

export function createRunner(): Runner {
  const runner: Runner = {
    states: new Map<string, SystemCtx>(),

    runSync(key, handler, params, systems) {
      console.log("running snyc", key);
      return handler(params, {});
    },

    try(key, handler, params, systems) {
      console.log("try", key);
      return Promise.try(handler, params, {});
    },

    async catch(key, handler, params, systems) {
      console.log("catch", key);
      try {
        await handler(params, {});
        return undefined;
      } catch (error) {
        return error;
      }
    },

    async run(key, handler, params, systems) {
      console.log("run", key);
      const [moduleKey, handlerKey] = key.split(".");

      // const fn = systems?.reduce<typeof handler>((current, systemRef) => {
      //   const { system } = systemRef;
      //   if (!system.handlers) return current;

      //   const sys: SystemHandler<SystemCtx, typeof handler> | undefined = get(
      //     get(system.handlers, moduleKey),
      //     handlerKey
      //   );

      //   console.log({ sys, moduleKey, handlerKey });

      //   if (!sys) return current;

      //   const args = parseSchema(system.schema, systemRef.args);
      //   const id = system.id ? system.id(args) : "default";
      //   const systemKey = getSystemKey(system, id);

      //   const fn: any = async (params: InferHandlerParams<Handler>) => {
      //     const defer = pDefer<InferHandlerResult<Handler>>();
      //     const ctx: SystemCtx = runner.states.has(systemKey)
      //       ? runner.states.get(systemKey)!
      //       : {
      //           id,
      //           args,
      //           deps: system.setup ? system.setup(args) : undefined,
      //           memory: undefined as any,
      //           system,
      //         };

      //     let called = false;
      //     async function next(params: InferHandlerParams<typeof handler>) {
      //       if (called) return defer.promise;
      //       called = true;
      //       const promise = current(params);
      //       defer.resolve(promise);
      //       return promise;
      //     }
      //     const sysRes = await sys(params, next as typeof handler, ctx);
      //     return sysRes ?? next(params);
      //   };

      //   return fn;
      // }, handler);

      try {
        const res = await handler(params, {});
        return [undefined, res] as any;
      } catch (error) {
        return [error, undefined] as any;
      }
    },
  };
  return runner;
}
