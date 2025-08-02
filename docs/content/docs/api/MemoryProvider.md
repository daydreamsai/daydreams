---
title: "MemoryProvider"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / MemoryProvider

# Interface: MemoryProvider

Defined in: [packages/core/src/memory/types.ts:79](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L79)

Base provider interface

## Extended by

- [`KeyValueProvider`](./KeyValueProvider.md)
- [`VectorProvider`](./VectorProvider.md)
- [`GraphProvider`](./GraphProvider.md)

## Methods

### close()

> **close**(): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/types.ts:81](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L81)

#### Returns

`Promise`\<`void`\>

***

### health()

> **health**(): `Promise`\<[`HealthStatus`](./HealthStatus.md)\>

Defined in: [packages/core/src/memory/types.ts:82](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L82)

#### Returns

`Promise`\<[`HealthStatus`](./HealthStatus.md)\>

***

### initialize()

> **initialize**(): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/types.ts:80](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L80)

#### Returns

`Promise`\<`void`\>
