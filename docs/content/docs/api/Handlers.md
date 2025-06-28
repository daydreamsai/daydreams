---
title: "Handlers"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / Handlers

# Interface: Handlers

Defined in: [packages/core/src/types.ts:591](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L591)

Event handlers for agent operations

## Properties

### onLogStream()

> **onLogStream**: (`log`, `done`) => `void`

Defined in: [packages/core/src/types.ts:593](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L593)

Handler for streaming log events

#### Parameters

##### log

[`AnyRef`](./AnyRef.md)

##### done

`boolean`

#### Returns

`void`

***

### onThinking()

> **onThinking**: (`thought`) => `void`

Defined in: [packages/core/src/types.ts:595](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L595)

Handler for thinking/reasoning events

#### Parameters

##### thought

[`ThoughtRef`](./ThoughtRef.md)

#### Returns

`void`
