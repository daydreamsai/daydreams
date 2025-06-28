---
title: "Registry"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / Registry

# Type Alias: Registry

> **Registry** = `object`

Defined in: [packages/core/src/types.ts:601](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L601)

Central registry for all agent components and resources

## Properties

### actions

> **actions**: `Map`\<`string`, [`AnyAction`](./AnyAction.md)\>

Defined in: [packages/core/src/types.ts:605](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L605)

Map of registered action types

***

### contexts

> **contexts**: `Map`\<`string`, [`AnyContext`](./AnyContext.md)\>

Defined in: [packages/core/src/types.ts:603](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L603)

Map of registered context types

***

### extensions

> **extensions**: `Map`\<`string`, [`Extension`](./Extension.md)\>

Defined in: [packages/core/src/types.ts:611](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L611)

Map of registered extensions

***

### inputs

> **inputs**: `Map`\<`string`, [`Input`](./Input.md)\>

Defined in: [packages/core/src/types.ts:607](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L607)

Map of registered input types

***

### models

> **models**: `Map`\<`string`, [`LanguageModelV1`](./LanguageModelV1.md)\>

Defined in: [packages/core/src/types.ts:615](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L615)

Map of registered language models

***

### outputs

> **outputs**: `Map`\<`string`, [`Output`](./Output.md)\>

Defined in: [packages/core/src/types.ts:609](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L609)

Map of registered output types

***

### prompts

> **prompts**: `Map`\<`string`, `string`\>

Defined in: [packages/core/src/types.ts:613](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L613)

Map of registered prompt templates
