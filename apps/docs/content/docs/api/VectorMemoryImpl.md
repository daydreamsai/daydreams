---
title: "VectorMemoryImpl"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / VectorMemoryImpl

# Class: VectorMemoryImpl

Defined in: [packages/core/src/memory/vector-memory.ts:3](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/vector-memory.ts#L3)

Vector Memory interface

## Implements

- [`VectorMemory`](./VectorMemory.md)

## Constructors

### Constructor

> **new VectorMemoryImpl**(`provider`): `VectorMemoryImpl`

Defined in: [packages/core/src/memory/vector-memory.ts:4](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/vector-memory.ts#L4)

#### Parameters

##### provider

[`VectorProvider`](./VectorProvider.md)

#### Returns

`VectorMemoryImpl`

## Methods

### delete()

> **delete**(`ids`): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/vector-memory.ts:14](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/vector-memory.ts#L14)

#### Parameters

##### ids

`string`[]

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`VectorMemory`](./VectorMemory.md).[`delete`](VectorMemory.md#delete)

***

### index()

> **index**(`documents`): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/vector-memory.ts:6](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/vector-memory.ts#L6)

#### Parameters

##### documents

[`VectorDocument`](./VectorDocument.md)[]

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`VectorMemory`](./VectorMemory.md).[`index`](VectorMemory.md#index)

***

### search()

> **search**(`query`): `Promise`\<[`VectorResult`](./VectorResult.md)[]\>

Defined in: [packages/core/src/memory/vector-memory.ts:10](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/vector-memory.ts#L10)

#### Parameters

##### query

[`VectorQuery`](./VectorQuery.md)

#### Returns

`Promise`\<[`VectorResult`](./VectorResult.md)[]\>

#### Implementation of

[`VectorMemory`](./VectorMemory.md).[`search`](VectorMemory.md#search)
