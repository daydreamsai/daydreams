import type { Memory, MemoryState } from "./memory";
import type {
  Handler,
  InferHandlerParams,
  InferHandlerResult,
  InferSchema,
  MaybePromise,
  Resolver,
  Schema,
} from "./utils";

export type AnySystem = System<any, any, any, any>;

export type SystemHandler<Ctx = any, THandler extends Handler = Handler> = (
  params: InferHandlerParams<THandler>,
  next: THandler,
  ctx: Ctx
) => InferHandlerResult<THandler> | MaybePromise<void>;

export type SystemCtx<TSystem extends AnySystem = AnySystem> =
  TSystem extends System<infer Schema, infer TMemory, infer Deps, any>
    ? {
        id: string;
        system: TSystem;
        args: InferSchema<Schema>;
        deps: Deps;
        memory: MemoryState<Memory<TMemory>>;
      }
    : never;

export interface System<
  TSchema extends Schema = Schema,
  TMemory = any,
  Deps = any,
  Modules extends Record<string, Record<string, Handler>> = Record<
    string,
    Record<string, Handler>
  >,
> {
  name: string;
  version?: number;
  schema: TSchema;
  setup?: (args: InferSchema<TSchema>) => Deps;
  id?: (args: InferSchema<TSchema>) => string;
  memory?: TMemory;
  modules?: Modules;
  handlers: Resolver<
    Partial<{
      [ModuleKey in keyof Modules]: Partial<{
        [HandlerKey in keyof Modules[ModuleKey]]: SystemHandler<
          SystemCtx<this>,
          Modules[ModuleKey][HandlerKey]
        >;
      }>;
    }>,
    [SystemCtx<this>]
  >;
  // render?: Resolver<string, [SystemCtx<this>]>;
}

export type InferSystemDeps<TSystem extends AnySystem> =
  TSystem extends System<any, infer Deps> ? Deps : never;

export type InferSystemMemory<TSystem extends AnySystem> =
  TSystem extends System<any, Memory> ? System<any, Memory> : never;

export type InferSystemArgs<TSystem extends AnySystem> =
  TSystem extends System<infer TSchema, any, any, any>
    ? InferSchema<TSchema>
    : never;

export type SystemRef<TSystem extends AnySystem = AnySystem> = {
  system: TSystem;
  args: InferSystemArgs<TSystem>;
};

export type SystemRefs<Systems extends AnySystem[] = AnySystem[]> = {
  [K in keyof Systems]: SystemRef<Systems[K]>;
};
