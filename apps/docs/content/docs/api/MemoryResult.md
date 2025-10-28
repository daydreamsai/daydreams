---
title: "MemoryResult"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / MemoryResult

# Interface: MemoryResult

Defined in: [packages/core/src/memory/types.ts:421](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L421)

Memory results

## Properties

### confidence?

> `optional` **confidence**: `number`

Defined in: [packages/core/src/memory/types.ts:426](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L426)

***

### content

> **content**: `any`

Defined in: [packages/core/src/memory/types.ts:424](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L424)

***

### diagnostics?

> `optional` **diagnostics**: `object`

Defined in: [packages/core/src/memory/types.ts:432](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L432)

Diagnostics for scoring pipeline

#### recencyBoost?

> `optional` **recencyBoost**: `number`

#### rerankDelta?

> `optional` **rerankDelta**: `number`

#### salience?

> `optional` **salience**: `number`

***

### groupKey?

> `optional` **groupKey**: `string`

Defined in: [packages/core/src/memory/types.ts:438](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L438)

Optional grouping key

***

### id

> **id**: `string`

Defined in: [packages/core/src/memory/types.ts:422](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L422)

***

### metadata?

> `optional` **metadata**: `Record`\<`string`, `unknown`\>

Defined in: [packages/core/src/memory/types.ts:427](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L427)

***

### rawScore?

> `optional` **rawScore**: `number`

Defined in: [packages/core/src/memory/types.ts:430](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L430)

Provider raw score before post-weighting

***

### score?

> `optional` **score**: `number`

Defined in: [packages/core/src/memory/types.ts:425](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L425)

***

### timestamp?

> `optional` **timestamp**: `number`

Defined in: [packages/core/src/memory/types.ts:428](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L428)

***

### type

> **type**: `string`

Defined in: [packages/core/src/memory/types.ts:423](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L423)
