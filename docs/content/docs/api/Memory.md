---
title: "Memory"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / Memory

# Interface: Memory

Defined in: [packages/core/src/memory/types.ts:23](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L23)

Core Memory interface - the unified API for all memory operations

## Properties

### episodes

> **episodes**: [`EpisodicMemory`](./EpisodicMemory.md)

Defined in: [packages/core/src/memory/types.ts:29](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L29)

***

### facts

> **facts**: [`FactualMemory`](./FactualMemory.md)

Defined in: [packages/core/src/memory/types.ts:28](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L28)

***

### graph

> **graph**: [`GraphMemory`](./GraphMemory.md)

Defined in: [packages/core/src/memory/types.ts:31](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L31)

***

### kv

> **kv**: [`KeyValueMemory`](./KeyValueMemory.md)

Defined in: [packages/core/src/memory/types.ts:26](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L26)

***

### lifecycle

> **lifecycle**: [`MemoryLifecycle`](./MemoryLifecycle.md)

Defined in: [packages/core/src/memory/types.ts:41](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L41)

***

### semantic

> **semantic**: [`SemanticMemory`](./SemanticMemory.md)

Defined in: [packages/core/src/memory/types.ts:30](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L30)

***

### vector

> **vector**: [`VectorMemory`](./VectorMemory.md)

Defined in: [packages/core/src/memory/types.ts:27](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L27)

***

### working

> **working**: [`IWorkingMemory`](./IWorkingMemory.md)

Defined in: [packages/core/src/memory/types.ts:25](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L25)

## Methods

### close()

> **close**(): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/types.ts:45](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L45)

#### Returns

`Promise`\<`void`\>

***

### evolve()

> **evolve**(): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/types.ts:38](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L38)

#### Returns

`Promise`\<`void`\>

***

### extract()

> **extract**(`content`, `context`): `Promise`\<[`ExtractedMemories`](./ExtractedMemories.md)\>

Defined in: [packages/core/src/memory/types.ts:37](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L37)

#### Parameters

##### content

`any`

##### context

`any`

#### Returns

`Promise`\<[`ExtractedMemories`](./ExtractedMemories.md)\>

***

### forget()

> **forget**(`criteria`): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/types.ts:36](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L36)

#### Parameters

##### criteria

[`ForgetCriteria`](./ForgetCriteria.md)

#### Returns

`Promise`\<`void`\>

***

### initialize()

> **initialize**(): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/types.ts:44](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L44)

#### Returns

`Promise`\<`void`\>

***

### recall()

> **recall**(`query`, `options?`): `Promise`\<[`MemoryResult`](./MemoryResult.md)[]\>

Defined in: [packages/core/src/memory/types.ts:35](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L35)

#### Parameters

##### query

`string`

##### options?

[`RecallOptions`](./RecallOptions.md)

#### Returns

`Promise`\<[`MemoryResult`](./MemoryResult.md)[]\>

***

### remember()

> **remember**(`content`, `options?`): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/types.ts:34](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L34)

#### Parameters

##### content

`any`

##### options?

[`RememberOptions`](./RememberOptions.md)

#### Returns

`Promise`\<`void`\>
