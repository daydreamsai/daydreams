---
title: "InferSchemaArguments"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / InferSchemaArguments

# Type Alias: InferSchemaArguments\<Schema\>

> **InferSchemaArguments**\<`Schema`\> = `Schema` *extends* `ZodRawShape` ? `z.infer`\<`ZodObject`\<`Schema`\>\> : `Schema` *extends* `z.ZodTypeAny` ? `z.infer`\<`Schema`\> : `never`

Defined in: [packages/core/src/types.ts:1010](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1010)

Infers the argument type from a schema definition

## Type Parameters

### Schema

`Schema` = `undefined`

The schema to infer arguments from
