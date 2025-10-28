---
title: "IWorkingMemory"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / IWorkingMemory

# Interface: IWorkingMemory

Defined in: [packages/core/src/memory/types.ts:210](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L210)

Working Memory - manages current session state

## Methods

### clear()

> **clear**(`contextId`): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/types.ts:221](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L221)

#### Parameters

##### contextId

`string`

#### Returns

`Promise`\<`void`\>

***

### create()

> **create**(`contextId`): `Promise`\<[`WorkingMemoryData`](./WorkingMemoryData.md)\>

Defined in: [packages/core/src/memory/types.ts:211](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L211)

#### Parameters

##### contextId

`string`

#### Returns

`Promise`\<[`WorkingMemoryData`](./WorkingMemoryData.md)\>

***

### get()

> **get**(`contextId`): `Promise`\<[`WorkingMemoryData`](./WorkingMemoryData.md)\>

Defined in: [packages/core/src/memory/types.ts:212](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L212)

#### Parameters

##### contextId

`string`

#### Returns

`Promise`\<[`WorkingMemoryData`](./WorkingMemoryData.md)\>

***

### push()

> **push**\<`TContext`\>(`contextId`, `entry`, `ctx`, `agent`, `options?`): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/types.ts:214](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L214)

#### Type Parameters

##### TContext

`TContext` *extends* [`AnyContext`](./AnyContext.md) = [`AnyContext`](./AnyContext.md)

#### Parameters

##### contextId

`string`

##### entry

[`AnyRef`](./AnyRef.md)

##### ctx

[`AgentContext`](./AgentContext.md)\<`TContext`\>

##### agent

[`AnyAgent`](./AnyAgent.md)

##### options?

[`PushOptions`](./PushOptions.md)

#### Returns

`Promise`\<`void`\>

***

### set()

> **set**(`contextId`, `data`): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/types.ts:213](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L213)

#### Parameters

##### contextId

`string`

##### data

[`WorkingMemoryData`](./WorkingMemoryData.md)

#### Returns

`Promise`\<`void`\>

***

### summarize()

> **summarize**(`contextId`): `Promise`\<`string`\>

Defined in: [packages/core/src/memory/types.ts:222](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L222)

#### Parameters

##### contextId

`string`

#### Returns

`Promise`\<`string`\>
