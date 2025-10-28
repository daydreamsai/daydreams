---
title: "TemplateResolver"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / TemplateResolver

# Type Alias: TemplateResolver()\<Ctx\>

> **TemplateResolver**\<`Ctx`\> = (`path`, `ctx`) => [`MaybePromise`](./MaybePromise.md)\<`any`\>

Defined in: [packages/core/src/types.ts:1286](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L1286)

Function type for resolving template variables in context

## Type Parameters

### Ctx

`Ctx` = `any`

The context type

## Parameters

### path

`string`

The path to the template variable

### ctx

`Ctx`

The context object

## Returns

[`MaybePromise`](./MaybePromise.md)\<`any`\>

The resolved value
