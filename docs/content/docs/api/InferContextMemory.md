---
title: "InferContextMemory"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / InferContextMemory

# Type Alias: InferContextMemory\<TContext\>

> **InferContextMemory**\<`TContext`\> = `TContext` *extends* [`Context`](./Context.md)\<infer TMemory, `any`, `any`, `any`, `any`\> ? `TMemory` : `never`

Defined in: [packages/core/src/types.ts:988](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L988)

Extracts the Memory type from a Context type

## Type Parameters

### TContext

`TContext` *extends* [`AnyContext`](./AnyContext.md)

The Context type to extract Memory from
