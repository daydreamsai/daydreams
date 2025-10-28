---
title: "ActionHandler"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / ActionHandler

# Type Alias: ActionHandler\<Schema, Result, TContext, TAgent, TMemory\>

> **ActionHandler**\<`Schema`, `Result`, `TContext`, `TAgent`, `TMemory`\> = `Schema` *extends* `undefined` ? (`ctx`, `agent`) => [`MaybePromise`](./MaybePromise.md)\<`Result`\> : (`args`, `ctx`, `agent`) => [`MaybePromise`](./MaybePromise.md)\<`Result`\>

Defined in: [packages/core/src/types.ts:108](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L108)

## Type Parameters

### Schema

`Schema` *extends* [`ActionSchema`](./ActionSchema.md) = `undefined`

### Result

`Result` = `any`

### TContext

`TContext` *extends* [`AnyContext`](./AnyContext.md) = [`AnyContext`](./AnyContext.md)

### TAgent

`TAgent` *extends* [`AnyAgent`](./AnyAgent.md) = [`AnyAgent`](./AnyAgent.md)

### TMemory

`TMemory` *extends* [`ActionState`](./ActionState.md) = [`ActionState`](./ActionState.md)
