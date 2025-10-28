---
title: "Relationship"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / Relationship

# Interface: Relationship

Defined in: [packages/core/src/memory/types.ts:308](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L308)

## Properties

### from

> **from**: `string`

Defined in: [packages/core/src/memory/types.ts:310](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L310)

***

### id

> **id**: `string`

Defined in: [packages/core/src/memory/types.ts:309](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L309)

***

### properties?

> `optional` **properties**: `Record`\<`string`, `unknown`\>

Defined in: [packages/core/src/memory/types.ts:313](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L313)

***

### semantics?

> `optional` **semantics**: `object`

Defined in: [packages/core/src/memory/types.ts:316](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L316)

Semantic metadata for this relationship

#### confidence?

> `optional` **confidence**: `number`

Confidence in this relationship (0-1)

#### context?

> `optional` **context**: `string`

Context where this relationship applies

#### inferred?

> `optional` **inferred**: `boolean`

Whether this relationship was inferred vs explicit

#### inverseVerb?

> `optional` **inverseVerb**: `string`

Inverse verb (e.g., "works_for" inverse is "employs")

#### strength?

> `optional` **strength**: `number`

Relationship strength (0-1) - can override top-level strength

#### temporal?

> `optional` **temporal**: `object`

Temporal information

##### temporal.duration?

> `optional` **duration**: `number`

##### temporal.end?

> `optional` **end**: `Date`

##### temporal.start?

> `optional` **start**: `Date`

#### verb

> **verb**: `string`

Human-readable verb describing the relationship

***

### strength?

> `optional` **strength**: `number`

Defined in: [packages/core/src/memory/types.ts:314](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L314)

***

### to

> **to**: `string`

Defined in: [packages/core/src/memory/types.ts:311](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L311)

***

### type

> **type**: `string`

Defined in: [packages/core/src/memory/types.ts:312](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L312)
