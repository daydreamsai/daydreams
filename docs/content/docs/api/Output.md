---
title: "Output"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / Output

# Type Alias: Output\<Schema, Response, TContext, TAgent\>

> **Output**\<`Schema`, `Response`, `TContext`, `TAgent`\> = `object`

Defined in: [packages/core/src/types.ts:302](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L302)

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

Defined in: [packages/core/src/types.ts:313](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L313)

***

### context?

> `optional` **context**: `TContext`

Defined in: [packages/core/src/types.ts:314](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L314)

***

### description?

> `optional` **description**: `string`

Defined in: [packages/core/src/types.ts:309](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L309)

***

### enabled()?

> `optional` **enabled**: (`ctx`) => `boolean`

Defined in: [packages/core/src/types.ts:316](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L316)

#### Parameters

##### ctx

[`ContextState`](./ContextState.md)\<`TContext`\>

#### Returns

`boolean`

***

### evaluator?

> `optional` **evaluator**: [`Evaluator`](./Evaluator.md)\<[`OutputResponse`](./OutputResponse.md), [`AgentContext`](./AgentContext.md)\<[`Context`](./Context.md)\>, `TAgent`\>

Defined in: [packages/core/src/types.ts:326](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L326)

Optional evaluator for this specific output

***

### examples?

> `optional` **examples**: `string`[]

Defined in: [packages/core/src/types.ts:328](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L328)

***

### format()?

> `optional` **format**: (`res`) => `string` \| `string`[] \| [`XMLElement`](./XMLElement.md)

Defined in: [packages/core/src/types.ts:324](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L324)

#### Parameters

##### res

[`OutputRef`](./OutputRef.md)\<`Response`\[`"data"`\]\>

#### Returns

`string` \| `string`[] \| [`XMLElement`](./XMLElement.md)

***

### handler()?

> `optional` **handler**: (`data`, `ctx`, `agent`) => [`MaybePromise`](./MaybePromise.md)\<`Response` \| `Response`[]\>

Defined in: [packages/core/src/types.ts:317](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L317)

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

Defined in: [packages/core/src/types.ts:315](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L315)

#### Parameters

##### agent

`TAgent`

#### Returns

[`MaybePromise`](./MaybePromise.md)\<`void`\>

***

### instructions?

> `optional` **instructions**: `string`

Defined in: [packages/core/src/types.ts:310](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L310)

***

### required?

> `optional` **required**: `boolean`

Defined in: [packages/core/src/types.ts:311](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L311)

***

### schema?

> `optional` **schema**: `Schema`

Defined in: [packages/core/src/types.ts:312](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L312)

***

### type

> **type**: `string`

Defined in: [packages/core/src/types.ts:308](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L308)
