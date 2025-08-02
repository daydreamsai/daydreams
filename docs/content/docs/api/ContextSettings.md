---
title: "ContextSettings"
---

[**@daydreamsai/core**](./api-reference.md)

---

[@daydreamsai/core](./api-reference.md) / ContextSettings

# Type Alias: ContextSettings

> **ContextSettings** = `object`

Defined in:
[packages/core/src/types.ts:1231](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1231)

Configuration settings for a context

## Properties

### maxSteps?

> `optional` **maxSteps**: `number`

Defined in:
[packages/core/src/types.ts:1235](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1235)

Maximum number of execution steps

---

### maxWorkingMemorySize?

> `optional` **maxWorkingMemorySize**: `number`

Defined in:
[packages/core/src/types.ts:1237](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1237)

Maximum size of working memory

---

### model?

> `optional` **model**: [`LanguageModel`](./LanguageModel.md)

Defined in:
[packages/core/src/types.ts:1233](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1233)

Language model to use for this context

---

### modelSettings?

> `optional` **modelSettings**: `object`

Defined in:
[packages/core/src/types.ts:1239](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1239)

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
