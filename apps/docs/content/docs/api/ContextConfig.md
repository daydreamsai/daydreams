---
title: "ContextConfig"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / ContextConfig

# Type Alias: ContextConfig\<TMemory, Args, Ctx, Actions, Events\>

> **ContextConfig**\<`TMemory`, `Args`, `Ctx`, `Actions`, `Events`\> = [`Optional`](./Optional.md)\<`Omit`\<[`Context`](./Context.md)\<`TMemory`, `Args`, `Ctx`, `Actions`, `Events`\>, keyof `ContextConfigApi`\>, `"actions"` \| `"events"` \| `"inputs"` \| `"outputs"`\>

Defined in: [packages/core/src/types.ts:1047](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L1047)

## Type Parameters

### TMemory

`TMemory` = `any`

### Args

`Args` *extends* `z.ZodTypeAny` \| `ZodRawShape` = `any`

### Ctx

`Ctx` = `any`

### Actions

`Actions` *extends* [`AnyAction`](./AnyAction.md)[] = [`AnyAction`](./AnyAction.md)[]

### Events

`Events` *extends* `Record`\<`string`, `z.ZodTypeAny` \| `z.ZodRawShape`\> = `Record`\<`string`, `z.ZodTypeAny` \| `z.ZodRawShape`\>
