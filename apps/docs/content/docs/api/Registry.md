---
title: "Registry"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / Registry

# Type Alias: Registry

> **Registry** = `object`

Defined in: [packages/core/src/types.ts:552](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L552)

Central registry for all agent components and resources

## Properties

### actions

> **actions**: `Map`\<`string`, [`AnyAction`](./AnyAction.md)\>

Defined in: [packages/core/src/types.ts:556](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L556)

Map of registered action types

***

### contexts

> **contexts**: `Map`\<`string`, [`AnyContext`](./AnyContext.md)\>

Defined in: [packages/core/src/types.ts:554](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L554)

Map of registered context types

***

### extensions

> **extensions**: `Map`\<`string`, [`Extension`](./Extension.md)\>

Defined in: [packages/core/src/types.ts:562](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L562)

Map of registered extensions

***

### inputs

> **inputs**: `Map`\<`string`, [`Input`](./Input.md)\>

Defined in: [packages/core/src/types.ts:558](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L558)

Map of registered input types

***

### models

> **models**: `Map`\<`string`, `LanguageModel`\>

Defined in: [packages/core/src/types.ts:566](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L566)

Map of registered language models

***

### outputs

> **outputs**: `Map`\<`string`, [`Output`](./Output.md)\>

Defined in: [packages/core/src/types.ts:560](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L560)

Map of registered output types

***

### prompts

> **prompts**: `Map`\<`string`, `string`\>

Defined in: [packages/core/src/types.ts:564](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L564)

Map of registered prompt templates
