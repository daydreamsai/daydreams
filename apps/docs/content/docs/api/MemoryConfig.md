---
title: "MemoryConfig"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / MemoryConfig

# Interface: MemoryConfig

Defined in: [packages/core/src/memory/types.ts:64](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L64)

Memory system configuration

## Properties

### logger?

> `optional` **logger**: `Logger`

Defined in: [packages/core/src/memory/types.ts:70](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L70)

***

### providers

> **providers**: `object`

Defined in: [packages/core/src/memory/types.ts:65](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L65)

#### graph

> **graph**: [`GraphProvider`](./GraphProvider.md)

#### kv

> **kv**: [`KeyValueProvider`](./KeyValueProvider.md)

#### vector

> **vector**: [`VectorProvider`](./VectorProvider.md)
