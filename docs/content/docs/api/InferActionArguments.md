---
title: "InferActionArguments"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / InferActionArguments

# Type Alias: InferActionArguments\<TSchema\>

> **InferActionArguments**\<`TSchema`\> = `TSchema` *extends* `ZodRawShape` ? `z.infer`\<`ZodObject`\<`TSchema`\>\> : `TSchema` *extends* `z.ZodObject` ? `z.infer`\<`TSchema`\> : `TSchema` *extends* [`Schema`](./Schema.md) ? `TSchema`\[`"_type"`\] : `undefined`

Defined in: [packages/core/src/types.ts:99](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L99)

Infers the argument type from an action schema

## Type Parameters

### TSchema

`TSchema` = `undefined`

The schema type to infer from
