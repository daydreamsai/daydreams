---
title: "IChain"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / IChain

# Interface: IChain

Defined in: [packages/core/src/types.ts:961](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L961)

## Properties

### chainId

> **chainId**: `string`

Defined in: [packages/core/src/types.ts:965](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L965)

A unique identifier for the chain (e.g., "starknet", "ethereum", "solana", etc.)

## Methods

### read()

> **read**(`call`): `Promise`\<`any`\>

Defined in: [packages/core/src/types.ts:971](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L971)

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

Defined in: [packages/core/src/types.ts:976](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L976)

Write (execute a transaction) on this chain, typically requiring signatures, etc.

#### Parameters

##### call

`unknown`

#### Returns

`Promise`\<`any`\>
