---
title: "ContextsEventsRecord"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / ContextsEventsRecord

# Type Alias: ContextsEventsRecord\<T\>

> **ContextsEventsRecord**\<`T`\> = `{ [K in keyof T]: T[K]["schema"] }`

Defined in: [packages/core/src/types.ts:1078](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1078)

Maps event definitions to their schema types

## Type Parameters

### T

`T` *extends* `Record`\<`string`, [`EventDef`](./EventDef.md)\>

Record of event definitions
