---
title: "Resolver"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / Resolver

# Type Alias: Resolver\<Result, Ctx\>

> **Resolver**\<`Result`, `Ctx`\> = `Result` \| (`ctx`) => `Result`

Defined in: [packages/core/src/types.ts:1110](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1110)

Type that can be either a static value or a function that computes the value from context

## Type Parameters

### Result

`Result`

The type of the resolved value

### Ctx

`Ctx`

The context type passed to the resolver function
