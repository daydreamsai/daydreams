---
title: "OutputConfig"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / OutputConfig

# Type Alias: OutputConfig\<Schema, Response, TContext, TAgent\>

> **OutputConfig**\<`Schema`, `Response`, `TContext`, `TAgent`\> = `Omit`\<[`Output`](./Output.md)\<`Schema`, `Response`, `TContext`, `TAgent`\>, `"name"`\>

Defined in: [packages/core/src/types.ts:907](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L907)

Configuration type for outputs without type field

## Type Parameters

### Schema

`Schema` *extends* [`OutputSchema`](./OutputSchema.md) = [`OutputSchema`](./OutputSchema.md)

### Response

`Response` *extends* [`OutputRefResponse`](./OutputRefResponse.md) = [`OutputRefResponse`](./OutputRefResponse.md)

### TContext

`TContext` *extends* [`AnyContext`](./AnyContext.md) = [`AnyContext`](./AnyContext.md)

### TAgent

`TAgent` *extends* [`AnyAgent`](./AnyAgent.md) = [`AnyAgent`](./AnyAgent.md)
