---
title: "SemanticMemory"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / SemanticMemory

# Interface: SemanticMemory

Defined in: [packages/core/src/memory/types.ts:365](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L365)

Semantic Memory - stores learned concepts and patterns

## Methods

### get()

> **get**(`id`, `contextId?`): `Promise`\<`null` \| [`SemanticConcept`](./SemanticConcept.md)\>

Defined in: [packages/core/src/memory/types.ts:367](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L367)

#### Parameters

##### id

`string`

##### contextId?

`string`

#### Returns

`Promise`\<`null` \| [`SemanticConcept`](./SemanticConcept.md)\>

***

### getRelevantPatterns()

> **getRelevantPatterns**(`contextId`): `Promise`\<[`Pattern`](./Pattern.md)[]\>

Defined in: [packages/core/src/memory/types.ts:372](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L372)

#### Parameters

##### contextId

`string`

#### Returns

`Promise`\<[`Pattern`](./Pattern.md)[]\>

***

### learnFromAction()

> **learnFromAction**(`action`, `result`, `contextId?`): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/types.ts:373](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L373)

#### Parameters

##### action

`any`

##### result

`any`

##### contextId?

`string`

#### Returns

`Promise`\<`void`\>

***

### search()

> **search**(`query`, `options?`): `Promise`\<[`SemanticConcept`](./SemanticConcept.md)[]\>

Defined in: [packages/core/src/memory/types.ts:368](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L368)

#### Parameters

##### query

`string`

##### options?

[`SearchOptions`](./SearchOptions.md) & `object`

#### Returns

`Promise`\<[`SemanticConcept`](./SemanticConcept.md)[]\>

***

### store()

> **store**(`concept`): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/types.ts:366](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L366)

#### Parameters

##### concept

[`SemanticConcept`](./SemanticConcept.md)

#### Returns

`Promise`\<`void`\>

***

### updateConfidence()

> **updateConfidence**(`id`, `delta`, `contextId?`): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/types.ts:374](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L374)

#### Parameters

##### id

`string`

##### delta

`number`

##### contextId?

`string`

#### Returns

`Promise`\<`void`\>
