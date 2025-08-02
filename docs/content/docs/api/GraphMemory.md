---
title: "GraphMemory"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / GraphMemory

# Interface: GraphMemory

Defined in: [packages/core/src/memory/types.ts:402](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L402)

Graph Memory - stores entity relationships

## Methods

### addEntity()

> **addEntity**(`entity`): `Promise`\<`string`\>

Defined in: [packages/core/src/memory/types.ts:403](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L403)

#### Parameters

##### entity

[`Entity`](./Entity.md)

#### Returns

`Promise`\<`string`\>

***

### addRelationship()

> **addRelationship**(`relationship`): `Promise`\<`string`\>

Defined in: [packages/core/src/memory/types.ts:404](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L404)

#### Parameters

##### relationship

[`Relationship`](./Relationship.md)

#### Returns

`Promise`\<`string`\>

***

### findPath()

> **findPath**(`from`, `to`): `Promise`\<[`Entity`](./Entity.md)[]\>

Defined in: [packages/core/src/memory/types.ts:407](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L407)

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

Defined in: [packages/core/src/memory/types.ts:406](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L406)

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

Defined in: [packages/core/src/memory/types.ts:405](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L405)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<`null` \| [`Entity`](./Entity.md)\>

***

### removeEntity()

> **removeEntity**(`id`): `Promise`\<`boolean`\>

Defined in: [packages/core/src/memory/types.ts:409](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L409)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<`boolean`\>

***

### updateEntity()

> **updateEntity**(`id`, `updates`): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/types.ts:408](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/memory/types.ts#L408)

#### Parameters

##### id

`string`

##### updates

`Partial`\<[`Entity`](./Entity.md)\>

#### Returns

`Promise`\<`void`\>
