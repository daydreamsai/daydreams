---
title: "SemanticMemoryImpl"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / SemanticMemoryImpl

# Class: SemanticMemoryImpl

Defined in: [packages/core/src/memory/semantic-memory.ts:9](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/semantic-memory.ts#L9)

Semantic Memory - stores learned concepts and patterns

## Implements

- [`SemanticMemory`](./SemanticMemory.md)

## Constructors

### Constructor

> **new SemanticMemoryImpl**(`memory`): `SemanticMemoryImpl`

Defined in: [packages/core/src/memory/semantic-memory.ts:10](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/semantic-memory.ts#L10)

#### Parameters

##### memory

[`Memory`](./Memory.md)

#### Returns

`SemanticMemoryImpl`

## Methods

### get()

> **get**(`id`, `contextId?`): `Promise`\<`null` \| [`SemanticConcept`](./SemanticConcept.md)\>

Defined in: [packages/core/src/memory/semantic-memory.ts:44](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/semantic-memory.ts#L44)

#### Parameters

##### id

`string`

##### contextId?

`string`

#### Returns

`Promise`\<`null` \| [`SemanticConcept`](./SemanticConcept.md)\>

#### Implementation of

[`SemanticMemory`](./SemanticMemory.md).[`get`](SemanticMemory.md#get)

***

### getRelevantPatterns()

> **getRelevantPatterns**(`contextId`): `Promise`\<[`Pattern`](./Pattern.md)[]\>

Defined in: [packages/core/src/memory/semantic-memory.ts:94](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/semantic-memory.ts#L94)

#### Parameters

##### contextId

`string`

#### Returns

`Promise`\<[`Pattern`](./Pattern.md)[]\>

#### Implementation of

[`SemanticMemory`](./SemanticMemory.md).[`getRelevantPatterns`](SemanticMemory.md#getrelevantpatterns)

***

### learnFromAction()

> **learnFromAction**(`action`, `result`, `contextId?`): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/semantic-memory.ts:148](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/semantic-memory.ts#L148)

#### Parameters

##### action

`any`

##### result

`any`

##### contextId?

`string`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`SemanticMemory`](./SemanticMemory.md).[`learnFromAction`](SemanticMemory.md#learnfromaction)

***

### search()

> **search**(`query`, `options?`): `Promise`\<[`SemanticConcept`](./SemanticConcept.md)[]\>

Defined in: [packages/core/src/memory/semantic-memory.ts:59](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/semantic-memory.ts#L59)

#### Parameters

##### query

`string`

##### options?

[`SearchOptions`](./SearchOptions.md) & `object`

#### Returns

`Promise`\<[`SemanticConcept`](./SemanticConcept.md)[]\>

#### Implementation of

[`SemanticMemory`](./SemanticMemory.md).[`search`](SemanticMemory.md#search)

***

### store()

> **store**(`concept`): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/semantic-memory.ts:12](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/semantic-memory.ts#L12)

#### Parameters

##### concept

[`SemanticConcept`](./SemanticConcept.md)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`SemanticMemory`](./SemanticMemory.md).[`store`](SemanticMemory.md#store)

***

### updateConfidence()

> **updateConfidence**(`id`, `delta`, `contextId?`): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/semantic-memory.ts:192](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/semantic-memory.ts#L192)

#### Parameters

##### id

`string`

##### delta

`number`

##### contextId?

`string`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`SemanticMemory`](./SemanticMemory.md).[`updateConfidence`](SemanticMemory.md#updateconfidence)
