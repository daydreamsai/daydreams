---
title: "MemoryExtractor"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / MemoryExtractor

# Class: MemoryExtractor

Defined in: [packages/core/src/memory/extractor.ts:4](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/extractor.ts#L4)

## Constructors

### Constructor

> **new MemoryExtractor**(`memory`, `model?`): `MemoryExtractor`

Defined in: [packages/core/src/memory/extractor.ts:5](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/extractor.ts#L5)

#### Parameters

##### memory

[`Memory`](./Memory.md)

##### model?

[`LanguageModelV1`](./LanguageModelV1.md)

#### Returns

`MemoryExtractor`

## Methods

### extract()

> **extract**(`content`, `context`): `Promise`\<[`ExtractedMemories`](./ExtractedMemories.md)\>

Defined in: [packages/core/src/memory/extractor.ts:10](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/extractor.ts#L10)

#### Parameters

##### content

`any`

##### context

`any`

#### Returns

`Promise`\<[`ExtractedMemories`](./ExtractedMemories.md)\>
