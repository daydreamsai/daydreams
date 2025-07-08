import { z } from "zod";
import type {
  AnyMemory,
  AnyMemoryStore,
  Memory,
  MemoryMutation,
} from "./types/memory";
import type { InferSchema, Schema } from "./types/utils";
import { randomUUIDv7 } from "./utils";

export type MemoryFactory<Name extends string, TSchema extends Schema> = (
  content: InferSchema<TSchema>,
  parent?: AnyMemory
) => Memory<Name, InferSchema<TSchema>>;

export type CustomMemoryFactory<Kind extends string = string> = <
  Name extends string,
  TSchema extends Schema = Schema,
>(
  params: {
    name: Name;
    schema: TSchema;
    content: InferSchema<TSchema>;
  },
  parent?: AnyMemory
) => Memory<`${Kind}.${Name}`, InferSchema<TSchema>, any>;

export type MemoryConfig<
  Name extends string = string,
  TSchema extends Schema = Schema,
> =
  | TSchema
  | { schema: TSchema }
  | ((kind: string) => CustomMemoryFactory<Name>);

export type MemoryRecord<T extends Record<string, MemoryConfig>> = {
  [K in keyof T]: T[K] extends undefined
    ? Memory<Extract<K, string>, T[K]>
    : T[K] extends (kind: string) => CustomMemoryFactory
      ? CustomMemoryFactory<Extract<K, string>>
      : T[K] extends Schema
        ? MemoryFactory<Extract<K, string>, T[K]>
        : never;
};

export const memoryRef = z.object({ kind: z.string(), id: z.string() });

export const memorySchema = z.object({
  kind: z.string(),
  id: z.string(),
  name: z.string().or(z.undefined()),
  raw: z.any(),
  chunks: z.array(z.any()).default([]),
  content: z.any(),
  timestamp: z.number(),
  parent: memoryRef.or(z.undefined()),
  children: memoryRef.array().default([]),
  metadata: z.record(z.record(z.any())).default({}),
  labels: z.array(z.string()).default([]),
});

export function createMemory<TMemory extends AnyMemory>(
  params: Partial<TMemory>
): TMemory {
  return memorySchema.parse({
    id: randomUUIDv7(),
    kind: params.kind ?? "unknow",
    name: params.name ?? undefined,
    content: params.content ?? undefined,
    raw: params.raw ?? undefined,
    chunks: params.chunks,
    timestamp: params.timestamp ?? Date.now(),
    parent: params.parent ?? undefined,
    children: params.children,
    metadata: params.metadata,
    labels: params.labels,
  }) as TMemory;
}

export function memories<T extends Record<string, MemoryConfig>>(
  record: T
): MemoryRecord<T> {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => {
      if (typeof value === "function") {
        value(key);
        return [key, value(key)];
      }
      return [
        key,
        (data: any) =>
          createMemory({
            kind: key,
            content: data,
            name: undefined,
          }),
      ];
    })
  );
}

export const customMemoryFactory: <Kind extends string>(
  kind: Kind
) => CustomMemoryFactory<Kind> = (kind) => (params, parent?: AnyMemory) =>
  createMemory({
    kind,
    name: params.name,
    content: params.content,
    parent,
  });

export function mutation<
  TSchema extends Schema,
  TMemoryStore extends AnyMemoryStore,
>(
  config: MemoryMutation<TSchema, TMemoryStore>
): MemoryMutation<TSchema, TMemoryStore> {
  return config;
}
