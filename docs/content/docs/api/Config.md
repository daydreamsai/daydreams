---
title: "Config"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / Config

# Type Alias: Config\<TContext\>

> **Config**\<`TContext`\> = `Partial`\<`AgentDef`\<`TContext`\>\> & `object`

Defined in: [packages/core/src/types.ts:886](https://github.com/dojoengine/daydreams/blob/95678f46ea3908883ec80d853a28c9f23ca4f5c2/packages/core/src/types.ts#L886)

## Type declaration

### contexts?

> `optional` **contexts**: [`AnyContext`](./AnyContext.md)[]

### exportTrainingData?

> `optional` **exportTrainingData**: `boolean`

Whether to export training data for episodes

### extensions?

> `optional` **extensions**: [`Extension`](./Extension.md)\<`TContext`\>[]

### logLevel?

> `optional` **logLevel**: [`LogLevel`](./LogLevel.md)

### model?

> `optional` **model**: [`Agent`](./Agent.md)\[`"model"`\]

### modelSettings?

> `optional` **modelSettings**: `object`

#### Index Signature

\[`key`: `string`\]: `any`

#### modelSettings.maxTokens?

> `optional` **maxTokens**: `number`

#### modelSettings.providerOptions?

> `optional` **providerOptions**: `Record`\<`string`, `any`\>

#### modelSettings.stopSequences?

> `optional` **stopSequences**: `string`[]

#### modelSettings.temperature?

> `optional` **temperature**: `number`

#### modelSettings.topK?

> `optional` **topK**: `number`

#### modelSettings.topP?

> `optional` **topP**: `number`

### services?

> `optional` **services**: `ServiceProvider`[]

### streaming?

> `optional` **streaming**: `boolean`

### tasks?

> `optional` **tasks**: [`TaskConfiguration`](./TaskConfiguration.md)

Task execution configuration

### trainingDataPath?

> `optional` **trainingDataPath**: `string`

Path to save training data

## Type Parameters

### TContext

`TContext` *extends* [`AnyContext`](./AnyContext.md) = [`AnyContext`](./AnyContext.md)
