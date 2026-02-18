---
title: "EpisodicMemory"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / EpisodicMemory

# Interface: EpisodicMemory

Defined in: [packages/core/src/memory/episodic-memory.ts:52](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/episodic-memory.ts#L52)

Episodic Memory - manages conversational episodes and experiences

## Methods

### clearContext()

> **clearContext**(`contextId`): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/episodic-memory.ts:81](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/episodic-memory.ts#L81)

Clear all episodes for a context

#### Parameters

##### contextId

`string`

#### Returns

`Promise`\<`void`\>

***

### createFromLogs()

> **createFromLogs**(`contextId`, `logs`, `contextState`, `agent`): `Promise`\<[`Episode`](./Episode.md)\>

Defined in: [packages/core/src/memory/episodic-memory.ts:70](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/episodic-memory.ts#L70)

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

***

### delete()

> **delete**(`episodeId`): `Promise`\<`boolean`\>

Defined in: [packages/core/src/memory/episodic-memory.ts:78](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/episodic-memory.ts#L78)

Delete episode

#### Parameters

##### episodeId

`string`

#### Returns

`Promise`\<`boolean`\>

***

### findSimilar()

> **findSimilar**(`contextId`, `query`, `limit?`): `Promise`\<[`Episode`](./Episode.md)[]\>

Defined in: [packages/core/src/memory/episodic-memory.ts:57](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/episodic-memory.ts#L57)

Find episodes similar to a query

#### Parameters

##### contextId

`string`

##### query

`string`

##### limit?

`number`

#### Returns

`Promise`\<[`Episode`](./Episode.md)[]\>

***

### get()

> **get**(`episodeId`): `Promise`\<`null` \| [`Episode`](./Episode.md)\>

Defined in: [packages/core/src/memory/episodic-memory.ts:64](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/episodic-memory.ts#L64)

Get episode by ID

#### Parameters

##### episodeId

`string`

#### Returns

`Promise`\<`null` \| [`Episode`](./Episode.md)\>

***

### getByContext()

> **getByContext**(`contextId`, `limit?`): `Promise`\<[`Episode`](./Episode.md)[]\>

Defined in: [packages/core/src/memory/episodic-memory.ts:67](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/episodic-memory.ts#L67)

Get all episodes for a context

#### Parameters

##### contextId

`string`

##### limit?

`number`

#### Returns

`Promise`\<[`Episode`](./Episode.md)[]\>

***

### store()

> **store**(`episode`): `Promise`\<`string`\>

Defined in: [packages/core/src/memory/episodic-memory.ts:54](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/episodic-memory.ts#L54)

Store an episode

#### Parameters

##### episode

[`Episode`](./Episode.md)

#### Returns

`Promise`\<`string`\>
