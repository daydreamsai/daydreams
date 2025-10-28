---
title: "ContextLockManager"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / ContextLockManager

# Class: ContextLockManager

Defined in: [packages/core/src/memory/context-lock-manager.ts:5](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/context-lock-manager.ts#L5)

Context Lock Manager - Provides mutex-like locking for context operations
Prevents race conditions when multiple operations access the same context simultaneously

## Constructors

### Constructor

> **new ContextLockManager**(): `ContextLockManager`

#### Returns

`ContextLockManager`

## Methods

### acquireLock()

> **acquireLock**(`contextId`): `Promise`\<() => `void`\>

Defined in: [packages/core/src/memory/context-lock-manager.ts:14](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/context-lock-manager.ts#L14)

Acquire an exclusive lock for a context

#### Parameters

##### contextId

`string`

The context to lock

#### Returns

`Promise`\<() => `void`\>

Promise that resolves when lock is acquired

***

### clearAllLocks()

> **clearAllLocks**(): `void`

Defined in: [packages/core/src/memory/context-lock-manager.ts:76](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/context-lock-manager.ts#L76)

Clear all locks (should only be used for cleanup/testing)

#### Returns

`void`

***

### getLockedCount()

> **getLockedCount**(): `number`

Defined in: [packages/core/src/memory/context-lock-manager.ts:69](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/context-lock-manager.ts#L69)

Get count of currently locked contexts

#### Returns

`number`

Number of locked contexts

***

### isLocked()

> **isLocked**(`contextId`): `boolean`

Defined in: [packages/core/src/memory/context-lock-manager.ts:61](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/context-lock-manager.ts#L61)

Check if a context is currently locked

#### Parameters

##### contextId

`string`

Context to check

#### Returns

`boolean`

true if locked

***

### withLock()

> **withLock**\<`T`\>(`contextId`, `fn`): `Promise`\<`T`\>

Defined in: [packages/core/src/memory/context-lock-manager.ts:47](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/context-lock-manager.ts#L47)

Execute a function with exclusive context lock

#### Type Parameters

##### T

`T`

#### Parameters

##### contextId

`string`

Context to lock

##### fn

() => `T` \| `Promise`\<`T`\>

Function to execute while locked

#### Returns

`Promise`\<`T`\>

Result of the function
