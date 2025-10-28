---
title: "Resolver"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / Resolver

# Type Alias: Resolver\<Result, Ctx\>

> **Resolver**\<`Result`, `Ctx`\> = `Result` \| (`ctx`) => `Result`

Defined in: [packages/core/src/types.ts:1075](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L1075)

Type that can be either a static value or a function that computes the value from context

## Type Parameters

### Result

`Result`

The type of the resolved value

### Ctx

`Ctx`

The context type passed to the resolver function
