---
title: "LogChunk"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / LogChunk

# Type Alias: LogChunk

> **LogChunk** = \{ `done`: `boolean`; `log`: [`AnyRef`](./AnyRef.md); `type`: `"log"`; \} \| \{ `content`: `string`; `id`: `string`; `type`: `"content"`; \} \| \{ `data`: `any`; `id`: `string`; `type`: `"data"`; \} \| \{ `id`: `string`; `type`: `"done"`; \}

Defined in: [packages/core/src/types.ts:730](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L730)

Represents a chunk of streaming log data
