---
title: "ContextStateApi"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / ContextStateApi

# Interface: ContextStateApi\<TContext\>

Defined in: [packages/core/src/types.ts:1309](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1309)

API methods available on context state

## Extended by

- [`ActionCallContext`](./ActionCallContext.md)

## Type Parameters

### TContext

`TContext` *extends* [`AnyContext`](./AnyContext.md)

The context type

## Properties

### \_\_getRunResults()

> **\_\_getRunResults**: () => `Promise`\<[`ActionResult`](./ActionResult.md)\<`any`\>\>[]

Defined in: [packages/core/src/types.ts:1325](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1325)

Get pending action results

#### Returns

`Promise`\<[`ActionResult`](./ActionResult.md)\<`any`\>\>[]

***

### callAction()

> **callAction**: (`call`, `options?`) => `Promise`\<[`ActionResult`](./ActionResult.md)\<`any`\>\>

Defined in: [packages/core/src/types.ts:1316](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1316)

Call an action with optional configuration

#### Parameters

##### call

[`ActionCall`](./ActionCall.md)

##### options?

`Partial`\<\{ `queueKey?`: `string`; `templateResolvers?`: `Record`\<`string`, [`TemplateResolver`](./TemplateResolver.md)\<`any`\>\>; \}\>

#### Returns

`Promise`\<[`ActionResult`](./ActionResult.md)\<`any`\>\>

***

### emit

> **emit**: `ContextEventEmitter`\<`TContext`\>

Defined in: [packages/core/src/types.ts:1311](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1311)

Emit an event for this context

***

### push()

> **push**: (`log`) => `Promise`\<`any`\>

Defined in: [packages/core/src/types.ts:1313](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1313)

Push a log entry

#### Parameters

##### log

[`Log`](./Log.md)

#### Returns

`Promise`\<`any`\>
