---
title: "Pretty"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / Pretty

# Type Alias: Pretty\<type\>

> **Pretty**\<`type`\> = `{ [key in keyof type]: type[key] }` & `unknown`

Defined in: [packages/core/src/types.ts:504](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L504)

Utility type to flatten and preserve type information for better TypeScript inference

## Type Parameters

### type

`type`

The type to make pretty
