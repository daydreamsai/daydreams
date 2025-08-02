---
title: "InferActionState"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / InferActionState

# Type Alias: InferActionState\<TMemory\>

> **InferActionState**\<`TMemory`\> = `TMemory` *extends* [`ActionState`](./ActionState.md)\<infer Data\> ? `Data` : `never`

Defined in: [packages/core/src/memory/types.ts:577](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L577)

Extracts the data type from a Memory type

## Type Parameters

### TMemory

`TMemory` *extends* [`ActionState`](./ActionState.md)\<`any`\>

Memory type to extract data from
