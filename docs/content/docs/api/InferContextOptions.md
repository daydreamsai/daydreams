---
title: "InferContextOptions"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / InferContextOptions

# Type Alias: InferContextOptions\<TContext\>

> **InferContextOptions**\<`TContext`\> = `TContext` *extends* [`Context`](./Context.md)\<`any`, `any`, infer Options, `any`, `any`\> ? `Options` : `never`

Defined in: [packages/core/src/types.ts:995](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L995)

Extracts the Context type from a Context type

## Type Parameters

### TContext

`TContext` *extends* [`AnyContext`](./AnyContext.md)

The Context type to extract Ctx from
