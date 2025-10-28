---
title: "InferSchemaArguments"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / InferSchemaArguments

# Type Alias: InferSchemaArguments\<Schema\>

> **InferSchemaArguments**\<`Schema`\> = `Schema` *extends* `ZodRawShape` ? `z.infer`\<`ZodObject`\<`Schema`\>\> : `Schema` *extends* `z.ZodTypeAny` ? `z.infer`\<`Schema`\> : `never`

Defined in: [packages/core/src/types.ts:975](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L975)

Infers the argument type from a schema definition

## Type Parameters

### Schema

`Schema` = `undefined`

The schema to infer arguments from
