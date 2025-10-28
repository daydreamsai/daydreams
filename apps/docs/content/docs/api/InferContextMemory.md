---
title: "InferContextMemory"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / InferContextMemory

# Type Alias: InferContextMemory\<TContext\>

> **InferContextMemory**\<`TContext`\> = `TContext` *extends* [`Context`](./Context.md)\<infer TMemory, `any`, `any`, `any`, `any`\> ? `TMemory` : `never`

Defined in: [packages/core/src/types.ts:953](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L953)

Extracts the Memory type from a Context type

## Type Parameters

### TContext

`TContext` *extends* [`AnyContext`](./AnyContext.md)

The Context type to extract Memory from
