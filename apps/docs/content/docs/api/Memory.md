---
title: "Memory"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / Memory

# Interface: Memory

Defined in: [packages/core/src/memory/types.ts:23](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L23)

Core Memory interface - simplified for basic storage

## Properties

### episodes?

> `optional` **episodes**: [`EpisodicMemory`](./EpisodicMemory.md)

Defined in: [packages/core/src/memory/types.ts:29](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L29)

***

### graph

> **graph**: [`GraphMemory`](./GraphMemory.md)

Defined in: [packages/core/src/memory/types.ts:28](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L28)

***

### kv

> **kv**: [`KeyValueMemory`](./KeyValueMemory.md)

Defined in: [packages/core/src/memory/types.ts:26](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L26)

***

### vector

> **vector**: [`VectorMemory`](./VectorMemory.md)

Defined in: [packages/core/src/memory/types.ts:27](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L27)

***

### working

> **working**: [`IWorkingMemory`](./IWorkingMemory.md)

Defined in: [packages/core/src/memory/types.ts:25](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L25)

## Methods

### close()

> **close**(): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/types.ts:47](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L47)

#### Returns

`Promise`\<`void`\>

***

### forget()

> **forget**(`criteria`): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/types.ts:43](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L43)

#### Parameters

##### criteria

[`ForgetCriteria`](./ForgetCriteria.md)

#### Returns

`Promise`\<`void`\>

***

### initialize()

> **initialize**(): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/types.ts:46](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L46)

#### Returns

`Promise`\<`void`\>

***

### recall()

> **recall**(`query`, `options?`): `Promise`\<[`MemoryResult`](./MemoryResult.md)[]\>

Defined in: [packages/core/src/memory/types.ts:34](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L34)

Vector/hybrid recall. Accepts string or structured query.

#### Parameters

##### query

`string` | [`RecallQuery`](./RecallQuery.md)

##### options?

[`RecallOptions`](./RecallOptions.md)

#### Returns

`Promise`\<[`MemoryResult`](./MemoryResult.md)[]\>

***

### recallOne()

> **recallOne**(`query`, `options?`): `Promise`\<`null` \| [`MemoryResult`](./MemoryResult.md)\>

Defined in: [packages/core/src/memory/types.ts:39](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L39)

Convenience helper returning the top match or null

#### Parameters

##### query

`string` | [`RecallQuery`](./RecallQuery.md)

##### options?

[`RecallOptions`](./RecallOptions.md)

#### Returns

`Promise`\<`null` \| [`MemoryResult`](./MemoryResult.md)\>

***

### remember()

> **remember**(`content`, `options?`): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/types.ts:32](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L32)

#### Parameters

##### content

`unknown`

##### options?

[`RememberOptions`](./RememberOptions.md)

#### Returns

`Promise`\<`void`\>

***

### rememberBatch()

> **rememberBatch**(`records`, `options?`): `Promise`\<\{ `ids`: `string`[]; `warnings?`: `string`[]; \}\>

Defined in: [packages/core/src/memory/types.ts:55](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L55)

Store multiple records efficiently, with optional chunking

#### Parameters

##### records

[`MemoryRecord`](./MemoryRecord.md)[]

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

***

### rememberRecord()

> **rememberRecord**(`record`, `options?`): `Promise`\<\{ `id`: `string`; \}\>

Defined in: [packages/core/src/memory/types.ts:50](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L50)

Store a structured record into memory

#### Parameters

##### record

[`MemoryRecord`](./MemoryRecord.md)

##### options?

###### upsert?

`boolean`

#### Returns

`Promise`\<\{ `id`: `string`; \}\>
