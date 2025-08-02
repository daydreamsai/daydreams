---
title: "ActionContext"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / ActionContext

# Interface: ActionContext\<TContext, AContext, ActionMemory\>

Defined in: [packages/core/src/types.ts:108](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L108)

## Extends

- [`AgentContext`](./AgentContext.md)\<`TContext`\>

## Extended by

- [`ActionCallContext`](./ActionCallContext.md)

## Type Parameters

### TContext

`TContext` *extends* [`AnyContext`](./AnyContext.md) = [`AnyContext`](./AnyContext.md)

### AContext

`AContext` *extends* [`AnyContext`](./AnyContext.md) = [`AnyContext`](./AnyContext.md)

### ActionMemory

`ActionMemory` *extends* [`ActionState`](./ActionState.md) = [`ActionState`](./ActionState.md)

## Properties

### abortSignal?

> `optional` **abortSignal**: `AbortSignal`

Defined in: [packages/core/src/types.ts:115](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L115)

***

### actionMemory

> **actionMemory**: [`InferActionState`](./InferActionState.md)\<`ActionMemory`\>

Defined in: [packages/core/src/types.ts:113](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L113)

***

### agentMemory

> **agentMemory**: `undefined` \| [`InferContextMemory`](./InferContextMemory.md)\<`AContext`\>

Defined in: [packages/core/src/types.ts:114](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L114)

***

### args

> **args**: [`InferSchemaArguments`](./InferSchemaArguments.md)\<`TContext`\[`"schema"`\]\>

Defined in: [packages/core/src/types.ts:575](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L575)

#### Inherited from

[`AgentContext`](./AgentContext.md).[`args`](AgentContext.md#args)

***

### context

> **context**: `TContext`

Defined in: [packages/core/src/types.ts:574](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L574)

#### Inherited from

[`AgentContext`](./AgentContext.md).[`context`](AgentContext.md#context)

***

### id

> **id**: `string`

Defined in: [packages/core/src/types.ts:573](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L573)

#### Inherited from

[`AgentContext`](./AgentContext.md).[`id`](AgentContext.md#id)

***

### memory

> **memory**: [`InferContextMemory`](./InferContextMemory.md)\<`TContext`\>

Defined in: [packages/core/src/types.ts:578](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L578)

#### Inherited from

[`AgentContext`](./AgentContext.md).[`memory`](AgentContext.md#memory)

***

### options

> **options**: [`InferContextOptions`](./InferContextOptions.md)\<`TContext`\>

Defined in: [packages/core/src/types.ts:576](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L576)

#### Inherited from

[`AgentContext`](./AgentContext.md).[`options`](AgentContext.md#options)

***

### requestContext?

> `optional` **requestContext**: `RequestContext`

Defined in: [packages/core/src/types.ts:580](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L580)

#### Inherited from

[`AgentContext`](./AgentContext.md).[`requestContext`](AgentContext.md#requestcontext)

***

### settings

> **settings**: [`ContextSettings`](./ContextSettings.md)

Defined in: [packages/core/src/types.ts:577](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L577)

#### Inherited from

[`AgentContext`](./AgentContext.md).[`settings`](AgentContext.md#settings)

***

### workingMemory

> **workingMemory**: [`WorkingMemory`](./WorkingMemory.md)

Defined in: [packages/core/src/types.ts:579](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L579)

#### Inherited from

[`AgentContext`](./AgentContext.md).[`workingMemory`](AgentContext.md#workingmemory)
