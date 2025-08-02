---
title: "MemoryMiddleware"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / MemoryMiddleware

# Interface: MemoryMiddleware

Defined in: [packages/core/src/memory/types.ts:465](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L465)

Memory middleware for cross-cutting concerns

## Properties

### name

> **name**: `string`

Defined in: [packages/core/src/memory/types.ts:466](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L466)

## Methods

### afterForget()?

> `optional` **afterForget**(`context`): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/types.ts:475](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L475)

#### Parameters

##### context

[`MemoryContext`](./MemoryContext.md)

#### Returns

`Promise`\<`void`\>

***

### afterRecall()?

> `optional` **afterRecall**(`context`): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/types.ts:473](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L473)

#### Parameters

##### context

[`MemoryContext`](./MemoryContext.md)

#### Returns

`Promise`\<`void`\>

***

### afterRemember()?

> `optional` **afterRemember**(`context`): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/types.ts:471](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L471)

#### Parameters

##### context

[`MemoryContext`](./MemoryContext.md)

#### Returns

`Promise`\<`void`\>

***

### beforeForget()?

> `optional` **beforeForget**(`context`): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/types.ts:474](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L474)

#### Parameters

##### context

[`MemoryContext`](./MemoryContext.md)

#### Returns

`Promise`\<`void`\>

***

### beforeRecall()?

> `optional` **beforeRecall**(`context`): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/types.ts:472](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L472)

#### Parameters

##### context

[`MemoryContext`](./MemoryContext.md)

#### Returns

`Promise`\<`void`\>

***

### beforeRemember()?

> `optional` **beforeRemember**(`context`): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/types.ts:470](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L470)

#### Parameters

##### context

[`MemoryContext`](./MemoryContext.md)

#### Returns

`Promise`\<`void`\>

***

### initialize()?

> `optional` **initialize**(`memory`): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/types.ts:467](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L467)

#### Parameters

##### memory

[`Memory`](./Memory.md)

#### Returns

`Promise`\<`void`\>

***

### transformRetrieve()?

> `optional` **transformRetrieve**(`data`): `Promise`\<`any`\>

Defined in: [packages/core/src/memory/types.ts:479](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L479)

#### Parameters

##### data

`any`

#### Returns

`Promise`\<`any`\>

***

### transformStore()?

> `optional` **transformStore**(`data`): `Promise`\<`any`\>

Defined in: [packages/core/src/memory/types.ts:478](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L478)

#### Parameters

##### data

`any`

#### Returns

`Promise`\<`any`\>
