---
title: "GraphMemory"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / GraphMemory

# Interface: GraphMemory

Defined in: [packages/core/src/memory/types.ts:290](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L290)

Graph Memory - stores entity relationships

## Methods

### addEntity()

> **addEntity**(`entity`): `Promise`\<`string`\>

Defined in: [packages/core/src/memory/types.ts:291](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L291)

#### Parameters

##### entity

[`Entity`](./Entity.md)

#### Returns

`Promise`\<`string`\>

***

### addRelationship()

> **addRelationship**(`relationship`): `Promise`\<`string`\>

Defined in: [packages/core/src/memory/types.ts:292](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L292)

#### Parameters

##### relationship

[`Relationship`](./Relationship.md)

#### Returns

`Promise`\<`string`\>

***

### findPath()

> **findPath**(`from`, `to`): `Promise`\<[`Entity`](./Entity.md)[]\>

Defined in: [packages/core/src/memory/types.ts:295](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L295)

#### Parameters

##### from

`string`

##### to

`string`

#### Returns

`Promise`\<[`Entity`](./Entity.md)[]\>

***

### findRelated()

> **findRelated**(`entityId`, `relationshipType?`): `Promise`\<[`Entity`](./Entity.md)[]\>

Defined in: [packages/core/src/memory/types.ts:294](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L294)

#### Parameters

##### entityId

`string`

##### relationshipType?

`string`

#### Returns

`Promise`\<[`Entity`](./Entity.md)[]\>

***

### getEntity()

> **getEntity**(`id`): `Promise`\<`null` \| [`Entity`](./Entity.md)\>

Defined in: [packages/core/src/memory/types.ts:293](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L293)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<`null` \| [`Entity`](./Entity.md)\>

***

### removeEntity()

> **removeEntity**(`id`): `Promise`\<`boolean`\>

Defined in: [packages/core/src/memory/types.ts:297](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L297)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<`boolean`\>

***

### updateEntity()

> **updateEntity**(`id`, `updates`): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/types.ts:296](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/types.ts#L296)

#### Parameters

##### id

`string`

##### updates

`Partial`\<[`Entity`](./Entity.md)\>

#### Returns

`Promise`\<`void`\>
