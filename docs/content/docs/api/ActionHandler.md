---
title: "ActionHandler"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / ActionHandler

# Type Alias: ActionHandler\<Schema, Result, TContext, TAgent, TMemory\>

> **ActionHandler**\<`Schema`, `Result`, `TContext`, `TAgent`, `TMemory`\> = `Schema` *extends* `undefined` ? (`ctx`, `agent`) => [`MaybePromise`](./MaybePromise.md)\<`Result`\> : (`args`, `ctx`, `agent`) => [`MaybePromise`](./MaybePromise.md)\<`Result`\>

Defined in: [packages/core/src/types.ts:136](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L136)

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
