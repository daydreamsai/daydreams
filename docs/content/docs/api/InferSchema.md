---
title: "InferSchema"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / InferSchema

# Type Alias: InferSchema\<T\>

> **InferSchema**\<`T`\> = `T` *extends* `object` ? `z.infer`\<`S`\> : `unknown`

Defined in: [packages/core/src/types.ts:40](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L40)

Infers the schema type from an object with an optional schema property

## Type Parameters

### T

`T`

The object type that may have a schema
