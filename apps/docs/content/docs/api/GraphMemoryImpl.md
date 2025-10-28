---
title: "GraphMemoryImpl"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / GraphMemoryImpl

# Class: GraphMemoryImpl

Defined in: [packages/core/src/memory/graph-memory.ts:3](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/graph-memory.ts#L3)

Graph Memory - stores entity relationships

## Implements

- [`GraphMemory`](./GraphMemory.md)

## Constructors

### Constructor

> **new GraphMemoryImpl**(`provider`): `GraphMemoryImpl`

Defined in: [packages/core/src/memory/graph-memory.ts:4](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/graph-memory.ts#L4)

#### Parameters

##### provider

[`GraphProvider`](./GraphProvider.md)

#### Returns

`GraphMemoryImpl`

## Methods

### addEntity()

> **addEntity**(`entity`): `Promise`\<`string`\>

Defined in: [packages/core/src/memory/graph-memory.ts:6](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/graph-memory.ts#L6)

#### Parameters

##### entity

[`Entity`](./Entity.md)

#### Returns

`Promise`\<`string`\>

#### Implementation of

[`GraphMemory`](./GraphMemory.md).[`addEntity`](GraphMemory.md#addentity)

***

### addRelationship()

> **addRelationship**(`relationship`): `Promise`\<`string`\>

Defined in: [packages/core/src/memory/graph-memory.ts:19](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/graph-memory.ts#L19)

#### Parameters

##### relationship

[`Relationship`](./Relationship.md)

#### Returns

`Promise`\<`string`\>

#### Implementation of

[`GraphMemory`](./GraphMemory.md).[`addRelationship`](GraphMemory.md#addrelationship)

***

### findPath()

> **findPath**(`from`, `to`): `Promise`\<[`Entity`](./Entity.md)[]\>

Defined in: [packages/core/src/memory/graph-memory.ts:79](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/graph-memory.ts#L79)

#### Parameters

##### from

`string`

##### to

`string`

#### Returns

`Promise`\<[`Entity`](./Entity.md)[]\>

#### Implementation of

[`GraphMemory`](./GraphMemory.md).[`findPath`](GraphMemory.md#findpath)

***

### findRelated()

> **findRelated**(`entityId`, `relationshipType?`): `Promise`\<[`Entity`](./Entity.md)[]\>

Defined in: [packages/core/src/memory/graph-memory.ts:57](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/graph-memory.ts#L57)

#### Parameters

##### entityId

`string`

##### relationshipType?

`string`

#### Returns

`Promise`\<[`Entity`](./Entity.md)[]\>

#### Implementation of

[`GraphMemory`](./GraphMemory.md).[`findRelated`](GraphMemory.md#findrelated)

***

### getEntity()

> **getEntity**(`id`): `Promise`\<`null` \| [`Entity`](./Entity.md)\>

Defined in: [packages/core/src/memory/graph-memory.ts:40](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/graph-memory.ts#L40)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<`null` \| [`Entity`](./Entity.md)\>

#### Implementation of

[`GraphMemory`](./GraphMemory.md).[`getEntity`](GraphMemory.md#getentity)

***

### removeEntity()

> **removeEntity**(`id`): `Promise`\<`boolean`\>

Defined in: [packages/core/src/memory/graph-memory.ts:106](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/graph-memory.ts#L106)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<`boolean`\>

#### Implementation of

[`GraphMemory`](./GraphMemory.md).[`removeEntity`](GraphMemory.md#removeentity)

***

### updateEntity()

> **updateEntity**(`id`, `updates`): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/graph-memory.ts:92](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/graph-memory.ts#L92)

#### Parameters

##### id

`string`

##### updates

`Partial`\<[`Entity`](./Entity.md)\>

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`GraphMemory`](./GraphMemory.md).[`updateEntity`](GraphMemory.md#updateentity)
