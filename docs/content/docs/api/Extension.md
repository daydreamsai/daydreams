---
title: "Extension"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / Extension

# Type Alias: Extension\<TContext, Contexts, Inputs\>

> **Extension**\<`TContext`, `Contexts`, `Inputs`\> = `Pick`\<[`Config`](./Config.md)\<`TContext`\>, `"inputs"` \| `"outputs"` \| `"actions"` \| `"services"` \| `"events"`\> & `object`

Defined in: [packages/core/src/types.ts:1351](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1351)

## Type declaration

### contexts?

> `optional` **contexts**: `Contexts`

### inputs

> **inputs**: `Inputs`

### install()?

> `optional` **install**: (`agent`) => `Promise`\<`void`\> \| `void`

#### Parameters

##### agent

[`AnyAgent`](./AnyAgent.md)

#### Returns

`Promise`\<`void`\> \| `void`

### name

> **name**: `string`

## Type Parameters

### TContext

`TContext` *extends* [`AnyContext`](./AnyContext.md) = [`AnyContext`](./AnyContext.md)

### Contexts

`Contexts` *extends* `Record`\<`string`, [`AnyContext`](./AnyContext.md)\> = `Record`\<`string`, [`AnyContext`](./AnyContext.md)\>

### Inputs

`Inputs` *extends* `Record`\<`string`, [`InputConfig`](./InputConfig.md)\<`any`, `any`\>\> = `Record`\<`string`, [`InputConfig`](./InputConfig.md)\<`any`, `any`\>\>
