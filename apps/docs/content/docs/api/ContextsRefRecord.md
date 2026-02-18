---
title: "ContextsRefRecord"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / ContextsRefRecord

# Type Alias: ContextsRefRecord\<T\>

> **ContextsRefRecord**\<`T`\> = `{ [K in keyof T]: ContextRef<T[K]> }`

Defined in: [packages/core/src/types.ts:1249](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L1249)

Record of context references mapped by key

## Type Parameters

### T

`T` *extends* `Record`\<`string`, [`AnyContext`](./AnyContext.md)\>

Record type mapping keys to context types
