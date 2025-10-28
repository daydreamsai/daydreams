---
title: "InferSchema"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / InferSchema

# Type Alias: InferSchema\<T\>

> **InferSchema**\<`T`\> = `T` *extends* `object` ? `z.infer`\<`S`\> : `unknown`

Defined in: [packages/core/src/types.ts:38](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L38)

Infers the schema type from an object with an optional schema property

## Type Parameters

### T

`T`

The object type that may have a schema
