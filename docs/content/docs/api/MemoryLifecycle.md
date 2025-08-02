---
title: "MemoryLifecycle"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / MemoryLifecycle

# Interface: MemoryLifecycle

Defined in: [packages/core/src/memory/types.ts:454](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L454)

Memory lifecycle events

## Methods

### emit()

> **emit**(`event`, `data?`): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/types.ts:457](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L457)

#### Parameters

##### event

`string`

##### data?

`any`

#### Returns

`Promise`\<`void`\>

***

### off()

> **off**(`event`, `handler`): `void`

Defined in: [packages/core/src/memory/types.ts:456](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L456)

#### Parameters

##### event

`string`

##### handler

[`LifecycleHandler`](./LifecycleHandler.md)

#### Returns

`void`

***

### on()

> **on**(`event`, `handler`): `void`

Defined in: [packages/core/src/memory/types.ts:455](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L455)

#### Parameters

##### event

`string`

##### handler

[`LifecycleHandler`](./LifecycleHandler.md)

#### Returns

`void`
