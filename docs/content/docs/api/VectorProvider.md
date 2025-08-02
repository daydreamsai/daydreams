---
title: "VectorProvider"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / VectorProvider

# Interface: VectorProvider

Defined in: [packages/core/src/memory/types.ts:118](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L118)

Vector storage provider

## Extends

- [`MemoryProvider`](./MemoryProvider.md)

## Methods

### close()

> **close**(): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/types.ts:81](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L81)

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`MemoryProvider`](./MemoryProvider.md).[`close`](MemoryProvider.md#close)

***

### count()

> **count**(`namespace?`): `Promise`\<`number`\>

Defined in: [packages/core/src/memory/types.ts:123](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L123)

#### Parameters

##### namespace?

`string`

#### Returns

`Promise`\<`number`\>

***

### delete()

> **delete**(`ids`): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/types.ts:121](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L121)

#### Parameters

##### ids

`string`[]

#### Returns

`Promise`\<`void`\>

***

### health()

> **health**(): `Promise`\<[`HealthStatus`](./HealthStatus.md)\>

Defined in: [packages/core/src/memory/types.ts:82](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L82)

#### Returns

`Promise`\<[`HealthStatus`](./HealthStatus.md)\>

#### Inherited from

[`MemoryProvider`](./MemoryProvider.md).[`health`](MemoryProvider.md#health)

***

### index()

> **index**(`documents`): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/types.ts:119](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L119)

#### Parameters

##### documents

[`VectorDocument`](./VectorDocument.md)[]

#### Returns

`Promise`\<`void`\>

***

### initialize()

> **initialize**(): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/types.ts:80](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L80)

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`MemoryProvider`](./MemoryProvider.md).[`initialize`](MemoryProvider.md#initialize)

***

### search()

> **search**(`query`): `Promise`\<[`VectorResult`](./VectorResult.md)[]\>

Defined in: [packages/core/src/memory/types.ts:120](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L120)

#### Parameters

##### query

[`VectorQuery`](./VectorQuery.md)

#### Returns

`Promise`\<[`VectorResult`](./VectorResult.md)[]\>

***

### update()

> **update**(`id`, `updates`): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/types.ts:122](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L122)

#### Parameters

##### id

`string`

##### updates

`Partial`\<[`VectorDocument`](./VectorDocument.md)\>

#### Returns

`Promise`\<`void`\>
