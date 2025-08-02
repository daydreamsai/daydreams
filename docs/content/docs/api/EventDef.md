---
title: "EventDef"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / EventDef

# Type Alias: EventDef\<Schema\>

> **EventDef**\<`Schema`\> = `object`

Defined in: [packages/core/src/types.ts:1066](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1066)

Definition for an event type

## Type Parameters

### Schema

`Schema` *extends* `z.ZodTypeAny` \| `ZodRawShape` = `z.ZodTypeAny`

The schema type for event data

## Properties

### name

> **name**: `string`

Defined in: [packages/core/src/types.ts:1069](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1069)

Name of the event

***

### schema

> **schema**: `Schema`

Defined in: [packages/core/src/types.ts:1071](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1071)

Schema for validating event data
