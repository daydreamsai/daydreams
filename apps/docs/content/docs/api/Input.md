---
title: "Input"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / Input

# Type Alias: Input\<Schema, TContext, TAgent\>

> **Input**\<`Schema`, `TContext`, `TAgent`\> = `object`

Defined in: [packages/core/src/types.ts:321](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L321)

Represents an input handler with validation and subscription capability

## Template

Context type for input handling

## Type Parameters

### Schema

`Schema` *extends* `z.ZodObject` \| `z.ZodString` \| `z.ZodRawShape` = `z.ZodObject` \| `z.ZodString` \| `z.ZodRawShape`

Zod schema for input parameters

### TContext

`TContext` *extends* [`AnyContext`](./AnyContext.md) = [`AnyContext`](./AnyContext.md)

### TAgent

`TAgent` *extends* [`AnyAgent`](./AnyAgent.md) = [`AnyAgent`](./AnyAgent.md)

## Properties

### context?

> `optional` **context**: `TContext`

Defined in: [packages/core/src/types.ts:332](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L332)

***

### description?

> `optional` **description**: `string`

Defined in: [packages/core/src/types.ts:330](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L330)

***

### enabled()?

> `optional` **enabled**: (`state`) => `Promise`\<`boolean`\> \| `boolean`

Defined in: [packages/core/src/types.ts:335](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L335)

#### Parameters

##### state

[`AgentContext`](./AgentContext.md)\<`TContext`\>

#### Returns

`Promise`\<`boolean`\> \| `boolean`

***

### format()?

> `optional` **format**: (`ref`) => `string` \| `string`[] \| [`XMLElement`](./XMLElement.md)

Defined in: [packages/core/src/types.ts:341](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L341)

#### Parameters

##### ref

[`InputRef`](./InputRef.md)\<[`InferSchemaArguments`](./InferSchemaArguments.md)\<`Schema`\>\>

#### Returns

`string` \| `string`[] \| [`XMLElement`](./XMLElement.md)

***

### handler()?

> `optional` **handler**: (`data`, `ctx`, `agent`) => [`MaybePromise`](./MaybePromise.md)\<`Pick`\<[`InputRef`](./InputRef.md), `"params"` \| `"data"`\>\>

Defined in: [packages/core/src/types.ts:336](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L336)

#### Parameters

##### data

[`InferSchemaArguments`](./InferSchemaArguments.md)\<`Schema`\>

##### ctx

[`AgentContext`](./AgentContext.md)\<`TContext`\>

##### agent

`TAgent`

#### Returns

[`MaybePromise`](./MaybePromise.md)\<`Pick`\<[`InputRef`](./InputRef.md), `"params"` \| `"data"`\>\>

***

### install()?

> `optional` **install**: (`agent`) => [`MaybePromise`](./MaybePromise.md)\<`void`\>

Defined in: [packages/core/src/types.ts:334](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L334)

#### Parameters

##### agent

`TAgent`

#### Returns

[`MaybePromise`](./MaybePromise.md)\<`void`\>

***

### schema?

> `optional` **schema**: `Schema`

Defined in: [packages/core/src/types.ts:331](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L331)

***

### subscribe()?

> `optional` **subscribe**: (`send`, `agent`) => () => `void` \| `void` \| `Promise`\<`void` \| () => `void`\>

Defined in: [packages/core/src/types.ts:344](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L344)

#### Parameters

##### send

\<`TContext`\>(`context`, `args`, `data`) => [`MaybePromise`](./MaybePromise.md)\<`void`\>

##### agent

`TAgent`

#### Returns

() => `void` \| `void` \| `Promise`\<`void` \| () => `void`\>

***

### type

> **type**: `string`

Defined in: [packages/core/src/types.ts:329](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L329)
