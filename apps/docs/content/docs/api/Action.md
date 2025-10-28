---
title: "Action"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / Action

# Interface: Action\<Schema, Result, TError, TContext, TAgent, TState\>

Defined in: [packages/core/src/types.ts:141](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L141)

Represents an action that can be executed with typed parameters

## Template

Context type for the action execution

## Type Parameters

### Schema

`Schema` *extends* [`ActionSchema`](./ActionSchema.md) = [`ActionSchema`](./ActionSchema.md)

Zod schema defining parameter types

### Result

`Result` = `any`

Return type of the action

### TError

`TError` = `unknown`

### TContext

`TContext` *extends* [`AnyContext`](./AnyContext.md) = [`AnyContext`](./AnyContext.md)

### TAgent

`TAgent` *extends* [`AnyAgent`](./AnyAgent.md) = [`AnyAgent`](./AnyAgent.md)

### TState

`TState` *extends* [`ActionState`](./ActionState.md) = [`ActionState`](./ActionState.md)

## Properties

### actionState?

> `optional` **actionState**: `TState`

Defined in: [packages/core/src/types.ts:157](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L157)

***

### attributes?

> `optional` **attributes**: [`ActionSchema`](./ActionSchema.md)

Defined in: [packages/core/src/types.ts:155](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L155)

***

### callFormat?

> `optional` **callFormat**: `"json"` \| `"xml"`

Defined in: [packages/core/src/types.ts:202](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L202)

***

### context?

> `optional` **context**: `TContext`

Defined in: [packages/core/src/types.ts:171](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L171)

***

### description?

> `optional` **description**: `string`

Defined in: [packages/core/src/types.ts:150](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L150)

***

### enabled()?

> `optional` **enabled**: (`ctx`) => `boolean`

Defined in: [packages/core/src/types.ts:161](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L161)

#### Parameters

##### ctx

[`ActionContext`](./ActionContext.md)\<`TContext`, [`InferAgentContext`](./InferAgentContext.md)\<`TAgent`\>, `TState`\>

#### Returns

`boolean`

***

### examples?

> `optional` **examples**: `string`[]

Defined in: [packages/core/src/types.ts:198](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L198)

***

### format()?

> `optional` **format**: (`result`) => `string` \| `string`[]

Defined in: [packages/core/src/types.ts:169](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L169)

#### Parameters

##### result

[`ActionResult`](./ActionResult.md)\<`Result`\>

#### Returns

`string` \| `string`[]

***

### handler

> **handler**: [`ActionHandler`](./ActionHandler.md)\<`Schema`, `Result`, `TContext`, `TAgent`, `TState`\>

Defined in: [packages/core/src/types.ts:165](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L165)

***

### install()?

> `optional` **install**: (`agent`) => `void` \| `Promise`\<`void`\>

Defined in: [packages/core/src/types.ts:159](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L159)

#### Parameters

##### agent

`TAgent`

#### Returns

`void` \| `Promise`\<`void`\>

***

### instructions?

> `optional` **instructions**: `string`

Defined in: [packages/core/src/types.ts:151](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L151)

***

### name

> **name**: `string`

Defined in: [packages/core/src/types.ts:149](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L149)

***

### onError()?

> `optional` **onError**: (`err`, `ctx`, `agent`) => `any`

Defined in: [packages/core/src/types.ts:181](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L181)

#### Parameters

##### err

`TError`

##### ctx

[`ActionCallContext`](./ActionCallContext.md)\<`Schema`, `TContext`, [`InferAgentContext`](./InferAgentContext.md)\<`TAgent`\>, `TState`\>

##### agent

`TAgent`

#### Returns

`any`

***

### onSuccess()?

> `optional` **onSuccess**: (`result`, `ctx`, `agent`) => `void` \| `Promise`\<`void`\>

Defined in: [packages/core/src/types.ts:173](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L173)

#### Parameters

##### result

[`ActionResult`](./ActionResult.md)\<`Result`\>

##### ctx

[`ActionCallContext`](./ActionCallContext.md)\<`Schema`, `TContext`, [`InferAgentContext`](./InferAgentContext.md)\<`TAgent`\>, `TState`\>

##### agent

`TAgent`

#### Returns

`void` \| `Promise`\<`void`\>

***

### parser()?

> `optional` **parser**: (`ref`) => [`InferActionArguments`](./InferActionArguments.md)\<`Schema`\>

Defined in: [packages/core/src/types.ts:200](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L200)

#### Parameters

##### ref

[`ActionCall`](./ActionCall.md)

#### Returns

[`InferActionArguments`](./InferActionArguments.md)\<`Schema`\>

***

### queueKey?

> `optional` **queueKey**: `string` \| (`ctx`) => `string`

Defined in: [packages/core/src/types.ts:187](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L187)

***

### retry?

> `optional` **retry**: `number` \| `boolean` \| (`failureCount`, `error`) => `boolean`

Defined in: [packages/core/src/types.ts:179](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L179)

***

### returns?

> `optional` **returns**: [`ActionSchema`](./ActionSchema.md)

Defined in: [packages/core/src/types.ts:167](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L167)

***

### schema

> **schema**: `Schema`

Defined in: [packages/core/src/types.ts:153](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L153)

***

### templateResolver?

> `optional` **templateResolver**: `boolean` \| (`key`, `path`, `ctx`) => [`MaybePromise`](./MaybePromise.md)\<`string`\>

Defined in: [packages/core/src/types.ts:204](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L204)
