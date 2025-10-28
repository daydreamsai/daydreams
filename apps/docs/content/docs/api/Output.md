---
title: "Output"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / Output

# Type Alias: Output\<Schema, Response, TContext, TAgent\>

> **Output**\<`Schema`, `Response`, `TContext`, `TAgent`\> = `object`

Defined in: [packages/core/src/types.ts:272](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L272)

## Type Parameters

### Schema

`Schema` *extends* [`OutputSchema`](./OutputSchema.md) = [`OutputSchema`](./OutputSchema.md)

### Response

`Response` *extends* [`OutputRefResponse`](./OutputRefResponse.md) = [`OutputRefResponse`](./OutputRefResponse.md)

### TContext

`TContext` *extends* [`AnyContext`](./AnyContext.md) = [`AnyContext`](./AnyContext.md)

### TAgent

`TAgent` *extends* [`AnyAgent`](./AnyAgent.md) = [`AnyAgent`](./AnyAgent.md)

## Properties

### attributes?

> `optional` **attributes**: [`OutputSchema`](./OutputSchema.md)

Defined in: [packages/core/src/types.ts:283](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L283)

***

### context?

> `optional` **context**: `TContext`

Defined in: [packages/core/src/types.ts:284](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L284)

***

### description?

> `optional` **description**: `string`

Defined in: [packages/core/src/types.ts:279](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L279)

***

### enabled()?

> `optional` **enabled**: (`ctx`) => `boolean`

Defined in: [packages/core/src/types.ts:286](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L286)

#### Parameters

##### ctx

[`ContextState`](./ContextState.md)\<`TContext`\>

#### Returns

`boolean`

***

### examples?

> `optional` **examples**: `string`[]

Defined in: [packages/core/src/types.ts:296](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L296)

***

### format()?

> `optional` **format**: (`res`) => `string` \| `string`[] \| [`XMLElement`](./XMLElement.md)

Defined in: [packages/core/src/types.ts:294](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L294)

#### Parameters

##### res

[`OutputRef`](./OutputRef.md)\<`Response`\[`"data"`\]\>

#### Returns

`string` \| `string`[] \| [`XMLElement`](./XMLElement.md)

***

### handler()?

> `optional` **handler**: (`data`, `ctx`, `agent`) => [`MaybePromise`](./MaybePromise.md)\<`Response` \| `Response`[]\>

Defined in: [packages/core/src/types.ts:287](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L287)

#### Parameters

##### data

`InferOutputSchemaParams`\<`Schema`\>

##### ctx

[`ContextState`](./ContextState.md)\<`TContext`\> & `object`

##### agent

`TAgent`

#### Returns

[`MaybePromise`](./MaybePromise.md)\<`Response` \| `Response`[]\>

***

### install()?

> `optional` **install**: (`agent`) => [`MaybePromise`](./MaybePromise.md)\<`void`\>

Defined in: [packages/core/src/types.ts:285](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L285)

#### Parameters

##### agent

`TAgent`

#### Returns

[`MaybePromise`](./MaybePromise.md)\<`void`\>

***

### instructions?

> `optional` **instructions**: `string`

Defined in: [packages/core/src/types.ts:280](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L280)

***

### name

> **name**: `string`

Defined in: [packages/core/src/types.ts:278](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L278)

***

### required?

> `optional` **required**: `boolean`

Defined in: [packages/core/src/types.ts:281](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L281)

***

### schema?

> `optional` **schema**: `Schema`

Defined in: [packages/core/src/types.ts:282](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L282)
