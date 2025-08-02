---
title: "InMemoryKeyValueProvider"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / InMemoryKeyValueProvider

# Class: InMemoryKeyValueProvider

Defined in: [packages/core/src/memory/providers/in-memory.ts:20](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/providers/in-memory.ts#L20)

In-memory Key-Value Provider for testing

## Implements

- [`KeyValueProvider`](./KeyValueProvider.md)

## Constructors

### Constructor

> **new InMemoryKeyValueProvider**(): `InMemoryKeyValueProvider`

#### Returns

`InMemoryKeyValueProvider`

## Methods

### close()

> **close**(): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/providers/in-memory.ts:28](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/providers/in-memory.ts#L28)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`KeyValueProvider`](./KeyValueProvider.md).[`close`](KeyValueProvider.md#close)

***

### count()

> **count**(`pattern?`): `Promise`\<`number`\>

Defined in: [packages/core/src/memory/providers/in-memory.ts:87](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/providers/in-memory.ts#L87)

#### Parameters

##### pattern?

`string`

#### Returns

`Promise`\<`number`\>

#### Implementation of

[`KeyValueProvider`](./KeyValueProvider.md).[`count`](KeyValueProvider.md#count)

***

### delete()

> **delete**(`key`): `Promise`\<`boolean`\>

Defined in: [packages/core/src/memory/providers/in-memory.ts:66](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/providers/in-memory.ts#L66)

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`boolean`\>

#### Implementation of

[`KeyValueProvider`](./KeyValueProvider.md).[`delete`](KeyValueProvider.md#delete)

***

### deleteBatch()

> **deleteBatch**(`keys`): `Promise`\<`number`\>

Defined in: [packages/core/src/memory/providers/in-memory.ts:124](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/providers/in-memory.ts#L124)

#### Parameters

##### keys

`string`[]

#### Returns

`Promise`\<`number`\>

#### Implementation of

[`KeyValueProvider`](./KeyValueProvider.md).[`deleteBatch`](KeyValueProvider.md#deletebatch)

***

### exists()

> **exists**(`key`): `Promise`\<`boolean`\>

Defined in: [packages/core/src/memory/providers/in-memory.ts:71](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/providers/in-memory.ts#L71)

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`boolean`\>

#### Implementation of

[`KeyValueProvider`](./KeyValueProvider.md).[`exists`](KeyValueProvider.md#exists)

***

### get()

> **get**\<`T`\>(`key`): `Promise`\<`null` \| `T`\>

Defined in: [packages/core/src/memory/providers/in-memory.ts:44](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/providers/in-memory.ts#L44)

#### Type Parameters

##### T

`T`

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`null` \| `T`\>

#### Implementation of

[`KeyValueProvider`](./KeyValueProvider.md).[`get`](KeyValueProvider.md#get)

***

### getBatch()

> **getBatch**\<`T`\>(`keys`): `Promise`\<`Map`\<`string`, `T`\>\>

Defined in: [packages/core/src/memory/providers/in-memory.ts:102](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/providers/in-memory.ts#L102)

#### Type Parameters

##### T

`T`

#### Parameters

##### keys

`string`[]

#### Returns

`Promise`\<`Map`\<`string`, `T`\>\>

#### Implementation of

[`KeyValueProvider`](./KeyValueProvider.md).[`getBatch`](KeyValueProvider.md#getbatch)

***

### health()

> **health**(): `Promise`\<[`HealthStatus`](./HealthStatus.md)\>

Defined in: [packages/core/src/memory/providers/in-memory.ts:33](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/providers/in-memory.ts#L33)

#### Returns

`Promise`\<[`HealthStatus`](./HealthStatus.md)\>

#### Implementation of

[`KeyValueProvider`](./KeyValueProvider.md).[`health`](KeyValueProvider.md#health)

***

### initialize()

> **initialize**(): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/providers/in-memory.ts:24](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/providers/in-memory.ts#L24)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`KeyValueProvider`](./KeyValueProvider.md).[`initialize`](KeyValueProvider.md#initialize)

***

### keys()

> **keys**(`pattern?`): `Promise`\<`string`[]\>

Defined in: [packages/core/src/memory/providers/in-memory.ts:76](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/providers/in-memory.ts#L76)

#### Parameters

##### pattern?

`string`

#### Returns

`Promise`\<`string`[]\>

#### Implementation of

[`KeyValueProvider`](./KeyValueProvider.md).[`keys`](KeyValueProvider.md#keys)

***

### scan()

> **scan**(`pattern?`): `AsyncIterator`\<\[`string`, `any`\]\>

Defined in: [packages/core/src/memory/providers/in-memory.ts:92](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/providers/in-memory.ts#L92)

#### Parameters

##### pattern?

`string`

#### Returns

`AsyncIterator`\<\[`string`, `any`\]\>

#### Implementation of

[`KeyValueProvider`](./KeyValueProvider.md).[`scan`](KeyValueProvider.md#scan)

***

### set()

> **set**\<`T`\>(`key`, `value`, `options?`): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/providers/in-memory.ts:49](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/providers/in-memory.ts#L49)

#### Type Parameters

##### T

`T`

#### Parameters

##### key

`string`

##### value

`T`

##### options?

[`SetOptions`](./SetOptions.md)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`KeyValueProvider`](./KeyValueProvider.md).[`set`](KeyValueProvider.md#set)

***

### setBatch()

> **setBatch**\<`T`\>(`entries`, `options?`): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/providers/in-memory.ts:116](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/providers/in-memory.ts#L116)

#### Type Parameters

##### T

`T`

#### Parameters

##### entries

`Map`\<`string`, `T`\>

##### options?

[`SetOptions`](./SetOptions.md)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`KeyValueProvider`](./KeyValueProvider.md).[`setBatch`](KeyValueProvider.md#setbatch)
