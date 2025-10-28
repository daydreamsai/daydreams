---
title: "RecallOptions"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / RecallOptions

# Interface: RecallOptions

Defined in: [packages/core/src/memory/types.ts:379](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L379)

## Properties

### contextId?

> `optional` **contextId**: `string`

Defined in: [packages/core/src/memory/types.ts:380](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L380)

***

### dedupeBy?

> `optional` **dedupeBy**: `"docId"` \| `"none"` \| `"id"`

Defined in: [packages/core/src/memory/types.ts:396](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L396)

Deduplication strategy

***

### filter?

> `optional` **filter**: `Record`\<`string`, `unknown`\>

Defined in: [packages/core/src/memory/types.ts:384](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L384)

***

### groupBy?

> `optional` **groupBy**: `"docId"` \| `"source"` \| `"none"`

Defined in: [packages/core/src/memory/types.ts:394](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L394)

Post-processing grouping

***

### include?

> `optional` **include**: `object`

Defined in: [packages/core/src/memory/types.ts:398](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L398)

Include flags

#### content?

> `optional` **content**: `boolean`

#### diagnostics?

> `optional` **diagnostics**: `boolean`

#### metadata?

> `optional` **metadata**: `boolean`

***

### limit?

> `optional` **limit**: `number`

Defined in: [packages/core/src/memory/types.ts:382](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L382)

***

### minRelevance?

> `optional` **minRelevance**: `number`

Defined in: [packages/core/src/memory/types.ts:383](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L383)

***

### minScore?

> `optional` **minScore**: `number`

Defined in: [packages/core/src/memory/types.ts:388](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L388)

Minimum score threshold (alias of minRelevance)

***

### namespace?

> `optional` **namespace**: `string`

Defined in: [packages/core/src/memory/types.ts:390](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L390)

Restrict search to a namespace

***

### scope?

> `optional` **scope**: `"context"` \| `"global"` \| `"all"`

Defined in: [packages/core/src/memory/types.ts:381](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L381)

***

### timeRange?

> `optional` **timeRange**: `object`

Defined in: [packages/core/src/memory/types.ts:392](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L392)

Filter by time range (milliseconds epoch)

#### from?

> `optional` **from**: `number`

#### to?

> `optional` **to**: `number`

***

### topK?

> `optional` **topK**: `number`

Defined in: [packages/core/src/memory/types.ts:386](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L386)

Preferred results count

***

### weighting?

> `optional` **weighting**: `object`

Defined in: [packages/core/src/memory/types.ts:400](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L400)

Simple weighting controls

#### recencyHalfLifeMs?

> `optional` **recencyHalfLifeMs**: `number`

#### salience?

> `optional` **salience**: `number`
