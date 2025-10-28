---
title: "ContextSettings"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / ContextSettings

# Type Alias: ContextSettings

> **ContextSettings** = `object`

Defined in: [packages/core/src/types.ts:1217](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L1217)

Configuration settings for a context

## Properties

### maxSteps?

> `optional` **maxSteps**: `number`

Defined in: [packages/core/src/types.ts:1221](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L1221)

Maximum number of execution steps

***

### maxWorkingMemorySize?

> `optional` **maxWorkingMemorySize**: `number`

Defined in: [packages/core/src/types.ts:1223](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L1223)

Maximum size of working memory

***

### model?

> `optional` **model**: `LanguageModel`

Defined in: [packages/core/src/types.ts:1219](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L1219)

Language model to use for this context

***

### modelSettings?

> `optional` **modelSettings**: `object`

Defined in: [packages/core/src/types.ts:1225](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L1225)

Model-specific settings

#### Index Signature

\[`key`: `string`\]: `any`

#### maxTokens?

> `optional` **maxTokens**: `number`

#### providerOptions?

> `optional` **providerOptions**: `Record`\<`string`, `any`\>

#### stopSequences?

> `optional` **stopSequences**: `string`[]

#### temperature?

> `optional` **temperature**: `number`

#### topK?

> `optional` **topK**: `number`

#### topP?

> `optional` **topP**: `number`
