---
title: "ExtractTemplateVariables"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / ExtractTemplateVariables

# Type Alias: ExtractTemplateVariables\<T\>

> **ExtractTemplateVariables**\<`T`\> = `T` *extends* `` `${infer Start}{{${infer Var}}}${infer Rest}` `` ? `Var` \| `ExtractTemplateVariables`\<`Rest`\> : `never`

Defined in: [packages/core/src/types.ts:542](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L542)

Extracts variable names from a template string

## Type Parameters

### T

`T` *extends* `string`

Template string type
