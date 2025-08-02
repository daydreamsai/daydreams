---
title: "GraphProvider"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / GraphProvider

# Interface: GraphProvider

Defined in: [packages/core/src/memory/types.ts:155](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L155)

Graph storage provider

## Extends

- [`MemoryProvider`](./MemoryProvider.md)

## Methods

### addEdge()

> **addEdge**(`edge`): `Promise`\<`string`\>

Defined in: [packages/core/src/memory/types.ts:163](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L163)

#### Parameters

##### edge

[`GraphEdge`](./GraphEdge.md)

#### Returns

`Promise`\<`string`\>

***

### addNode()

> **addNode**(`node`): `Promise`\<`string`\>

Defined in: [packages/core/src/memory/types.ts:157](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L157)

#### Parameters

##### node

[`GraphNode`](./GraphNode.md)

#### Returns

`Promise`\<`string`\>

***

### close()

> **close**(): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/types.ts:81](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L81)

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`MemoryProvider`](./MemoryProvider.md).[`close`](MemoryProvider.md#close)

***

### deleteEdge()

> **deleteEdge**(`id`): `Promise`\<`boolean`\>

Defined in: [packages/core/src/memory/types.ts:168](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L168)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<`boolean`\>

***

### deleteNode()

> **deleteNode**(`id`): `Promise`\<`boolean`\>

Defined in: [packages/core/src/memory/types.ts:160](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L160)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<`boolean`\>

***

### findNodes()

> **findNodes**(`filter`): `Promise`\<[`GraphNode`](./GraphNode.md)[]\>

Defined in: [packages/core/src/memory/types.ts:171](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L171)

#### Parameters

##### filter

[`GraphFilter`](./GraphFilter.md)

#### Returns

`Promise`\<[`GraphNode`](./GraphNode.md)[]\>

***

### getEdges()

> **getEdges**(`nodeId`, `direction?`): `Promise`\<[`GraphEdge`](./GraphEdge.md)[]\>

Defined in: [packages/core/src/memory/types.ts:164](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L164)

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

Defined in: [packages/core/src/memory/types.ts:158](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L158)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<`null` \| [`GraphNode`](./GraphNode.md)\>

***

### health()

> **health**(): `Promise`\<[`HealthStatus`](./HealthStatus.md)\>

Defined in: [packages/core/src/memory/types.ts:82](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L82)

#### Returns

`Promise`\<[`HealthStatus`](./HealthStatus.md)\>

#### Inherited from

[`MemoryProvider`](./MemoryProvider.md).[`health`](MemoryProvider.md#health)

***

### initialize()

> **initialize**(): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/types.ts:80](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L80)

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`MemoryProvider`](./MemoryProvider.md).[`initialize`](MemoryProvider.md#initialize)

***

### shortestPath()

> **shortestPath**(`from`, `to`): `Promise`\<`null` \| [`GraphPath`](./GraphPath.md)\>

Defined in: [packages/core/src/memory/types.ts:173](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L173)

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

Defined in: [packages/core/src/memory/types.ts:172](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L172)

#### Parameters

##### traversal

[`GraphTraversal`](./GraphTraversal.md)

#### Returns

`Promise`\<[`GraphPath`](./GraphPath.md)[]\>

***

### updateNode()

> **updateNode**(`id`, `updates`): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/types.ts:159](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L159)

#### Parameters

##### id

`string`

##### updates

`Partial`\<[`GraphNode`](./GraphNode.md)\>

#### Returns

`Promise`\<`void`\>
