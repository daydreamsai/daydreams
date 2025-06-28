---
title: "Pretty"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / Pretty

# Type Alias: Pretty\<type\>

> **Pretty**\<`type`\> = `{ [key in keyof type]: type[key] }` & `unknown`

Defined in: [packages/core/src/types.ts:536](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L536)

Utility type to flatten and preserve type information for better TypeScript inference

## Type Parameters

### type

`type`

The type to make pretty
