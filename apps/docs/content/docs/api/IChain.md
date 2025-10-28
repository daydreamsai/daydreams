---
title: "IChain"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / IChain

# Interface: IChain

Defined in: [packages/core/src/types.ts:926](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L926)

## Properties

### chainId

> **chainId**: `string`

Defined in: [packages/core/src/types.ts:930](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L930)

A unique identifier for the chain (e.g., "starknet", "ethereum", "solana", etc.)

## Methods

### read()

> **read**(`call`): `Promise`\<`any`\>

Defined in: [packages/core/src/types.ts:936](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L936)

Read (call) a contract or perform a query on this chain.
The `call` parameter can be chain-specific data.

#### Parameters

##### call

`unknown`

#### Returns

`Promise`\<`any`\>

***

### write()

> **write**(`call`): `Promise`\<`any`\>

Defined in: [packages/core/src/types.ts:941](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L941)

Write (execute a transaction) on this chain, typically requiring signatures, etc.

#### Parameters

##### call

`unknown`

#### Returns

`Promise`\<`any`\>
