---
title: "EpisodeHooks"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / EpisodeHooks

# Interface: EpisodeHooks\<TContext\>

Defined in: [packages/core/src/memory/types.ts:510](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L510)

## Type Parameters

### TContext

`TContext` *extends* [`AnyContext`](./AnyContext.md) = [`AnyContext`](./AnyContext.md)

## Properties

### actionResultRedactor()?

> `optional` **actionResultRedactor**: (`data`) => `any`

Defined in: [packages/core/src/memory/types.ts:568](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L568)

Optional redactor for action_result data. If provided, overrides size-based truncation.

#### Parameters

##### data

`any`

#### Returns

`any`

***

### includeRefs?

> `optional` **includeRefs**: (`"output"` \| `"run"` \| `"thought"` \| `"step"` \| `"input"` \| `"action_call"` \| `"action_result"` \| `"event"`)[]

Defined in: [packages/core/src/memory/types.ts:560](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L560)

Control which log refs are allowed to be stored in episodes.
If omitted, defaults to ['input','output','action_call','action_result','event'] (excludes 'thought').

***

### maxActionResultBytes?

> `optional` **maxActionResultBytes**: `number`

Defined in: [packages/core/src/memory/types.ts:565](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L565)

Max size (in bytes) allowed for action_result.data before truncation/redaction (default: 4096).

## Methods

### classifyEpisode()?

> `optional` **classifyEpisode**(`episodeData`, `contextState`): `string`

Defined in: [packages/core/src/memory/types.ts:576](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L576)

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

> `optional` **createEpisode**(`logs`, `contextState`, `agent`): `undefined` \| [`CreateEpisodeResult`](./CreateEpisodeResult.md) \| [`Episode`](./Episode.md) \| `Promise`\<`undefined` \| [`CreateEpisodeResult`](./CreateEpisodeResult.md) \| [`Episode`](./Episode.md)\>

Defined in: [packages/core/src/memory/types.ts:548](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L548)

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

`undefined` \| [`CreateEpisodeResult`](./CreateEpisodeResult.md) \| [`Episode`](./Episode.md) \| `Promise`\<`undefined` \| [`CreateEpisodeResult`](./CreateEpisodeResult.md) \| [`Episode`](./Episode.md)\>

Episode data to be stored

***

### extractMetadata()?

> `optional` **extractMetadata**(`episodeData`, `logs`, `contextState`): `Record`\<`string`, `any`\>

Defined in: [packages/core/src/memory/types.ts:588](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L588)

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

Defined in: [packages/core/src/memory/types.ts:534](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L534)

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

Defined in: [packages/core/src/memory/types.ts:519](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L519)

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
