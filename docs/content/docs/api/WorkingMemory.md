---
title: "WorkingMemory"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / WorkingMemory

# Interface: WorkingMemory

Defined in: [packages/core/src/memory/types.ts:583](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L583)

Represents the working memory state during execution

## Extends

- [`WorkingMemoryData`](./WorkingMemoryData.md)

## Properties

### calls

> **calls**: [`ActionCall`](./ActionCall.md)\<`any`\>[]

Defined in: [packages/core/src/memory/types.ts:232](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L232)

#### Inherited from

[`WorkingMemoryData`](./WorkingMemoryData.md).[`calls`](WorkingMemoryData.md#calls)

***

### currentImage?

> `optional` **currentImage**: `URL`

Defined in: [packages/core/src/memory/types.ts:585](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L585)

Current image URL for multimodal context

***

### events

> **events**: [`EventRef`](./EventRef.md)[]

Defined in: [packages/core/src/memory/types.ts:234](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L234)

#### Inherited from

[`WorkingMemoryData`](./WorkingMemoryData.md).[`events`](WorkingMemoryData.md#events)

***

### inputs

> **inputs**: [`InputRef`](./InputRef.md)\<`any`\>[]

Defined in: [packages/core/src/memory/types.ts:229](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L229)

#### Inherited from

[`WorkingMemoryData`](./WorkingMemoryData.md).[`inputs`](WorkingMemoryData.md#inputs)

***

### outputs

> **outputs**: [`OutputRef`](./OutputRef.md)[]

Defined in: [packages/core/src/memory/types.ts:230](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L230)

#### Inherited from

[`WorkingMemoryData`](./WorkingMemoryData.md).[`outputs`](WorkingMemoryData.md#outputs)

***

### relevantMemories?

> `optional` **relevantMemories**: [`MemoryResult`](./MemoryResult.md)[]

Defined in: [packages/core/src/memory/types.ts:237](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L237)

#### Inherited from

[`WorkingMemoryData`](./WorkingMemoryData.md).[`relevantMemories`](WorkingMemoryData.md#relevantmemories)

***

### results

> **results**: [`ActionResult`](./ActionResult.md)\<`any`\>[]

Defined in: [packages/core/src/memory/types.ts:233](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L233)

#### Inherited from

[`WorkingMemoryData`](./WorkingMemoryData.md).[`results`](WorkingMemoryData.md#results)

***

### runs

> **runs**: [`RunRef`](./RunRef.md)[]

Defined in: [packages/core/src/memory/types.ts:236](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L236)

#### Inherited from

[`WorkingMemoryData`](./WorkingMemoryData.md).[`runs`](WorkingMemoryData.md#runs)

***

### steps

> **steps**: [`StepRef`](./StepRef.md)[]

Defined in: [packages/core/src/memory/types.ts:235](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L235)

#### Inherited from

[`WorkingMemoryData`](./WorkingMemoryData.md).[`steps`](WorkingMemoryData.md#steps)

***

### thoughts

> **thoughts**: [`ThoughtRef`](./ThoughtRef.md)[]

Defined in: [packages/core/src/memory/types.ts:231](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L231)

#### Inherited from

[`WorkingMemoryData`](./WorkingMemoryData.md).[`thoughts`](WorkingMemoryData.md#thoughts)
