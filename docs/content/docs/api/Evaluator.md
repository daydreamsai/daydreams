---
title: "Evaluator"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / Evaluator

# Type Alias: Evaluator\<Data, Context, TAgent\>

> **Evaluator**\<`Data`, `Context`, `TAgent`\> = `object`

Defined in: [packages/core/src/types.ts:69](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L69)

Represents an evaluator that can validate action/output results

## Type Parameters

### Data

`Data` = `any`

Type of data being evaluated

### Context

`Context` *extends* [`AgentContext`](./AgentContext.md)\<`any`\> = [`AgentContext`](./AgentContext.md)\<`any`\>

Context type for the evaluation

### TAgent

`TAgent` *extends* [`AnyAgent`](./AnyAgent.md) = [`AnyAgent`](./AnyAgent.md)

## Properties

### description?

> `optional` **description**: `string`

Defined in: [packages/core/src/types.ts:75](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L75)

***

### handler()?

> `optional` **handler**: (`data`, `ctx`, `agent`) => `Promise`\<`boolean`\> \| `boolean`

Defined in: [packages/core/src/types.ts:81](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L81)

Custom handler for evaluation logic

#### Parameters

##### data

`Data`

##### ctx

`Context`

##### agent

`TAgent`

#### Returns

`Promise`\<`boolean`\> \| `boolean`

***

### name

> **name**: `string`

Defined in: [packages/core/src/types.ts:74](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L74)

***

### onFailure()?

> `optional` **onFailure**: (`ctx`, `agent`) => `Promise`\<`void`\> \| `void`

Defined in: [packages/core/src/types.ts:87](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L87)

Optional callback when evaluation fails

#### Parameters

##### ctx

`Context`

##### agent

`TAgent`

#### Returns

`Promise`\<`void`\> \| `void`

***

### prompt?

> `optional` **prompt**: `string`

Defined in: [packages/core/src/types.ts:79](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L79)

Custom prompt template for LLM-based evaluation

***

### schema?

> `optional` **schema**: `z.ZodType`\<`any`\>

Defined in: [packages/core/src/types.ts:77](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L77)

Schema for the evaluation result
