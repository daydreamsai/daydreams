---
title: "InferActionArguments"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / InferActionArguments

# Type Alias: InferActionArguments\<TSchema\>

> **InferActionArguments**\<`TSchema`\> = `TSchema` *extends* `ZodRawShape` ? `z.infer`\<`ZodObject`\<`TSchema`\>\> : `TSchema` *extends* `z.ZodObject` ? `z.infer`\<`TSchema`\> : `TSchema` *extends* `Schema` ? `TSchema`\[`"_type"`\] : `undefined`

Defined in: [packages/core/src/types.ts:71](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L71)

Infers the argument type from an action schema

## Type Parameters

### TSchema

`TSchema` = `undefined`

The schema type to infer from
