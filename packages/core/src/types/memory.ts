import type { InferSchema, MaybePromise, Pretty, Schema } from "./utils";

export type MemoryDefinition<
  Name extends string = string,
  TSchema extends Schema = Schema,
> = {
  kind: Name;
  schema: TSchema;
};

export type PartialMemory<TMemory extends AnyMemory = AnyMemory> = Pick<
  TMemory,
  "kind"
> &
  Partial<TMemory>;

export type AnyMemory = Memory<any, any, any>;
export type MemoryRef = { kind: string; id: string };

export type MemoryChunk<TMemory extends AnyMemory = AnyMemory> =
  | { type: "memory"; memory: TMemory; done: boolean }
  | { type: "content"; id: string; content: string }
  | { type: "data"; id: string; data: any }
  | { type: "done"; id: string };

export type InferMemoryContent<TMemory> =
  TMemory extends Memory<any, infer Content, any> ? Content : never;

export interface Memory<
  Kind extends string = string,
  Content = undefined,
  Metadata = any,
> {
  kind: Kind;
  id: string;
  name?: string | undefined;
  timestamp: number;
  raw?: any;
  content: Content;
  parent: MemoryRef | undefined;
  labels: string[];
  children: MemoryRef[];
  metadata: Record<string, Record<string, any>>;
  chunks: MemoryChunk<this>[];
  // committed?
}

export type MemoryFactory = (args: any) => AnyMemory;
export type MemoryKindRecord = Record<string, AnyMemory | MemoryFactory>;

export type MemoryMutationHandler<
  TSchema extends Schema = Schema,
  TStore extends AnyMemoryStore = AnyMemoryStore,
> = (
  args: InferSchema<TSchema>,
  ctx: MemoryStoreCtx<TStore>
) => MaybePromise<void>;

export type InferMemoryMutationArgs<
  TMemoryMutation extends MemoryMutation<any, any>,
> =
  TMemoryMutation extends MemoryMutation<infer TSchema, any>
    ? InferSchema<TSchema>
    : any;

export type MemoryMutation<
  TSchema extends Schema = Schema,
  TStore extends AnyMemoryStore = AnyMemoryStore,
> = {
  name: string;
  schema: TSchema;
  id?: (params: InferSchema<TSchema>) => string;
  store?: TStore;
  handler: MemoryMutationHandler<TSchema, TStore>;
};
export type MemoryMutationRecord = Record<string, MemoryMutation<any, any>>;

export type InferMemoryStoreData<TMemoryStore extends AnyMemoryStore> =
  TMemoryStore extends MemoryStore<infer Data, any, any, any, any>
    ? Data
    : never;

export type InferMemoryStoreArgs<TMemoryStore extends AnyMemoryStore> =
  TMemoryStore extends MemoryStore<any, infer Schema, any, any, any>
    ? InferSchema<Schema>
    : never;

export type InferMemoryStoreDeps<TMemoryStore extends AnyMemoryStore> =
  TMemoryStore extends MemoryStore<any, any, any, infer Deps, any>
    ? Deps
    : never;

export type InferMemoryStoreKinds<TMemoryStore extends AnyMemoryStore> =
  TMemoryStore extends MemoryStore<any, any, infer Kinds, any, any>
    ? Kinds
    : never;

export type AnyMemoryStore = MemoryStore<any, any, any, any, any>;

export interface MemoryStore<
  Data = any,
  TSchema extends Schema = Schema,
  TMemories extends MemoryKindRecord = MemoryKindRecord,
  Deps = any,
  TMutation extends MemoryMutationRecord = MemoryMutationRecord,
> {
  name: string;
  schema?: TSchema;
  memories?: TMemories;
  id?: (args: InferSchema<TSchema>) => string;
  setup?: (params: {
    id: string;
    args: InferSchema<TSchema>;
  }) => MaybePromise<Deps>;
  create: (ctx: {
    id: string;
    args: InferSchema<TSchema>;
    deps: Deps;
  }) => MaybePromise<Data>;

  mutations?: (
    m: <MutationSchema extends TSchema>(config: {
      schema: MutationSchema;
      handler: (params: MutationSchema) => MaybePromise<void>;
    }) => MemoryMutation<MutationSchema, this>
  ) => TMutation;

  // mutations: () => TMutation;

  load?: (id: string, ctx: MemoryStoreCtx<this>) => MaybePromise<void>;
  save?: (data: Data, ctx: MemoryStoreCtx<this>) => MaybePromise<void>;
}

export interface MemoryStoreCtx<
  TMemoryStore extends AnyMemoryStore = AnyMemoryStore,
> {
  id: string;
  store: TMemoryStore;
  args: InferMemoryStoreArgs<TMemoryStore>;
  data: InferMemoryStoreData<TMemoryStore>;
  deps: InferMemoryStoreDeps<TMemoryStore>;
  // kinds: InferMemoryStoreKinds<TMemoryStore>;
}

export interface KVStore {
  get<T>(key: string | string[]): Promise<T | null>;
  set<T>(key: string | string[], value: T): Promise<void>;
  delete(key: string | string[]): Promise<void>;
  clear(): Promise<void>;
  keys(base?: string): Promise<string[]>;
}

export interface MemoryStoreManager {
  get<TMemoryStore extends AnyMemoryStore>(
    memory: TMemoryStore,
    args: InferMemoryStoreArgs<TMemoryStore>
  ): Promise<MemoryStoreCtx<TMemoryStore>>;

  load<TMemoryStore extends AnyMemoryStore>(
    memory: TMemoryStore,
    id: string
  ): Promise<MemoryStoreCtx<TMemoryStore> | null>;

  save<TMemoryStore extends AnyMemoryStore>(
    state: MemoryStoreCtx<TMemoryStore>
  ): Promise<boolean>;

  set<TMemoryStore extends AnyMemoryStore>(
    memory: TMemoryStore,
    args: InferMemoryStoreArgs<TMemoryStore>,
    data?: InferMemoryStoreData<TMemoryStore>
  ): Promise<void>;

  del<TMemoryStore extends AnyMemoryStore>(
    memory: TMemoryStore,
    id: string
  ): Promise<void>;
}
