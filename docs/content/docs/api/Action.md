---
title: "Action"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / Action

# Interface: Action\<Schema, Result, TError, TContext, TAgent, TState\>

Defined in: [packages/core/src/types.ts:169](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L169)

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

Defined in: [packages/core/src/types.ts:185](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L185)

***

### attributes?

> `optional` **attributes**: [`ActionSchema`](./ActionSchema.md)

Defined in: [packages/core/src/types.ts:183](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L183)

***

### callFormat?

> `optional` **callFormat**: `"json"` \| `"xml"`

Defined in: [packages/core/src/types.ts:232](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L232)

***

### context?

> `optional` **context**: `TContext`

Defined in: [packages/core/src/types.ts:201](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L201)

***

### description?

> `optional` **description**: `string`

Defined in: [packages/core/src/types.ts:178](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L178)

***

### enabled()?

> `optional` **enabled**: (`ctx`) => `boolean`

Defined in: [packages/core/src/types.ts:189](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L189)

#### Parameters

##### ctx

[`ActionContext`](./ActionContext.md)\<`TContext`, [`InferAgentContext`](./InferAgentContext.md)\<`TAgent`\>, `TState`\>

#### Returns

`boolean`

***

### evaluator?

> `optional` **evaluator**: [`Evaluator`](./Evaluator.md)\<`Result`, [`AgentContext`](./AgentContext.md)\<`TContext`\>, `TAgent`\>

Defined in: [packages/core/src/types.ts:199](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L199)

Optional evaluator for this specific action

***

### examples?

> `optional` **examples**: `string`[]

Defined in: [packages/core/src/types.ts:228](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L228)

***

### format()?

> `optional` **format**: (`result`) => `string` \| `string`[]

Defined in: [packages/core/src/types.ts:197](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L197)

#### Parameters

##### result

[`ActionResult`](./ActionResult.md)\<`Result`\>

#### Returns

`string` \| `string`[]

***

### handler

> **handler**: [`ActionHandler`](./ActionHandler.md)\<`Schema`, `Result`, `TContext`, `TAgent`, `TState`\>

Defined in: [packages/core/src/types.ts:193](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L193)

***

### install()?

> `optional` **install**: (`agent`) => `void` \| `Promise`\<`void`\>

Defined in: [packages/core/src/types.ts:187](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L187)

#### Parameters

##### agent

`TAgent`

#### Returns

`void` \| `Promise`\<`void`\>

***

### instructions?

> `optional` **instructions**: `string`

Defined in: [packages/core/src/types.ts:179](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L179)

***

### name

> **name**: `string`

Defined in: [packages/core/src/types.ts:177](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L177)

***

### onError()?

> `optional` **onError**: (`err`, `ctx`, `agent`) => `any`

Defined in: [packages/core/src/types.ts:211](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L211)

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

Defined in: [packages/core/src/types.ts:203](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L203)

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

Defined in: [packages/core/src/types.ts:230](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L230)

#### Parameters

##### ref

[`ActionCall`](./ActionCall.md)

#### Returns

[`InferActionArguments`](./InferActionArguments.md)\<`Schema`\>

***

### queueKey?

> `optional` **queueKey**: `string` \| (`ctx`) => `string`

Defined in: [packages/core/src/types.ts:217](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L217)

***

### retry?

> `optional` **retry**: `number` \| `boolean` \| (`failureCount`, `error`) => `boolean`

Defined in: [packages/core/src/types.ts:209](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L209)

***

### returns?

> `optional` **returns**: [`ActionSchema`](./ActionSchema.md)

Defined in: [packages/core/src/types.ts:195](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L195)

***

### schema

> **schema**: `Schema`

Defined in: [packages/core/src/types.ts:181](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L181)

***

### templateResolver?

> `optional` **templateResolver**: `boolean` \| (`key`, `path`, `ctx`) => [`MaybePromise`](./MaybePromise.md)\<`string`\>

Defined in: [packages/core/src/types.ts:234](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L234)
