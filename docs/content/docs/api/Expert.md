---
title: "Expert"
---

[**@daydreamsai/core**](./api-reference.md)

---

[@daydreamsai/core](./api-reference.md) / Expert

# Type Alias: Expert

> **Expert** = `object`

Defined in:
[packages/core/src/types.ts:559](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L559)

Represents an expert system with specialized knowledge and capabilities

## Properties

### actions?

> `optional` **actions**: [`AnyAction`](./AnyAction.md)[]

Defined in:
[packages/core/src/types.ts:569](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L569)

Optional actions available to this expert

---

### description

> **description**: `string`

Defined in:
[packages/core/src/types.ts:563](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L563)

Description of the expert's domain and capabilities

---

### instructions

> **instructions**: `string`

Defined in:
[packages/core/src/types.ts:565](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L565)

Detailed instructions for the expert's behavior

---

### model?

> `optional` **model**: [`LanguageModel`](./LanguageModel.md)

Defined in:
[packages/core/src/types.ts:567](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L567)

Optional language model specific to this expert

---

### type

> **type**: `string`

Defined in:
[packages/core/src/types.ts:561](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L561)

Unique identifier for the expert type
