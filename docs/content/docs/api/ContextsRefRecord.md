---
title: "ContextsRefRecord"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / ContextsRefRecord

# Type Alias: ContextsRefRecord\<T\>

> **ContextsRefRecord**\<`T`\> = `{ [K in keyof T]: ContextRef<T[K]> }`

Defined in: [packages/core/src/types.ts:1263](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1263)

Record of context references mapped by key

## Type Parameters

### T

`T` *extends* `Record`\<`string`, [`AnyContext`](./AnyContext.md)\>

Record type mapping keys to context types
