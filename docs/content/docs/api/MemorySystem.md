---
title: "MemorySystem"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / MemorySystem

# Class: MemorySystem

Defined in: [packages/core/src/memory/memory-system.ts:34](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/memory-system.ts#L34)

Main Memory System implementation

## Implements

- [`Memory`](./Memory.md)

## Constructors

### Constructor

> **new MemorySystem**(`config`): `MemorySystem`

Defined in: [packages/core/src/memory/memory-system.ts:51](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/memory-system.ts#L51)

#### Parameters

##### config

[`MemoryConfig`](./MemoryConfig.md)

#### Returns

`MemorySystem`

## Properties

### episodes

> **episodes**: [`EpisodicMemory`](./EpisodicMemory.md)

Defined in: [packages/core/src/memory/memory-system.ts:41](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/memory-system.ts#L41)

#### Implementation of

[`Memory`](./Memory.md).[`episodes`](Memory.md#episodes)

***

### facts

> **facts**: [`FactualMemory`](./FactualMemory.md)

Defined in: [packages/core/src/memory/memory-system.ts:40](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/memory-system.ts#L40)

#### Implementation of

[`Memory`](./Memory.md).[`facts`](Memory.md#facts)

***

### graph

> **graph**: [`GraphMemory`](./GraphMemory.md)

Defined in: [packages/core/src/memory/memory-system.ts:39](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/memory-system.ts#L39)

#### Implementation of

[`Memory`](./Memory.md).[`graph`](Memory.md#graph)

***

### kv

> **kv**: [`KeyValueMemory`](./KeyValueMemory.md)

Defined in: [packages/core/src/memory/memory-system.ts:37](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/memory-system.ts#L37)

#### Implementation of

[`Memory`](./Memory.md).[`kv`](Memory.md#kv)

***

### lifecycle

> **lifecycle**: [`MemoryLifecycle`](./MemoryLifecycle.md)

Defined in: [packages/core/src/memory/memory-system.ts:35](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/memory-system.ts#L35)

#### Implementation of

[`Memory`](./Memory.md).[`lifecycle`](Memory.md#lifecycle)

***

### semantic

> **semantic**: [`SemanticMemory`](./SemanticMemory.md)

Defined in: [packages/core/src/memory/memory-system.ts:42](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/memory-system.ts#L42)

#### Implementation of

[`Memory`](./Memory.md).[`semantic`](Memory.md#semantic)

***

### vector

> **vector**: [`VectorMemory`](./VectorMemory.md)

Defined in: [packages/core/src/memory/memory-system.ts:38](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/memory-system.ts#L38)

#### Implementation of

[`Memory`](./Memory.md).[`vector`](Memory.md#vector)

***

### working

> **working**: [`IWorkingMemory`](./IWorkingMemory.md)

Defined in: [packages/core/src/memory/memory-system.ts:36](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/memory-system.ts#L36)

#### Implementation of

[`Memory`](./Memory.md).[`working`](Memory.md#working)

## Methods

### close()

> **close**(): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/memory-system.ts:131](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/memory-system.ts#L131)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`Memory`](./Memory.md).[`close`](Memory.md#close)

***

### evolve()

> **evolve**(): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/memory-system.ts:471](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/memory-system.ts#L471)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`Memory`](./Memory.md).[`evolve`](Memory.md#evolve)

***

### extract()

> **extract**(`content`, `context`): `Promise`\<[`ExtractedMemories`](./ExtractedMemories.md)\>

Defined in: [packages/core/src/memory/memory-system.ts:467](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/memory-system.ts#L467)

#### Parameters

##### content

`any`

##### context

`any`

#### Returns

`Promise`\<[`ExtractedMemories`](./ExtractedMemories.md)\>

#### Implementation of

[`Memory`](./Memory.md).[`extract`](Memory.md#extract)

***

### forget()

> **forget**(`criteria`): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/memory-system.ts:393](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/memory-system.ts#L393)

#### Parameters

##### criteria

[`ForgetCriteria`](./ForgetCriteria.md)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`Memory`](./Memory.md).[`forget`](Memory.md#forget)

***

### initialize()

> **initialize**(): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/memory-system.ts:75](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/memory-system.ts#L75)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`Memory`](./Memory.md).[`initialize`](Memory.md#initialize)

***

### recall()

> **recall**(`query`, `options?`): `Promise`\<[`MemoryResult`](./MemoryResult.md)[]\>

Defined in: [packages/core/src/memory/memory-system.ts:244](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/memory-system.ts#L244)

#### Parameters

##### query

`string`

##### options?

[`RecallOptions`](./RecallOptions.md)

#### Returns

`Promise`\<[`MemoryResult`](./MemoryResult.md)[]\>

#### Implementation of

[`Memory`](./Memory.md).[`recall`](Memory.md#recall)

***

### remember()

> **remember**(`content`, `options?`): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/memory-system.ts:148](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/memory-system.ts#L148)

#### Parameters

##### content

`any`

##### options?

[`RememberOptions`](./RememberOptions.md)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`Memory`](./Memory.md).[`remember`](Memory.md#remember)
