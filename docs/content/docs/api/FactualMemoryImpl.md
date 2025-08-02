---
title: "FactualMemoryImpl"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / FactualMemoryImpl

# Class: FactualMemoryImpl

Defined in: [packages/core/src/memory/factual-memory.ts:9](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/factual-memory.ts#L9)

Factual Memory - stores verified facts

## Implements

- [`FactualMemory`](./FactualMemory.md)

## Constructors

### Constructor

> **new FactualMemoryImpl**(`memory`): `FactualMemoryImpl`

Defined in: [packages/core/src/memory/factual-memory.ts:10](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/factual-memory.ts#L10)

#### Parameters

##### memory

[`Memory`](./Memory.md)

#### Returns

`FactualMemoryImpl`

## Methods

### delete()

> **delete**(`id`, `contextId?`): `Promise`\<`boolean`\>

Defined in: [packages/core/src/memory/factual-memory.ts:188](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/factual-memory.ts#L188)

#### Parameters

##### id

`string`

##### contextId?

`string`

#### Returns

`Promise`\<`boolean`\>

#### Implementation of

[`FactualMemory`](./FactualMemory.md).[`delete`](FactualMemory.md#delete)

***

### get()

> **get**(`id`, `contextId?`): `Promise`\<`null` \| [`Fact`](./Fact.md)\>

Defined in: [packages/core/src/memory/factual-memory.ts:66](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/factual-memory.ts#L66)

#### Parameters

##### id

`string`

##### contextId?

`string`

#### Returns

`Promise`\<`null` \| [`Fact`](./Fact.md)\>

#### Implementation of

[`FactualMemory`](./FactualMemory.md).[`get`](FactualMemory.md#get)

***

### getByContext()

> **getByContext**(`contextId`): `Promise`\<[`Fact`](./Fact.md)[]\>

Defined in: [packages/core/src/memory/factual-memory.ts:272](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/factual-memory.ts#L272)

#### Parameters

##### contextId

`string`

#### Returns

`Promise`\<[`Fact`](./Fact.md)[]\>

#### Implementation of

[`FactualMemory`](./FactualMemory.md).[`getByContext`](FactualMemory.md#getbycontext)

***

### getByTag()

> **getByTag**(`tag`, `value`, `contextId?`): `Promise`\<[`Fact`](./Fact.md)[]\>

Defined in: [packages/core/src/memory/factual-memory.ts:227](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/factual-memory.ts#L227)

#### Parameters

##### tag

`string`

##### value

`string`

##### contextId?

`string`

#### Returns

`Promise`\<[`Fact`](./Fact.md)[]\>

#### Implementation of

[`FactualMemory`](./FactualMemory.md).[`getByTag`](FactualMemory.md#getbytag)

***

### search()

> **search**(`query`, `options?`): `Promise`\<[`Fact`](./Fact.md)[]\>

Defined in: [packages/core/src/memory/factual-memory.ts:81](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/factual-memory.ts#L81)

#### Parameters

##### query

`string`

##### options?

[`SearchOptions`](./SearchOptions.md) & `object`

#### Returns

`Promise`\<[`Fact`](./Fact.md)[]\>

#### Implementation of

[`FactualMemory`](./FactualMemory.md).[`search`](FactualMemory.md#search)

***

### store()

> **store**(`facts`): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/factual-memory.ts:12](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/factual-memory.ts#L12)

#### Parameters

##### facts

[`Fact`](./Fact.md) | [`Fact`](./Fact.md)[]

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`FactualMemory`](./FactualMemory.md).[`store`](FactualMemory.md#store)

***

### update()

> **update**(`id`, `updates`, `contextId?`): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/factual-memory.ts:180](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/factual-memory.ts#L180)

#### Parameters

##### id

`string`

##### updates

`Partial`\<[`Fact`](./Fact.md)\>

##### contextId?

`string`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`FactualMemory`](./FactualMemory.md).[`update`](FactualMemory.md#update)

***

### verify()

> **verify**(`factId`, `contextId?`): `Promise`\<[`FactVerification`](./FactVerification.md)\>

Defined in: [packages/core/src/memory/factual-memory.ts:113](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/factual-memory.ts#L113)

#### Parameters

##### factId

`string`

##### contextId?

`string`

#### Returns

`Promise`\<[`FactVerification`](./FactVerification.md)\>

#### Implementation of

[`FactualMemory`](./FactualMemory.md).[`verify`](FactualMemory.md#verify)
