---
title: "AgentContext"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / AgentContext

# Interface: AgentContext\<TContext\>

Defined in: [packages/core/src/types.ts:524](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L524)

## Extended by

- [`ActionContext`](./ActionContext.md)

## Type Parameters

### TContext

`TContext` *extends* [`AnyContext`](./AnyContext.md) = [`AnyContext`](./AnyContext.md)

## Properties

### args

> **args**: [`InferSchemaArguments`](./InferSchemaArguments.md)\<`TContext`\[`"schema"`\]\>

Defined in: [packages/core/src/types.ts:527](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L527)

***

### context

> **context**: `TContext`

Defined in: [packages/core/src/types.ts:526](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L526)

***

### id

> **id**: `string`

Defined in: [packages/core/src/types.ts:525](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L525)

***

### memory

> **memory**: [`InferContextMemory`](./InferContextMemory.md)\<`TContext`\>

Defined in: [packages/core/src/types.ts:530](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L530)

***

### options

> **options**: [`InferContextOptions`](./InferContextOptions.md)\<`TContext`\>

Defined in: [packages/core/src/types.ts:528](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L528)

***

### settings

> **settings**: [`ContextSettings`](./ContextSettings.md)

Defined in: [packages/core/src/types.ts:529](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L529)

***

### workingMemory

> **workingMemory**: [`WorkingMemory`](./WorkingMemory.md)

Defined in: [packages/core/src/types.ts:531](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L531)
