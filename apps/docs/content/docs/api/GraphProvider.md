---
title: "GraphProvider"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / GraphProvider

# Interface: GraphProvider

Defined in: [packages/core/src/memory/types.ts:152](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L152)

Graph storage provider

## Extends

- [`MemoryProvider`](./MemoryProvider.md)

## Methods

### addEdge()

> **addEdge**(`edge`): `Promise`\<`string`\>

Defined in: [packages/core/src/memory/types.ts:160](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L160)

#### Parameters

##### edge

[`GraphEdge`](./GraphEdge.md)

#### Returns

`Promise`\<`string`\>

***

### addNode()

> **addNode**(`node`): `Promise`\<`string`\>

Defined in: [packages/core/src/memory/types.ts:154](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L154)

#### Parameters

##### node

[`GraphNode`](./GraphNode.md)

#### Returns

`Promise`\<`string`\>

***

### close()

> **close**(): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/types.ts:78](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L78)

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`MemoryProvider`](./MemoryProvider.md).[`close`](MemoryProvider.md#close)

***

### deleteEdge()

> **deleteEdge**(`id`): `Promise`\<`boolean`\>

Defined in: [packages/core/src/memory/types.ts:165](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L165)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<`boolean`\>

***

### deleteNode()

> **deleteNode**(`id`): `Promise`\<`boolean`\>

Defined in: [packages/core/src/memory/types.ts:157](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L157)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<`boolean`\>

***

### findNodes()

> **findNodes**(`filter`): `Promise`\<[`GraphNode`](./GraphNode.md)[]\>

Defined in: [packages/core/src/memory/types.ts:168](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L168)

#### Parameters

##### filter

[`GraphFilter`](./GraphFilter.md)

#### Returns

`Promise`\<[`GraphNode`](./GraphNode.md)[]\>

***

### getEdges()

> **getEdges**(`nodeId`, `direction?`): `Promise`\<[`GraphEdge`](./GraphEdge.md)[]\>

Defined in: [packages/core/src/memory/types.ts:161](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L161)

#### Parameters

##### nodeId

`string`

##### direction?

`"out"` | `"in"` | `"both"`

#### Returns

`Promise`\<[`GraphEdge`](./GraphEdge.md)[]\>

***

### getNode()

> **getNode**(`id`): `Promise`\<`null` \| [`GraphNode`](./GraphNode.md)\>

Defined in: [packages/core/src/memory/types.ts:155](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L155)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<`null` \| [`GraphNode`](./GraphNode.md)\>

***

### health()

> **health**(): `Promise`\<[`HealthStatus`](./HealthStatus.md)\>

Defined in: [packages/core/src/memory/types.ts:79](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L79)

#### Returns

`Promise`\<[`HealthStatus`](./HealthStatus.md)\>

#### Inherited from

[`MemoryProvider`](./MemoryProvider.md).[`health`](MemoryProvider.md#health)

***

### initialize()

> **initialize**(): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/types.ts:77](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L77)

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`MemoryProvider`](./MemoryProvider.md).[`initialize`](MemoryProvider.md#initialize)

***

### shortestPath()

> **shortestPath**(`from`, `to`): `Promise`\<`null` \| [`GraphPath`](./GraphPath.md)\>

Defined in: [packages/core/src/memory/types.ts:170](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L170)

#### Parameters

##### from

`string`

##### to

`string`

#### Returns

`Promise`\<`null` \| [`GraphPath`](./GraphPath.md)\>

***

### traverse()

> **traverse**(`traversal`): `Promise`\<[`GraphPath`](./GraphPath.md)[]\>

Defined in: [packages/core/src/memory/types.ts:169](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L169)

#### Parameters

##### traversal

[`GraphTraversal`](./GraphTraversal.md)

#### Returns

`Promise`\<[`GraphPath`](./GraphPath.md)[]\>

***

### updateNode()

> **updateNode**(`id`, `updates`): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/types.ts:156](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L156)

#### Parameters

##### id

`string`

##### updates

`Partial`\<[`GraphNode`](./GraphNode.md)\>

#### Returns

`Promise`\<`void`\>
