---
title: "InMemoryGraphProvider"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / InMemoryGraphProvider

# Class: InMemoryGraphProvider

Defined in: [packages/core/src/memory/providers/in-memory.ts:290](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/providers/in-memory.ts#L290)

In-memory Graph Provider for testing

## Implements

- [`GraphProvider`](./GraphProvider.md)

## Constructors

### Constructor

> **new InMemoryGraphProvider**(): `InMemoryGraphProvider`

#### Returns

`InMemoryGraphProvider`

## Methods

### addEdge()

> **addEdge**(`edge`): `Promise`\<`string`\>

Defined in: [packages/core/src/memory/providers/in-memory.ts:378](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/providers/in-memory.ts#L378)

#### Parameters

##### edge

[`GraphEdge`](./GraphEdge.md)

#### Returns

`Promise`\<`string`\>

#### Implementation of

[`GraphProvider`](./GraphProvider.md).[`addEdge`](GraphProvider.md#addedge)

***

### addNode()

> **addNode**(`node`): `Promise`\<`string`\>

Defined in: [packages/core/src/memory/providers/in-memory.ts:319](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/providers/in-memory.ts#L319)

#### Parameters

##### node

[`GraphNode`](./GraphNode.md)

#### Returns

`Promise`\<`string`\>

#### Implementation of

[`GraphProvider`](./GraphProvider.md).[`addNode`](GraphProvider.md#addnode)

***

### close()

> **close**(): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/providers/in-memory.ts:300](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/providers/in-memory.ts#L300)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`GraphProvider`](./GraphProvider.md).[`close`](GraphProvider.md#close)

***

### deleteEdge()

> **deleteEdge**(`id`): `Promise`\<`boolean`\>

Defined in: [packages/core/src/memory/providers/in-memory.ts:424](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/providers/in-memory.ts#L424)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<`boolean`\>

#### Implementation of

[`GraphProvider`](./GraphProvider.md).[`deleteEdge`](GraphProvider.md#deleteedge)

***

### deleteNode()

> **deleteNode**(`id`): `Promise`\<`boolean`\>

Defined in: [packages/core/src/memory/providers/in-memory.ts:349](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/providers/in-memory.ts#L349)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<`boolean`\>

#### Implementation of

[`GraphProvider`](./GraphProvider.md).[`deleteNode`](GraphProvider.md#deletenode)

***

### findNodes()

> **findNodes**(`filter`): `Promise`\<[`GraphNode`](./GraphNode.md)[]\>

Defined in: [packages/core/src/memory/providers/in-memory.ts:439](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/providers/in-memory.ts#L439)

#### Parameters

##### filter

[`GraphFilter`](./GraphFilter.md)

#### Returns

`Promise`\<[`GraphNode`](./GraphNode.md)[]\>

#### Implementation of

[`GraphProvider`](./GraphProvider.md).[`findNodes`](GraphProvider.md#findnodes)

***

### getEdges()

> **getEdges**(`nodeId`, `direction`): `Promise`\<[`GraphEdge`](./GraphEdge.md)[]\>

Defined in: [packages/core/src/memory/providers/in-memory.ts:402](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/providers/in-memory.ts#L402)

#### Parameters

##### nodeId

`string`

##### direction

`"out"` | `"in"` | `"both"`

#### Returns

`Promise`\<[`GraphEdge`](./GraphEdge.md)[]\>

#### Implementation of

[`GraphProvider`](./GraphProvider.md).[`getEdges`](GraphProvider.md#getedges)

***

### getNode()

> **getNode**(`id`): `Promise`\<`null` \| [`GraphNode`](./GraphNode.md)\>

Defined in: [packages/core/src/memory/providers/in-memory.ts:335](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/providers/in-memory.ts#L335)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<`null` \| [`GraphNode`](./GraphNode.md)\>

#### Implementation of

[`GraphProvider`](./GraphProvider.md).[`getNode`](GraphProvider.md#getnode)

***

### health()

> **health**(): `Promise`\<[`HealthStatus`](./HealthStatus.md)\>

Defined in: [packages/core/src/memory/providers/in-memory.ts:307](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/providers/in-memory.ts#L307)

#### Returns

`Promise`\<[`HealthStatus`](./HealthStatus.md)\>

#### Implementation of

[`GraphProvider`](./GraphProvider.md).[`health`](GraphProvider.md#health)

***

### initialize()

> **initialize**(): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/providers/in-memory.ts:296](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/providers/in-memory.ts#L296)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`GraphProvider`](./GraphProvider.md).[`initialize`](GraphProvider.md#initialize)

***

### shortestPath()

> **shortestPath**(`from`, `to`): `Promise`\<`null` \| [`GraphPath`](./GraphPath.md)\>

Defined in: [packages/core/src/memory/providers/in-memory.ts:535](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/providers/in-memory.ts#L535)

#### Parameters

##### from

`string`

##### to

`string`

#### Returns

`Promise`\<`null` \| [`GraphPath`](./GraphPath.md)\>

#### Implementation of

[`GraphProvider`](./GraphProvider.md).[`shortestPath`](GraphProvider.md#shortestpath)

***

### traverse()

> **traverse**(`traversal`): `Promise`\<[`GraphPath`](./GraphPath.md)[]\>

Defined in: [packages/core/src/memory/providers/in-memory.ts:477](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/providers/in-memory.ts#L477)

#### Parameters

##### traversal

[`GraphTraversal`](./GraphTraversal.md)

#### Returns

`Promise`\<[`GraphPath`](./GraphPath.md)[]\>

#### Implementation of

[`GraphProvider`](./GraphProvider.md).[`traverse`](GraphProvider.md#traverse)

***

### updateNode()

> **updateNode**(`id`, `updates`): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/providers/in-memory.ts:340](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/providers/in-memory.ts#L340)

#### Parameters

##### id

`string`

##### updates

`Partial`\<[`GraphNode`](./GraphNode.md)\>

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`GraphProvider`](./GraphProvider.md).[`updateNode`](GraphProvider.md#updatenode)
