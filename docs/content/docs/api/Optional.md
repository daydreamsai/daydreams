---
title: "Optional"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / Optional

# Type Alias: Optional\<T, K\>

> **Optional**\<`T`, `K`\> = `Omit`\<`T`, `K`\> & `Partial`\<`Pick`\<`T`, `K`\>\>

Defined in: [packages/core/src/types.ts:28](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L28)

Makes specified keys optional in a type

## Type Parameters

### T

`T`

The type to modify

### K

`K` *extends* keyof `T`

The keys to make optional
