---
title: "TemplateVariables"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / TemplateVariables

# Type Alias: TemplateVariables\<T, V\>

> **TemplateVariables**\<`T`, `V`\> = `{ [K in ExtractTemplateVariables<T>]: any }`

Defined in: [packages/core/src/types.ts:552](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L552)

Creates a type mapping template variables (including nested paths) to values

## Type Parameters

### T

`T` *extends* `string`

Template string type

### V

`V` = `any`

Value type at the leaf (defaults to string)
