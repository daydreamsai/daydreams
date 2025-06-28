---
title: "TemplateResolver"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / TemplateResolver

# Type Alias: TemplateResolver()\<Ctx\>

> **TemplateResolver**\<`Ctx`\> = (`path`, `ctx`) => [`MaybePromise`](./MaybePromise.md)\<`any`\>

Defined in: [packages/core/src/types.ts:1300](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1300)

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
