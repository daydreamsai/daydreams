---
title: "LogChunk"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / LogChunk

# Type Alias: LogChunk

> **LogChunk** = \{ `done`: `boolean`; `log`: [`AnyRef`](./AnyRef.md); `type`: `"log"`; \} \| \{ `content`: `string`; `id`: `string`; `type`: `"content"`; \} \| \{ `data`: `any`; `id`: `string`; `type`: `"data"`; \} \| \{ `id`: `string`; `type`: `"done"`; \}

Defined in: [packages/core/src/types.ts:661](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L661)

Represents a chunk of streaming log data
