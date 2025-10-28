---
title: "MemorySystem"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / MemorySystem

# Class: MemorySystem

Defined in: [packages/core/src/memory/memory-system.ts:23](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/memory-system.ts#L23)

Simplified Memory System - basic storage only

## Implements

- [`Memory`](./Memory.md)

## Constructors

### Constructor

> **new MemorySystem**(`config`): `MemorySystem`

Defined in: [packages/core/src/memory/memory-system.ts:34](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/memory-system.ts#L34)

#### Parameters

##### config

[`MemoryConfig`](./MemoryConfig.md)

#### Returns

`MemorySystem`

## Properties

### episodes

> **episodes**: [`EpisodicMemory`](./EpisodicMemory.md)

Defined in: [packages/core/src/memory/memory-system.ts:28](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/memory-system.ts#L28)

#### Implementation of

[`Memory`](./Memory.md).[`episodes`](Memory.md#episodes)

***

### graph

> **graph**: [`GraphMemory`](./GraphMemory.md)

Defined in: [packages/core/src/memory/memory-system.ts:27](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/memory-system.ts#L27)

#### Implementation of

[`Memory`](./Memory.md).[`graph`](Memory.md#graph)

***

### kv

> **kv**: [`KeyValueMemory`](./KeyValueMemory.md)

Defined in: [packages/core/src/memory/memory-system.ts:25](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/memory-system.ts#L25)

#### Implementation of

[`Memory`](./Memory.md).[`kv`](Memory.md#kv)

***

### vector

> **vector**: [`VectorMemory`](./VectorMemory.md)

Defined in: [packages/core/src/memory/memory-system.ts:26](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/memory-system.ts#L26)

#### Implementation of

[`Memory`](./Memory.md).[`vector`](Memory.md#vector)

***

### working

> **working**: [`IWorkingMemory`](./IWorkingMemory.md)

Defined in: [packages/core/src/memory/memory-system.ts:24](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/memory-system.ts#L24)

#### Implementation of

[`Memory`](./Memory.md).[`working`](Memory.md#working)

## Methods

### close()

> **close**(): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/memory-system.ts:75](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/memory-system.ts#L75)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`Memory`](./Memory.md).[`close`](Memory.md#close)

***

### forget()

> **forget**(`criteria`): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/memory-system.ts:200](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/memory-system.ts#L200)

#### Parameters

##### criteria

[`ForgetCriteria`](./ForgetCriteria.md)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`Memory`](./Memory.md).[`forget`](Memory.md#forget)

***

### initialize()

> **initialize**(): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/memory-system.ts:48](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/memory-system.ts#L48)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`Memory`](./Memory.md).[`initialize`](Memory.md#initialize)

***

### recall()

> **recall**(`query`, `options?`): `Promise`\<[`MemoryResult`](./MemoryResult.md)[]\>

Defined in: [packages/core/src/memory/memory-system.ts:127](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/memory-system.ts#L127)

Vector/hybrid recall. Accepts string or structured query.

#### Parameters

##### query

`any`

##### options?

[`RecallOptions`](./RecallOptions.md)

#### Returns

`Promise`\<[`MemoryResult`](./MemoryResult.md)[]\>

#### Implementation of

[`Memory`](./Memory.md).[`recall`](Memory.md#recall)

***

### recallOne()

> **recallOne**(`query`, `options?`): `Promise`\<`null` \| [`MemoryResult`](./MemoryResult.md)\>

Defined in: [packages/core/src/memory/memory-system.ts:195](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/memory-system.ts#L195)

Return only the best match or null

#### Parameters

##### query

`any`

##### options?

[`RecallOptions`](./RecallOptions.md)

#### Returns

`Promise`\<`null` \| [`MemoryResult`](./MemoryResult.md)\>

#### Implementation of

[`Memory`](./Memory.md).[`recallOne`](Memory.md#recallone)

***

### remember()

> **remember**(`content`, `options?`): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/memory-system.ts:88](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/memory-system.ts#L88)

#### Parameters

##### content

`unknown`

##### options?

[`RememberOptions`](./RememberOptions.md)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`Memory`](./Memory.md).[`remember`](Memory.md#remember)

***

### rememberBatch()

> **rememberBatch**(`records`, `options?`): `Promise`\<\{ `ids`: `string`[]; `warnings?`: `string`[]; \}\>

Defined in: [packages/core/src/memory/memory-system.ts:395](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/memory-system.ts#L395)

Batch ingestion with optional naive chunking

#### Parameters

##### records

`any`[]

##### options?

###### chunk?

\{ `overlap?`: `number`; `size?`: `number`; \}

###### chunk.overlap?

`number`

###### chunk.size?

`number`

###### upsert?

`boolean`

#### Returns

`Promise`\<\{ `ids`: `string`[]; `warnings?`: `string`[]; \}\>

#### Implementation of

[`Memory`](./Memory.md).[`rememberBatch`](Memory.md#rememberbatch)

***

### rememberRecord()

> **rememberRecord**(`record`, `options?`): `Promise`\<\{ `id`: `string`; \}\>

Defined in: [packages/core/src/memory/memory-system.ts:345](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/memory-system.ts#L345)

Store a structured record into vector memory

#### Parameters

##### record

`any`

##### options?

###### upsert?

`boolean`

#### Returns

`Promise`\<\{ `id`: `string`; \}\>

#### Implementation of

[`Memory`](./Memory.md).[`rememberRecord`](Memory.md#rememberrecord)
