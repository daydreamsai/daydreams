---
title: "ContextConfig"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / ContextConfig

# Type Alias: ContextConfig\<TMemory, Args, Ctx, Actions, Events\>

> **ContextConfig**\<`TMemory`, `Args`, `Ctx`, `Actions`, `Events`\> = [`Optional`](./Optional.md)\<`Omit`\<[`Context`](./Context.md)\<`TMemory`, `Args`, `Ctx`, `Actions`, `Events`\>, keyof `ContextConfigApi`\>, `"actions"` \| `"events"` \| `"inputs"` \| `"outputs"`\>

Defined in: [packages/core/src/types.ts:1082](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1082)

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
