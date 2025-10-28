---
title: "EventDef"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / EventDef

# Type Alias: EventDef\<Schema\>

> **EventDef**\<`Schema`\> = `object`

Defined in: [packages/core/src/types.ts:1031](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L1031)

Definition for an event type

## Type Parameters

### Schema

`Schema` *extends* `z.ZodTypeAny` \| `ZodRawShape` = `z.ZodTypeAny`

The schema type for event data

## Properties

### name

> **name**: `string`

Defined in: [packages/core/src/types.ts:1034](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L1034)

Name of the event

***

### schema

> **schema**: `Schema`

Defined in: [packages/core/src/types.ts:1036](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L1036)

Schema for validating event data
