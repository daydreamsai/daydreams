---
title: "Schema"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / Schema

# Type Alias: Schema\<OBJECT\>

> **Schema**\<`OBJECT`\> = `Validator`\<`OBJECT`\> & `object`

Defined in: node\_modules/.pnpm/@ai-sdk+ui-utils@1.2.11\_zod@3.25.23/node\_modules/@ai-sdk/ui-utils/dist/index.d.ts:749

## Type declaration

### \_type

> **\_type**: `OBJECT`

Schema type for inference.

### \[schemaSymbol\]

> **\[schemaSymbol\]**: `true`

Used to mark schemas so we can support both Zod and custom schemas.

### jsonSchema

> `readonly` **jsonSchema**: `JSONSchema7`

The JSON Schema for the schema. It is passed to the providers.

## Type Parameters

### OBJECT

`OBJECT` = `unknown`
