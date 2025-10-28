---
title: "InferContextOptions"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / InferContextOptions

# Type Alias: InferContextOptions\<TContext\>

> **InferContextOptions**\<`TContext`\> = `TContext` *extends* [`Context`](./Context.md)\<`any`, `any`, infer Options, `any`, `any`\> ? `Options` : `never`

Defined in: [packages/core/src/types.ts:960](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L960)

Extracts the Context type from a Context type

## Type Parameters

### TContext

`TContext` *extends* [`AnyContext`](./AnyContext.md)

The Context type to extract Ctx from
