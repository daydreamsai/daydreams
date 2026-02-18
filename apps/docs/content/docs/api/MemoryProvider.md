---
title: "MemoryProvider"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / MemoryProvider

# Interface: MemoryProvider

Defined in: [packages/core/src/memory/types.ts:76](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L76)

Base provider interface

## Extended by

- [`KeyValueProvider`](./KeyValueProvider.md)
- [`VectorProvider`](./VectorProvider.md)
- [`GraphProvider`](./GraphProvider.md)

## Methods

### close()

> **close**(): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/types.ts:78](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L78)

#### Returns

`Promise`\<`void`\>

***

### health()

> **health**(): `Promise`\<[`HealthStatus`](./HealthStatus.md)\>

Defined in: [packages/core/src/memory/types.ts:79](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L79)

#### Returns

`Promise`\<[`HealthStatus`](./HealthStatus.md)\>

***

### initialize()

> **initialize**(): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/types.ts:77](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L77)

#### Returns

`Promise`\<`void`\>
