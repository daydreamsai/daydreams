---
title: "InMemoryVectorProvider"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / InMemoryVectorProvider

# Class: InMemoryVectorProvider

Defined in: [packages/core/src/memory/providers/in-memory.ts:147](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/providers/in-memory.ts#L147)

In-memory Vector Provider for testing

## Implements

- [`VectorProvider`](./VectorProvider.md)

## Constructors

### Constructor

> **new InMemoryVectorProvider**(): `InMemoryVectorProvider`

#### Returns

`InMemoryVectorProvider`

## Methods

### close()

> **close**(): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/providers/in-memory.ts:155](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/providers/in-memory.ts#L155)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`VectorProvider`](./VectorProvider.md).[`close`](VectorProvider.md#close)

***

### count()

> **count**(`namespace?`): `Promise`\<`number`\>

Defined in: [packages/core/src/memory/providers/in-memory.ts:267](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/providers/in-memory.ts#L267)

#### Parameters

##### namespace?

`string`

#### Returns

`Promise`\<`number`\>

#### Implementation of

[`VectorProvider`](./VectorProvider.md).[`count`](VectorProvider.md#count)

***

### delete()

> **delete**(`ids`): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/providers/in-memory.ts:250](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/providers/in-memory.ts#L250)

#### Parameters

##### ids

`string`[]

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`VectorProvider`](./VectorProvider.md).[`delete`](VectorProvider.md#delete)

***

### health()

> **health**(): `Promise`\<[`HealthStatus`](./HealthStatus.md)\>

Defined in: [packages/core/src/memory/providers/in-memory.ts:160](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/providers/in-memory.ts#L160)

#### Returns

`Promise`\<[`HealthStatus`](./HealthStatus.md)\>

#### Implementation of

[`VectorProvider`](./VectorProvider.md).[`health`](VectorProvider.md#health)

***

### index()

> **index**(`documents`): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/providers/in-memory.ts:171](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/providers/in-memory.ts#L171)

#### Parameters

##### documents

[`VectorDocument`](./VectorDocument.md)[]

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`VectorProvider`](./VectorProvider.md).[`index`](VectorProvider.md#index)

***

### initialize()

> **initialize**(): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/providers/in-memory.ts:151](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/providers/in-memory.ts#L151)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`VectorProvider`](./VectorProvider.md).[`initialize`](VectorProvider.md#initialize)

***

### search()

> **search**(`query`): `Promise`\<[`VectorResult`](./VectorResult.md)[]\>

Defined in: [packages/core/src/memory/providers/in-memory.ts:179](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/providers/in-memory.ts#L179)

#### Parameters

##### query

[`VectorQuery`](./VectorQuery.md)

#### Returns

`Promise`\<[`VectorResult`](./VectorResult.md)[]\>

#### Implementation of

[`VectorProvider`](./VectorProvider.md).[`search`](VectorProvider.md#search)

***

### update()

> **update**(`id`, `updates`): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/providers/in-memory.ts:258](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/providers/in-memory.ts#L258)

#### Parameters

##### id

`string`

##### updates

`Partial`\<[`VectorDocument`](./VectorDocument.md)\>

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`VectorProvider`](./VectorProvider.md).[`update`](VectorProvider.md#update)
