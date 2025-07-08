import type {
  InferMemoryStoreArgs,
  InferMemoryStoreData,
  InferMemoryStoreDeps,
  KVStore,
  MemoryStoreManager,
  MemoryStoreCtx,
  AnyMemoryStore,
  MemoryStore,
} from "@/types/memory";

type MemoryKVData<TMemoryStore extends AnyMemoryStore> = {
  id: string;
  name: string;
  args: InferMemoryStoreArgs<TMemoryStore>;
  data?: InferMemoryStoreData<TMemoryStore>;
};

function createMemoryStoreCtx<TMemoryStore extends AnyMemoryStore>({
  store,
  args,
  id,
  deps,
}: {
  store: TMemoryStore;
  args: InferMemoryStoreArgs<TMemoryStore>;
  id?: string;
  deps?: InferMemoryStoreDeps<TMemoryStore>;
}) {
  id ??= store.id ? store.id(args) : "default";
  deps ??= store.setup?.({ id, args }) ?? undefined;

  const data = store.create({ id, args, deps });

  const ctx: MemoryStoreCtx<TMemoryStore> = {
    id,
    store,
    args,
    data,
    deps: deps!,
  };

  return ctx;
}

// query instead of create; actions, context loader
// mutations update data

type MemoryApi<TMemoryStore extends AnyMemoryStore> = {
  get(): InferMemoryStoreData<TMemoryStore>;
  set(data: InferMemoryStoreData<TMemoryStore>): void;
  set(
    updater: (
      data: InferMemoryStoreData<TMemoryStore>
    ) => InferMemoryStoreData<TMemoryStore>
  ): void;
  // subscribe
};

function createMemoryApi<TMemory extends AnyMemoryStore>(
  state: MemoryStoreCtx<TMemory>
) {
  return {};
}

export function createMemoryStoreManager({
  kv,
}: {
  kv: KVStore;
}): MemoryStoreManager {
  const stores = new Map<string, MemoryStoreCtx>();

  function getKey(memory: MemoryStore, id: string) {
    return [memory.name, id].join(":");
  }

  return {
    async get(store, args) {
      const id = store.id ? store.id(args) : "default";
      let state = await this.load(store, id);
      if (!state) {
        state = createMemoryStoreCtx({ store, args, id });
        stores.set(getKey(store, id), state);
      }

      return state;
    },

    async load(store, id) {
      const storeKey = getKey(store, id);
      if (stores.has(storeKey))
        return stores.get(storeKey)! as MemoryStoreCtx<typeof store>;

      const saved = await kv.get<MemoryKVData<typeof store>>([
        "memory-store",
        storeKey,
      ]);

      if (saved) {
        const deps = store.setup?.({ id, args: saved.args }) ?? undefined;
        const data = store.load ? await store.load(id, deps) : saved.data;

        if (data === undefined)
          return createMemoryStoreCtx({ store, args: saved.args, id, deps });

        const state: MemoryStoreCtx<typeof store> = {
          id,
          store,
          args: saved.args,
          data,
          deps,
        };

        stores.set(storeKey, state);

        return state;
      }

      return null;
    },

    async save(state) {
      await kv.set<MemoryKVData<typeof state.store>>(
        ["memory", getKey(state.store, state.id)],
        {
          id: state.id,
          name: state.store.name,
          args: state.args,
          data: state.store.save ? undefined : state.data,
        }
      );

      await state.store.save?.(state.data, state.deps);

      return true;
    },

    async set(store, args, data) {
      const state = await this.get(store, args);
      if (data) state.data = data;
      await this.save(state);
    },

    async del(store, id) {},
  };
}
