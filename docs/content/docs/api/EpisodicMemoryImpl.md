---
title: "EpisodicMemoryImpl"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / EpisodicMemoryImpl

# Class: EpisodicMemoryImpl

Defined in: [packages/core/src/memory/episodic-memory.ts:8](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/episodic-memory.ts#L8)

Episodic Memory - stores past experiences

## Implements

- [`EpisodicMemory`](./EpisodicMemory.md)

## Constructors

### Constructor

> **new EpisodicMemoryImpl**(`memory`): `EpisodicMemoryImpl`

Defined in: [packages/core/src/memory/episodic-memory.ts:9](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/episodic-memory.ts#L9)

#### Parameters

##### memory

[`Memory`](./Memory.md)

#### Returns

`EpisodicMemoryImpl`

## Methods

### compress()

> **compress**(`episodes`): `Promise`\<[`CompressedEpisode`](./CompressedEpisode.md)\>

Defined in: [packages/core/src/memory/episodic-memory.ts:113](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/episodic-memory.ts#L113)

#### Parameters

##### episodes

[`Episode`](./Episode.md)[]

#### Returns

`Promise`\<[`CompressedEpisode`](./CompressedEpisode.md)\>

#### Implementation of

[`EpisodicMemory`](./EpisodicMemory.md).[`compress`](EpisodicMemory.md#compress)

***

### findSimilar()

> **findSimilar**(`contextId`, `content`, `limit`): `Promise`\<[`Episode`](./Episode.md)[]\>

Defined in: [packages/core/src/memory/episodic-memory.ts:53](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/episodic-memory.ts#L53)

#### Parameters

##### contextId

`string`

##### content

`string`

##### limit

`number` = `5`

#### Returns

`Promise`\<[`Episode`](./Episode.md)[]\>

#### Implementation of

[`EpisodicMemory`](./EpisodicMemory.md).[`findSimilar`](EpisodicMemory.md#findsimilar)

***

### get()

> **get**(`id`): `Promise`\<`null` \| [`Episode`](./Episode.md)\>

Defined in: [packages/core/src/memory/episodic-memory.ts:49](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/episodic-memory.ts#L49)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<`null` \| [`Episode`](./Episode.md)\>

#### Implementation of

[`EpisodicMemory`](./EpisodicMemory.md).[`get`](EpisodicMemory.md#get)

***

### getByContext()

> **getByContext**(`contextId`): `Promise`\<[`Episode`](./Episode.md)[]\>

Defined in: [packages/core/src/memory/episodic-memory.ts:95](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/episodic-memory.ts#L95)

#### Parameters

##### contextId

`string`

#### Returns

`Promise`\<[`Episode`](./Episode.md)[]\>

#### Implementation of

[`EpisodicMemory`](./EpisodicMemory.md).[`getByContext`](EpisodicMemory.md#getbycontext)

***

### getTimeline()

> **getTimeline**(`start`, `end`): `Promise`\<[`Episode`](./Episode.md)[]\>

Defined in: [packages/core/src/memory/episodic-memory.ts:73](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/episodic-memory.ts#L73)

#### Parameters

##### start

`Date`

##### end

`Date`

#### Returns

`Promise`\<[`Episode`](./Episode.md)[]\>

#### Implementation of

[`EpisodicMemory`](./EpisodicMemory.md).[`getTimeline`](EpisodicMemory.md#gettimeline)

***

### store()

> **store**(`episode`): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/episodic-memory.ts:11](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/episodic-memory.ts#L11)

#### Parameters

##### episode

[`Episode`](./Episode.md)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`EpisodicMemory`](./EpisodicMemory.md).[`store`](EpisodicMemory.md#store)
