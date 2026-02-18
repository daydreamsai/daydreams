---
title: "Handlers"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / Handlers

# Interface: Handlers

Defined in: [packages/core/src/types.ts:542](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L542)

Event handlers for agent operations

## Properties

### onLogStream()

> **onLogStream**: (`log`, `done`) => `void`

Defined in: [packages/core/src/types.ts:544](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L544)

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

Defined in: [packages/core/src/types.ts:546](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L546)

Handler for thinking/reasoning events

#### Parameters

##### thought

[`ThoughtRef`](./ThoughtRef.md)

#### Returns

`void`
