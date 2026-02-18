---
title: "ExtractTemplateVariables"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / ExtractTemplateVariables

# Type Alias: ExtractTemplateVariables\<T\>

> **ExtractTemplateVariables**\<`T`\> = `T` *extends* `` `${infer Start}{{${infer Var}}}${infer Rest}` `` ? `Var` \| `ExtractTemplateVariables`\<`Rest`\> : `never`

Defined in: [packages/core/src/types.ts:510](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L510)

Extracts variable names from a template string

## Type Parameters

### T

`T` *extends* `string`

Template string type
