---
title: "CreateEpisodeResult"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / CreateEpisodeResult

# Interface: CreateEpisodeResult

Defined in: [packages/core/src/memory/types.ts:495](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L495)

Episode detection and creation hooks for contexts
Allows developers to customize when and how episodes are stored

## Properties

### context?

> `optional` **context**: `string`

Defined in: [packages/core/src/memory/types.ts:505](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L505)

***

### input?

> `optional` **input**: `any`

Defined in: [packages/core/src/memory/types.ts:503](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L503)

Optional structured fields copied into the stored episode

***

### logs?

> `optional` **logs**: [`AnyRef`](./AnyRef.md)[]

Defined in: [packages/core/src/memory/types.ts:501](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L501)

Optional logs; if omitted, the collected logs for this episode will be used

***

### metadata?

> `optional` **metadata**: `Record`\<`string`, `any`\>

Defined in: [packages/core/src/memory/types.ts:507](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L507)

Optional extra metadata merged into the stored episode metadata

***

### output?

> `optional` **output**: `any`

Defined in: [packages/core/src/memory/types.ts:504](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L504)

***

### summary?

> `optional` **summary**: `string`

Defined in: [packages/core/src/memory/types.ts:499](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L499)

Optional summary; if omitted and logs provided, a summary will be auto-generated

***

### type?

> `optional` **type**: `string`

Defined in: [packages/core/src/memory/types.ts:497](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L497)

Optional explicit episode type
