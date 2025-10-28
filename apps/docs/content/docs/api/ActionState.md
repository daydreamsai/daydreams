---
title: "ActionState"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / ActionState

# Type Alias: ActionState\<Data\>

> **ActionState**\<`Data`\> = `object`

Defined in: [packages/core/src/memory/types.ts:445](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L445)

Represents a memory configuration for storing data

## Type Parameters

### Data

`Data` = `any`

Type of data stored in memory

## Properties

### create()

> **create**: () => `Promise`\<`Data`\> \| `Data`

Defined in: [packages/core/src/memory/types.ts:449](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L449)

Function to initialize memory data

#### Returns

`Promise`\<`Data`\> \| `Data`

***

### key

> **key**: `string`

Defined in: [packages/core/src/memory/types.ts:447](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L447)

Unique identifier for this memory
