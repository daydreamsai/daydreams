---
title: "KeyValueProvider"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / KeyValueProvider

# Interface: KeyValueProvider

Defined in: [packages/core/src/memory/types.ts:94](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L94)

Key-Value storage provider

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

> **count**(`pattern?`): `Promise`\<`number`\>

Defined in: [packages/core/src/memory/types.ts:100](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L100)

#### Parameters

##### pattern?

`string`

#### Returns

`Promise`\<`number`\>

***

### delete()

> **delete**(`key`): `Promise`\<`boolean`\>

Defined in: [packages/core/src/memory/types.ts:97](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L97)

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`boolean`\>

***

### deleteBatch()

> **deleteBatch**(`keys`): `Promise`\<`number`\>

Defined in: [packages/core/src/memory/types.ts:106](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L106)

#### Parameters

##### keys

`string`[]

#### Returns

`Promise`\<`number`\>

***

### exists()

> **exists**(`key`): `Promise`\<`boolean`\>

Defined in: [packages/core/src/memory/types.ts:98](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L98)

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`boolean`\>

***

### get()

> **get**\<`T`\>(`key`): `Promise`\<`null` \| `T`\>

Defined in: [packages/core/src/memory/types.ts:95](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L95)

#### Type Parameters

##### T

`T`

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`null` \| `T`\>

***

### getBatch()

> **getBatch**\<`T`\>(`keys`): `Promise`\<`Map`\<`string`, `T`\>\>

Defined in: [packages/core/src/memory/types.ts:104](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L104)

#### Type Parameters

##### T

`T`

#### Parameters

##### keys

`string`[]

#### Returns

`Promise`\<`Map`\<`string`, `T`\>\>

***

### health()

> **health**(): `Promise`\<[`HealthStatus`](./HealthStatus.md)\>

Defined in: [packages/core/src/memory/types.ts:82](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L82)

#### Returns

`Promise`\<[`HealthStatus`](./HealthStatus.md)\>

#### Inherited from

[`MemoryProvider`](./MemoryProvider.md).[`health`](MemoryProvider.md#health)

***

### initialize()

> **initialize**(): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/types.ts:80](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L80)

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`MemoryProvider`](./MemoryProvider.md).[`initialize`](MemoryProvider.md#initialize)

***

### keys()

> **keys**(`pattern?`): `Promise`\<`string`[]\>

Defined in: [packages/core/src/memory/types.ts:99](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L99)

#### Parameters

##### pattern?

`string`

#### Returns

`Promise`\<`string`[]\>

***

### scan()

> **scan**(`pattern?`): `AsyncIterator`\<\[`string`, `any`\]\>

Defined in: [packages/core/src/memory/types.ts:101](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L101)

#### Parameters

##### pattern?

`string`

#### Returns

`AsyncIterator`\<\[`string`, `any`\]\>

***

### set()

> **set**\<`T`\>(`key`, `value`, `options?`): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/types.ts:96](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L96)

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

***

### setBatch()

> **setBatch**\<`T`\>(`entries`, `options?`): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/types.ts:105](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L105)

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
