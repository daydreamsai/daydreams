---
title: "KeyValueMemoryImpl"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / KeyValueMemoryImpl

# Class: KeyValueMemoryImpl

Defined in: [packages/core/src/memory/kv-memory.ts:3](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/kv-memory.ts#L3)

Key-Value Memory interface

## Implements

- [`KeyValueMemory`](./KeyValueMemory.md)

## Constructors

### Constructor

> **new KeyValueMemoryImpl**(`provider`): `KeyValueMemoryImpl`

Defined in: [packages/core/src/memory/kv-memory.ts:4](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/kv-memory.ts#L4)

#### Parameters

##### provider

[`KeyValueProvider`](./KeyValueProvider.md)

#### Returns

`KeyValueMemoryImpl`

## Methods

### count()

> **count**(`pattern?`): `Promise`\<`number`\>

Defined in: [packages/core/src/memory/kv-memory.ts:26](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/kv-memory.ts#L26)

#### Parameters

##### pattern?

`string`

#### Returns

`Promise`\<`number`\>

#### Implementation of

[`KeyValueMemory`](./KeyValueMemory.md).[`count`](KeyValueMemory.md#count)

***

### delete()

> **delete**(`key`): `Promise`\<`boolean`\>

Defined in: [packages/core/src/memory/kv-memory.ts:14](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/kv-memory.ts#L14)

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`boolean`\>

#### Implementation of

[`KeyValueMemory`](./KeyValueMemory.md).[`delete`](KeyValueMemory.md#delete)

***

### deleteBatch()

> **deleteBatch**(`keys`): `Promise`\<`number`\>

Defined in: [packages/core/src/memory/kv-memory.ts:47](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/kv-memory.ts#L47)

#### Parameters

##### keys

`string`[]

#### Returns

`Promise`\<`number`\>

#### Implementation of

[`KeyValueMemory`](./KeyValueMemory.md).[`deleteBatch`](KeyValueMemory.md#deletebatch)

***

### exists()

> **exists**(`key`): `Promise`\<`boolean`\>

Defined in: [packages/core/src/memory/kv-memory.ts:18](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/kv-memory.ts#L18)

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`boolean`\>

#### Implementation of

[`KeyValueMemory`](./KeyValueMemory.md).[`exists`](KeyValueMemory.md#exists)

***

### get()

> **get**\<`T`\>(`key`): `Promise`\<`null` \| `T`\>

Defined in: [packages/core/src/memory/kv-memory.ts:6](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/kv-memory.ts#L6)

#### Type Parameters

##### T

`T`

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`null` \| `T`\>

#### Implementation of

[`KeyValueMemory`](./KeyValueMemory.md).[`get`](KeyValueMemory.md#get)

***

### getBatch()

> **getBatch**\<`T`\>(`keys`): `Promise`\<`Map`\<`string`, `T`\>\>

Defined in: [packages/core/src/memory/kv-memory.ts:39](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/kv-memory.ts#L39)

#### Type Parameters

##### T

`T`

#### Parameters

##### keys

`string`[]

#### Returns

`Promise`\<`Map`\<`string`, `T`\>\>

#### Implementation of

[`KeyValueMemory`](./KeyValueMemory.md).[`getBatch`](KeyValueMemory.md#getbatch)

***

### keys()

> **keys**(`pattern?`): `Promise`\<`string`[]\>

Defined in: [packages/core/src/memory/kv-memory.ts:22](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/kv-memory.ts#L22)

#### Parameters

##### pattern?

`string`

#### Returns

`Promise`\<`string`[]\>

#### Implementation of

[`KeyValueMemory`](./KeyValueMemory.md).[`keys`](KeyValueMemory.md#keys)

***

### scan()

> **scan**(`pattern?`): `AsyncIterator`\<\[`string`, `unknown`\]\>

Defined in: [packages/core/src/memory/kv-memory.ts:30](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/kv-memory.ts#L30)

#### Parameters

##### pattern?

`string`

#### Returns

`AsyncIterator`\<\[`string`, `unknown`\]\>

#### Implementation of

[`KeyValueMemory`](./KeyValueMemory.md).[`scan`](KeyValueMemory.md#scan)

***

### set()

> **set**\<`T`\>(`key`, `value`, `options?`): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/kv-memory.ts:10](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/kv-memory.ts#L10)

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

[`KeyValueMemory`](./KeyValueMemory.md).[`set`](KeyValueMemory.md#set)

***

### setBatch()

> **setBatch**\<`T`\>(`entries`, `options?`): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/kv-memory.ts:43](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/kv-memory.ts#L43)

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

[`KeyValueMemory`](./KeyValueMemory.md).[`setBatch`](KeyValueMemory.md#setbatch)
