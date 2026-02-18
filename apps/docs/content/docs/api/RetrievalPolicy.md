---
title: "RetrievalPolicy"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / RetrievalPolicy

# Type Alias: RetrievalPolicy

> **RetrievalPolicy** = `object`

Defined in: [packages/core/src/types.ts:1202](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L1202)

Configuration settings for a context

## Properties

### dedupeBy?

> `optional` **dedupeBy**: `"id"` \| `"docId"` \| `"none"`

Defined in: [packages/core/src/types.ts:1207](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L1207)

***

### groupBy?

> `optional` **groupBy**: `"docId"` \| `"source"` \| `"none"`

Defined in: [packages/core/src/types.ts:1206](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L1206)

***

### include?

> `optional` **include**: `object`

Defined in: [packages/core/src/types.ts:1205](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L1205)

#### content?

> `optional` **content**: `boolean`

#### diagnostics?

> `optional` **diagnostics**: `boolean`

#### metadata?

> `optional` **metadata**: `boolean`

***

### minScore?

> `optional` **minScore**: `number`

Defined in: [packages/core/src/types.ts:1204](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L1204)

***

### namespaces?

> `optional` **namespaces**: `string`[]

Defined in: [packages/core/src/types.ts:1211](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L1211)

Ordered list of namespaces to search (e.g., [`episodes:${ctx.id}`, 'org', 'global']).

***

### scope?

> `optional` **scope**: `"context"` \| `"global"` \| `"all"`

Defined in: [packages/core/src/types.ts:1209](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L1209)

***

### topK?

> `optional` **topK**: `number`

Defined in: [packages/core/src/types.ts:1203](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L1203)

***

### weighting?

> `optional` **weighting**: `object`

Defined in: [packages/core/src/types.ts:1208](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L1208)

#### recencyHalfLifeMs?

> `optional` **recencyHalfLifeMs**: `number`

#### salience?

> `optional` **salience**: `number`
