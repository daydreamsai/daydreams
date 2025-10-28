---
title: "EpisodicMemoryImpl"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / EpisodicMemoryImpl

# Class: EpisodicMemoryImpl

Defined in: [packages/core/src/memory/episodic-memory.ts:84](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/episodic-memory.ts#L84)

Episodic Memory - manages conversational episodes and experiences

## Implements

- [`EpisodicMemory`](./EpisodicMemory.md)

## Constructors

### Constructor

> **new EpisodicMemoryImpl**(`memory`, `options`): `EpisodicMemoryImpl`

Defined in: [packages/core/src/memory/episodic-memory.ts:88](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/episodic-memory.ts#L88)

#### Parameters

##### memory

[`Memory`](./Memory.md)

##### options

`EpisodicMemoryOptions` = `{}`

#### Returns

`EpisodicMemoryImpl`

## Methods

### addToCurrentEpisode()

> **addToCurrentEpisode**(`contextId`, `ref`): `void`

Defined in: [packages/core/src/memory/episodic-memory.ts:479](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/episodic-memory.ts#L479)

Add log to current episode

#### Parameters

##### contextId

`string`

##### ref

[`AnyRef`](./AnyRef.md)

#### Returns

`void`

***

### clearContext()

> **clearContext**(`contextId`): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/episodic-memory.ts:412](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/episodic-memory.ts#L412)

Clear all episodes for a context

#### Parameters

##### contextId

`string`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`EpisodicMemory`](./EpisodicMemory.md).[`clearContext`](EpisodicMemory.md#clearcontext)

***

### createFromLogs()

> **createFromLogs**(`contextId`, `logs`, `contextState`, `agent`): `Promise`\<[`Episode`](./Episode.md)\>

Defined in: [packages/core/src/memory/episodic-memory.ts:334](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/episodic-memory.ts#L334)

Create episode from logs

#### Parameters

##### contextId

`string`

##### logs

[`AnyRef`](./AnyRef.md)[]

##### contextState

[`ContextState`](./ContextState.md)

##### agent

[`AnyAgent`](./AnyAgent.md)

#### Returns

`Promise`\<[`Episode`](./Episode.md)\>

#### Implementation of

[`EpisodicMemory`](./EpisodicMemory.md).[`createFromLogs`](EpisodicMemory.md#createfromlogs)

***

### delete()

> **delete**(`episodeId`): `Promise`\<`boolean`\>

Defined in: [packages/core/src/memory/episodic-memory.ts:391](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/episodic-memory.ts#L391)

Delete episode

#### Parameters

##### episodeId

`string`

#### Returns

`Promise`\<`boolean`\>

#### Implementation of

[`EpisodicMemory`](./EpisodicMemory.md).[`delete`](EpisodicMemory.md#delete)

***

### finalizeCurrentEpisode()

> **finalizeCurrentEpisode**(`contextId`, `contextState`, `agent`): `Promise`\<`null` \| [`Episode`](./Episode.md)\>

Defined in: [packages/core/src/memory/episodic-memory.ts:489](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/episodic-memory.ts#L489)

Finalize current episode

#### Parameters

##### contextId

`string`

##### contextState

[`ContextState`](./ContextState.md)

##### agent

[`AnyAgent`](./AnyAgent.md)

#### Returns

`Promise`\<`null` \| [`Episode`](./Episode.md)\>

***

### findSimilar()

> **findSimilar**(`contextId`, `query`, `limit`): `Promise`\<[`Episode`](./Episode.md)[]\>

Defined in: [packages/core/src/memory/episodic-memory.ts:281](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/episodic-memory.ts#L281)

Find episodes similar to a query

#### Parameters

##### contextId

`string`

##### query

`string`

##### limit

`number` = `5`

#### Returns

`Promise`\<[`Episode`](./Episode.md)[]\>

#### Implementation of

[`EpisodicMemory`](./EpisodicMemory.md).[`findSimilar`](EpisodicMemory.md#findsimilar)

***

### get()

> **get**(`episodeId`): `Promise`\<`null` \| [`Episode`](./Episode.md)\>

Defined in: [packages/core/src/memory/episodic-memory.ts:307](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/episodic-memory.ts#L307)

Get episode by ID

#### Parameters

##### episodeId

`string`

#### Returns

`Promise`\<`null` \| [`Episode`](./Episode.md)\>

#### Implementation of

[`EpisodicMemory`](./EpisodicMemory.md).[`get`](EpisodicMemory.md#get)

***

### getByContext()

> **getByContext**(`contextId`, `limit`): `Promise`\<[`Episode`](./Episode.md)[]\>

Defined in: [packages/core/src/memory/episodic-memory.ts:312](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/episodic-memory.ts#L312)

Get all episodes for a context

#### Parameters

##### contextId

`string`

##### limit

`number` = `20`

#### Returns

`Promise`\<[`Episode`](./Episode.md)[]\>

#### Implementation of

[`EpisodicMemory`](./EpisodicMemory.md).[`getByContext`](EpisodicMemory.md#getbycontext)

***

### shouldEndEpisode()

> **shouldEndEpisode**(`ref`, `contextId`, `contextState`, `agent`): `Promise`\<`boolean`\>

Defined in: [packages/core/src/memory/episodic-memory.ts:453](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/episodic-memory.ts#L453)

Check if the current episode should be ended

#### Parameters

##### ref

[`AnyRef`](./AnyRef.md)

##### contextId

`string`

##### contextState

[`ContextState`](./ContextState.md)

##### agent

[`AnyAgent`](./AnyAgent.md)

#### Returns

`Promise`\<`boolean`\>

***

### shouldStartEpisode()

> **shouldStartEpisode**(`ref`, `contextId`, `contextState`, `agent`): `Promise`\<`boolean`\>

Defined in: [packages/core/src/memory/episodic-memory.ts:427](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/episodic-memory.ts#L427)

Check if a new episode should be started

#### Parameters

##### ref

[`AnyRef`](./AnyRef.md)

##### contextId

`string`

##### contextState

[`ContextState`](./ContextState.md)

##### agent

[`AnyAgent`](./AnyAgent.md)

#### Returns

`Promise`\<`boolean`\>

***

### store()

> **store**(`episode`): `Promise`\<`string`\>

Defined in: [packages/core/src/memory/episodic-memory.ts:93](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/episodic-memory.ts#L93)

Store an episode

#### Parameters

##### episode

[`Episode`](./Episode.md)

#### Returns

`Promise`\<`string`\>

#### Implementation of

[`EpisodicMemory`](./EpisodicMemory.md).[`store`](EpisodicMemory.md#store)
