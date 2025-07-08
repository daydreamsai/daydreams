import type { AnyAction } from "@/types/action";
import type { Extension } from "@/types/agent";
import type { Input, Output } from "@/types/components";
import type { AnyContext } from "@/types/context";
import type { Engine } from "@/types/engine";
import type { Registry, ServiceProvider } from "@/types/managers";
import type { Memory, MemoryStore } from "@/types/memory";
import type { System } from "@/types/system";
import type { Task } from "@/types/tasks";
import type { Pretty } from "@/types/utils";

interface RegistryTable<
  Item extends { kind: string; name: string } | object = {
    // kind: string;
    name: string;
  },
  TMap extends Map<string, any> = Map<string, Item>,
  TRegistry extends Registry = Registry,
> {
  map: TMap;
  register?(table: this, item: Item, registry: TRegistry): void;
}

type InferRegistryItem<Table> =
  Table extends RegistryTable<infer Item> ? Item : never;

interface DynamicRegistry<Schema extends Record<string, RegistryTable> = any>
  extends Registry {
  // register(type: string, item: any): this;

  register<Key extends keyof Schema>(
    type: Key,
    item: InferRegistryItem<Schema[Key]>
  ): this;

  register<Key extends keyof Schema>(
    type: Key,
    items: InferRegistryItem<Schema[Key]>[]
  ): this;

  registerConfig(
    config: Partial<{
      [K in keyof Schema]: InferRegistryItem<Schema[K]>[];
    }>
  ): this;

  registerRecords(
    records: Partial<{
      [K in keyof Schema]: Record<
        string,
        Omit<InferRegistryItem<Schema[K]>, "name">
      >;
    }>
  ): this;

  get<Key extends keyof Schema>(
    type: Key,
    name: string
  ): InferRegistryItem<Schema[Key]> | null;

  get<T>(type: string, item: any): T;

  resolve<T>(type: string, name: T): T;

  resolve<Key extends keyof Schema>(
    type: Key,
    name: string
  ): InferRegistryItem<Schema[Key]>;

  extend<TSchema extends Record<string, RegistryTable<any, any, this>>>(
    schema: TSchema | ((registry: this) => TSchema)
  ): DynamicRegistry<Pretty<TSchema & Schema>>;
}

export function createDynamicRegistry<
  Schema extends Record<string, RegistryTable>,
>(schema: Schema): DynamicRegistry<Schema> {
  const tables = new Map<keyof Schema, RegistryTable>();

  for (const key in schema) {
    tables.set(key, schema[key]);
  }

  return {
    async install() {},

    registerConfig(config) {
      return this;
    },

    registerRecords(records) {
      return this;
    },

    register(tableName, data) {
      const table = tables.get(tableName);

      if (!table) throw new Error("invalid tableName");
      const items = Array.isArray(data) ? data : [data];

      for (const item of items) {
        if (table.register) {
          table.register(table, item, this);
        } else if ("name" in item) {
          table.map.set(item.name, item);
        } else {
          throw new Error("failed to register no name or register method");
        }
      }

      return this;
    },

    get<Type extends keyof Schema>(tableName: Type, name: any) {
      if (typeof name !== "string") {
        return name;
      }

      const table = tables.get(tableName);
      if (!table) throw new Error("invalid tableName");

      return (
        (table.map.get(name) as InferRegistryItem<Schema[typeof tableName]>) ??
        null
      );
    },

    resolve<Type extends keyof Schema>(type: Type, name: any) {
      if (typeof name !== "string") {
        return name;
      }
      const item = this.get(type, name);
      return item;
    },

    extend(schema) {
      return this;
    },
  };
}

const r = {
  table: function table<
    Item extends { name: string } = { name: string },
    TRegistry extends Registry = Registry,
  >(table: RegistryTable<Item, Map<string, Item>, TRegistry>) {
    return table;
  },
  map: function map<Item extends { name: string } = { name: string }>(
    map?: () => Map<string, Item>
  ): RegistryTable<Item, Map<string, Item>> {
    return {
      map: map ? map() : new Map<string, Item>(),
    };
  },
};

export type DefaultRegistry = ReturnType<typeof dynamicRegistryFactory>;

// export function fromRecords<Item>(record: Record<string, Item>): Item[] {
//   return Object.entries(record).map(([name, item]) => ({
//     name,
//     ...item,
//   }));
// }

export const dynamicRegistryFactory = () =>
  createDynamicRegistry({
    contexts: r.map<AnyContext>(),
    actions: r.map<AnyAction>(),
    inputs: r.map<Input>(),
    outputs: r.map<Output>(),
    engines: r.map<Engine>(),
    services: r.map<ServiceProvider>(),
    systems: r.map<System>(),
    tasks: r.map<Task>(),
    memoryStores: r.map<MemoryStore>(),
  }).extend({
    extensions: r.table({
      map: new Map<string, Extension>(),
      register(table, item, registry) {
        const { name, install, inputs, outputs, ...config } = item;
        table.map.set(name, item);
        registry.registerConfig(config);
        registry.registerRecords({ inputs, outputs });
      },
    }),
  });
