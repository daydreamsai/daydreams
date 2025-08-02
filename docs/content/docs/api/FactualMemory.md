---
title: "FactualMemory"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / FactualMemory

# Interface: FactualMemory

Defined in: [packages/core/src/memory/types.ts:293](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L293)

Factual Memory - stores verified facts

## Methods

### delete()

> **delete**(`id`, `contextId?`): `Promise`\<`boolean`\>

Defined in: [packages/core/src/memory/types.ts:302](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L302)

#### Parameters

##### id

`string`

##### contextId?

`string`

#### Returns

`Promise`\<`boolean`\>

***

### get()

> **get**(`id`, `contextId?`): `Promise`\<`null` \| [`Fact`](./Fact.md)\>

Defined in: [packages/core/src/memory/types.ts:295](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L295)

#### Parameters

##### id

`string`

##### contextId?

`string`

#### Returns

`Promise`\<`null` \| [`Fact`](./Fact.md)\>

***

### getByContext()

> **getByContext**(`contextId`): `Promise`\<[`Fact`](./Fact.md)[]\>

Defined in: [packages/core/src/memory/types.ts:304](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L304)

#### Parameters

##### contextId

`string`

#### Returns

`Promise`\<[`Fact`](./Fact.md)[]\>

***

### getByTag()

> **getByTag**(`tag`, `value`, `contextId?`): `Promise`\<[`Fact`](./Fact.md)[]\>

Defined in: [packages/core/src/memory/types.ts:303](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L303)

#### Parameters

##### tag

`string`

##### value

`string`

##### contextId?

`string`

#### Returns

`Promise`\<[`Fact`](./Fact.md)[]\>

***

### search()

> **search**(`query`, `options?`): `Promise`\<[`Fact`](./Fact.md)[]\>

Defined in: [packages/core/src/memory/types.ts:296](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L296)

#### Parameters

##### query

`string`

##### options?

[`SearchOptions`](./SearchOptions.md) & `object`

#### Returns

`Promise`\<[`Fact`](./Fact.md)[]\>

***

### store()

> **store**(`facts`): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/types.ts:294](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L294)

#### Parameters

##### facts

[`Fact`](./Fact.md) | [`Fact`](./Fact.md)[]

#### Returns

`Promise`\<`void`\>

***

### update()

> **update**(`id`, `updates`, `contextId?`): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/types.ts:301](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L301)

#### Parameters

##### id

`string`

##### updates

`Partial`\<[`Fact`](./Fact.md)\>

##### contextId?

`string`

#### Returns

`Promise`\<`void`\>

***

### verify()

> **verify**(`factId`, `contextId?`): `Promise`\<[`FactVerification`](./FactVerification.md)\>

Defined in: [packages/core/src/memory/types.ts:300](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L300)

#### Parameters

##### factId

`string`

##### contextId?

`string`

#### Returns

`Promise`\<[`FactVerification`](./FactVerification.md)\>
