---
title: "InferAgentMemory"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / InferAgentMemory

# Type Alias: InferAgentMemory\<TAgent\>

> **InferAgentMemory**\<`TAgent`\> = [`InferContextMemory`](./InferContextMemory.md)\<[`InferAgentContext`](./InferAgentContext.md)\<`TAgent`\>\>

Defined in: [packages/core/src/types.ts:60](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L60)

Extracts the memory type from an Agent by inferring its context

## Type Parameters

### TAgent

`TAgent` *extends* [`AnyAgent`](./AnyAgent.md)

The agent type to extract memory from
