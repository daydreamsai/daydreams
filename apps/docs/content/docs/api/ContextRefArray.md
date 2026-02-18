---
title: "ContextRefArray"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / ContextRefArray

# Type Alias: ContextRefArray\<T\>

> **ContextRefArray**\<`T`\> = `{ [K in keyof T]: ContextRef<T[K]> }`

Defined in: [packages/core/src/types.ts:1257](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L1257)

Array of context references

## Type Parameters

### T

`T` *extends* [`AnyContext`](./AnyContext.md)[] = [`AnyContext`](./AnyContext.md)[]

Array of context types
