---
title: "OutputConfig"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / OutputConfig

# Type Alias: OutputConfig\<Schema, Response, TContext, TAgent\>

> **OutputConfig**\<`Schema`, `Response`, `TContext`, `TAgent`\> = `Omit`\<[`Output`](./Output.md)\<`Schema`, `Response`, `TContext`, `TAgent`\>, `"type"`\>

Defined in: [packages/core/src/types.ts:939](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L939)

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
