---
title: "InferActionState"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / InferActionState

# Type Alias: InferActionState\<TMemory\>

> **InferActionState**\<`TMemory`\> = `TMemory` *extends* [`ActionState`](./ActionState.md)\<infer Data\> ? `Data` : `never`

Defined in: [packages/core/src/memory/types.ts:456](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L456)

Extracts the data type from a Memory type

## Type Parameters

### TMemory

`TMemory` *extends* [`ActionState`](./ActionState.md)\<`any`\>

Memory type to extract data from
