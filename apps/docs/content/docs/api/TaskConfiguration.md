---
title: "TaskConfiguration"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / TaskConfiguration

# Type Alias: TaskConfiguration

> **TaskConfiguration** = `object`

Defined in: [packages/core/src/types.ts:853](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L853)

Configuration for task execution behavior

## Properties

### concurrency?

> `optional` **concurrency**: `object`

Defined in: [packages/core/src/types.ts:854](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L854)

#### default?

> `optional` **default**: `number`

Default concurrency for TaskRunner main queue (default: 3)

#### llm?

> `optional` **llm**: `number`

Max concurrent LLM calls across all contexts (default: 3)

***

### priority?

> `optional` **priority**: `object`

Defined in: [packages/core/src/types.ts:860](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L860)

#### default?

> `optional` **default**: `number`

Default priority for agent runs (default: 10)

#### high?

> `optional` **high**: `number`

High priority for urgent operations

#### low?

> `optional` **low**: `number`

Low priority for background tasks
