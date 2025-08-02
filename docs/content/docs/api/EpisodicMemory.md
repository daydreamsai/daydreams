---
title: "EpisodicMemory"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / EpisodicMemory

# Interface: EpisodicMemory

Defined in: [packages/core/src/memory/types.ts:331](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L331)

Episodic Memory - stores past experiences

## Methods

### compress()

> **compress**(`episodes`): `Promise`\<[`CompressedEpisode`](./CompressedEpisode.md)\>

Defined in: [packages/core/src/memory/types.ts:341](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L341)

#### Parameters

##### episodes

[`Episode`](./Episode.md)[]

#### Returns

`Promise`\<[`CompressedEpisode`](./CompressedEpisode.md)\>

***

### findSimilar()

> **findSimilar**(`contextId`, `content`, `limit?`): `Promise`\<[`Episode`](./Episode.md)[]\>

Defined in: [packages/core/src/memory/types.ts:334](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L334)

#### Parameters

##### contextId

`string`

##### content

`string`

##### limit?

`number`

#### Returns

`Promise`\<[`Episode`](./Episode.md)[]\>

***

### get()

> **get**(`id`): `Promise`\<`null` \| [`Episode`](./Episode.md)\>

Defined in: [packages/core/src/memory/types.ts:333](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L333)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<`null` \| [`Episode`](./Episode.md)\>

***

### getByContext()

> **getByContext**(`contextId`): `Promise`\<[`Episode`](./Episode.md)[]\>

Defined in: [packages/core/src/memory/types.ts:340](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L340)

#### Parameters

##### contextId

`string`

#### Returns

`Promise`\<[`Episode`](./Episode.md)[]\>

***

### getTimeline()

> **getTimeline**(`start`, `end`): `Promise`\<[`Episode`](./Episode.md)[]\>

Defined in: [packages/core/src/memory/types.ts:339](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L339)

#### Parameters

##### start

`Date`

##### end

`Date`

#### Returns

`Promise`\<[`Episode`](./Episode.md)[]\>

***

### store()

> **store**(`episode`): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/types.ts:332](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L332)

#### Parameters

##### episode

[`Episode`](./Episode.md)

#### Returns

`Promise`\<`void`\>
