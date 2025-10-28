---
title: "InputConfig"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / InputConfig

# Type Alias: InputConfig\<Schema, TContext, TAgent\>

> **InputConfig**\<`Schema`, `TContext`, `TAgent`\> = `Omit`\<[`Input`](./Input.md)\<`Schema`, `TContext`, `TAgent`\>, `"type"`\>

Defined in: [packages/core/src/types.ts:897](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L897)

Configuration type for inputs without type field

## Type Parameters

### Schema

`Schema` *extends* `z.ZodObject` \| `z.ZodString` \| `z.ZodRawShape` = `z.ZodObject` \| `z.ZodString` \| `z.ZodRawShape`

### TContext

`TContext` *extends* [`AnyContext`](./AnyContext.md) = [`AnyContext`](./AnyContext.md)

### TAgent

`TAgent` *extends* [`AnyAgent`](./AnyAgent.md) = [`AnyAgent`](./AnyAgent.md)
