---
title: "ContextState"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / ContextState

# Type Alias: ContextState\<TContext\>

> **ContextState**\<`TContext`\> = `object`

Defined in: [packages/core/src/types.ts:1332](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1332)

Current state of a context instance

## Type Parameters

### TContext

`TContext` *extends* [`AnyContext`](./AnyContext.md) = [`AnyContext`](./AnyContext.md)

The context type

## Properties

### args

> **args**: [`InferSchemaArguments`](./InferSchemaArguments.md)\<`TContext`\[`"schema"`\]\>

Defined in: [packages/core/src/types.ts:1340](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1340)

Arguments passed to this context

***

### context

> **context**: `TContext`

Defined in: [packages/core/src/types.ts:1338](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1338)

The context definition

***

### contexts

> **contexts**: `string`[]

Defined in: [packages/core/src/types.ts:1348](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1348)

IDs of related contexts

***

### id

> **id**: `string`

Defined in: [packages/core/src/types.ts:1334](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1334)

Unique identifier for this context instance

***

### key?

> `optional` **key**: `string`

Defined in: [packages/core/src/types.ts:1336](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1336)

Optional key for this context instance

***

### memory

> **memory**: [`InferContextMemory`](./InferContextMemory.md)\<`TContext`\>

Defined in: [packages/core/src/types.ts:1344](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1344)

Memory state for this context

***

### options

> **options**: [`InferContextOptions`](./InferContextOptions.md)\<`TContext`\>

Defined in: [packages/core/src/types.ts:1342](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1342)

Options/configuration for this context

***

### settings

> **settings**: [`ContextSettings`](./ContextSettings.md)

Defined in: [packages/core/src/types.ts:1346](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1346)

Settings for this context
