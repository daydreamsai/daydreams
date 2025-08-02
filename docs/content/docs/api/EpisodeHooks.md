---
title: "EpisodeHooks"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / EpisodeHooks

# Interface: EpisodeHooks\<TContext\>

Defined in: [packages/core/src/memory/types.ts:592](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L592)

Episode detection and creation hooks for contexts
Allows developers to customize when and how episodes are stored

## Type Parameters

### TContext

`TContext` *extends* [`AnyContext`](./AnyContext.md) = [`AnyContext`](./AnyContext.md)

## Methods

### classifyEpisode()?

> `optional` **classifyEpisode**(`episodeData`, `contextState`): `string`

Defined in: [packages/core/src/memory/types.ts:642](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L642)

Called to classify the type of episode (optional)

#### Parameters

##### episodeData

`any`

The episode data from createEpisode

##### contextState

[`ContextState`](./ContextState.md)\<`TContext`\>

Current context state

#### Returns

`string`

Episode type/classification string

***

### createEpisode()?

> `optional` **createEpisode**(`logs`, `contextState`, `agent`): `any`

Defined in: [packages/core/src/memory/types.ts:630](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L630)

Called to create episode data from collected logs

#### Parameters

##### logs

[`AnyRef`](./AnyRef.md)[]

Array of logs that make up this episode

##### contextState

[`ContextState`](./ContextState.md)\<`TContext`\>

Current context state

##### agent

[`AnyAgent`](./AnyAgent.md)

Agent instance

#### Returns

`any`

Episode data to be stored

***

### extractMetadata()?

> `optional` **extractMetadata**(`episodeData`, `logs`, `contextState`): `Record`\<`string`, `any`\>

Defined in: [packages/core/src/memory/types.ts:654](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L654)

Called to extract additional metadata for the episode (optional)

#### Parameters

##### episodeData

`any`

The episode data from createEpisode

##### logs

[`AnyRef`](./AnyRef.md)[]

The original logs for this episode

##### contextState

[`ContextState`](./ContextState.md)\<`TContext`\>

Current context state

#### Returns

`Record`\<`string`, `any`\>

Metadata object

***

### shouldEndEpisode()?

> `optional` **shouldEndEpisode**(`ref`, `workingMemory`, `contextState`, `agent`): `boolean` \| `Promise`\<`boolean`\>

Defined in: [packages/core/src/memory/types.ts:616](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L616)

Called to determine if the current episode should be ended and stored

#### Parameters

##### ref

[`AnyRef`](./AnyRef.md)

The current log reference being processed

##### workingMemory

[`WorkingMemory`](./WorkingMemory.md)

Current working memory state

##### contextState

[`ContextState`](./ContextState.md)\<`TContext`\>

Current context state

##### agent

[`AnyAgent`](./AnyAgent.md)

Agent instance

#### Returns

`boolean` \| `Promise`\<`boolean`\>

true if the current episode should be stored

***

### shouldStartEpisode()?

> `optional` **shouldStartEpisode**(`ref`, `workingMemory`, `contextState`, `agent`): `boolean` \| `Promise`\<`boolean`\>

Defined in: [packages/core/src/memory/types.ts:601](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L601)

Called to determine if a new episode should be started

#### Parameters

##### ref

[`AnyRef`](./AnyRef.md)

The current log reference being processed

##### workingMemory

[`WorkingMemory`](./WorkingMemory.md)

Current working memory state

##### contextState

[`ContextState`](./ContextState.md)\<`TContext`\>

Current context state

##### agent

[`AnyAgent`](./AnyAgent.md)

Agent instance

#### Returns

`boolean` \| `Promise`\<`boolean`\>

true if a new episode should start
