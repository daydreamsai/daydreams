---
title: "InferAgentContext"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / InferAgentContext

# Type Alias: InferAgentContext\<TAgent\>

> **InferAgentContext**\<`TAgent`\> = `TAgent` *extends* [`Agent`](./Agent.md)\<infer Content\> ? `Content` : `never`

Defined in: [packages/core/src/types.ts:50](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L50)

Extracts the context type from an Agent type

## Type Parameters

### TAgent

`TAgent` *extends* [`AnyAgent`](./AnyAgent.md)

The agent type to extract context from
