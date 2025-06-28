---
title: "Context"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / Context

# Interface: Context\<TMemory, Schema, Ctx, Actions, Events\>

Defined in: [packages/core/src/types.ts:1112](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1112)

## Extends

- `ContextConfigApi`\<`TMemory`, `Schema`, `Ctx`, `Actions`, `Events`\>

## Type Parameters

### TMemory

`TMemory` = `any`

### Schema

`Schema` *extends* `z.ZodTypeAny` \| `ZodRawShape` = `z.ZodTypeAny`

### Ctx

`Ctx` = `any`

### Actions

`Actions` *extends* [`AnyAction`](./AnyAction.md)[] = [`AnyAction`](./AnyAction.md)[]

### Events

`Events` *extends* `Record`\<`string`, `z.ZodTypeAny` \| `ZodRawShape`\> = `Record`\<`string`, `z.ZodTypeAny` \| `ZodRawShape`\>

## Properties

### \_\_composers?

> `optional` **\_\_composers**: `BaseContextComposer`\<`Context`\<`TMemory`, `Schema`, `Ctx`, `Actions`, `Events`\>\>[]

Defined in: [packages/core/src/types.ts:1220](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1220)

***

### \_\_templateResolvers?

> `optional` **\_\_templateResolvers**: `Record`\<`string`, [`TemplateResolver`](./TemplateResolver.md)\<[`AgentContext`](./AgentContext.md)\<`Context`\<`TMemory`, `Schema`, `Ctx`, `Actions`, `Events`\>\> & [`ContextStateApi`](./ContextStateApi.md)\<`Context`\<`TMemory`, `Schema`, `Ctx`, `Actions`, `Events`\>\>\>\>

Defined in: [packages/core/src/types.ts:1222](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1222)

***

### actions?

> `optional` **actions**: [`Resolver`](./Resolver.md)\<[`Action`](./Action.md)\<[`ActionSchema`](./ActionSchema.md), `any`, `unknown`, [`AnyContext`](./AnyContext.md), [`AnyAgent`](./AnyAgent.md), [`ActionState`](./ActionState.md)\>[], [`ContextState`](./ContextState.md)\<`Context`\<`TMemory`, `Schema`, `Ctx`, `Actions`, `Events`\>\>\>

Defined in: [packages/core/src/types.ts:1200](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1200)

***

### create()?

> `optional` **create**: (`params`, `agent`) => `TMemory` \| `Promise`\<`TMemory`\>

Defined in: [packages/core/src/types.ts:1137](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1137)

Optional function to create new memory for this context

#### Parameters

##### params

###### args

[`InferSchemaArguments`](./InferSchemaArguments.md)\<`Schema`\>

###### id

`string`

###### key?

`string`

###### options

`Ctx`

###### settings

[`ContextSettings`](./ContextSettings.md)

##### agent

[`AnyAgent`](./AnyAgent.md)

#### Returns

`TMemory` \| `Promise`\<`TMemory`\>

***

### description?

> `optional` **description**: [`Resolver`](./Resolver.md)\<`string` \| `string`[], [`ContextState`](./ContextState.md)\<`Context`\<`TMemory`, `Schema`, `Ctx`, `Actions`, `Events`\>\>\>

Defined in: [packages/core/src/types.ts:1152](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1152)

Optional description of this context

***

### episodeHooks?

> `optional` **episodeHooks**: [`EpisodeHooks`](./EpisodeHooks.md)\<`Context`\<`TMemory`, `Schema`, `Ctx`, `Actions`, `Events`\>\>

Defined in: [packages/core/src/types.ts:1198](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1198)

Episode detection and creation hooks for this context

***

### events?

> `optional` **events**: [`Resolver`](./Resolver.md)\<`Events`, [`ContextState`](./ContextState.md)\<`Context`\<`TMemory`, `Schema`, `Ctx`, `Actions`, `Events`\>\>\>

Defined in: [packages/core/src/types.ts:1202](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1202)

***

### inputs?

> `optional` **inputs**: [`Resolver`](./Resolver.md)\<`Record`\<`string`, [`InputConfig`](./InputConfig.md)\<`any`, `any`, [`AnyAgent`](./AnyAgent.md)\>\>, [`ContextState`](./ContextState.md)\<`Context`\<`TMemory`, `Schema`, `Ctx`, `Actions`, `Events`\>\>\>

Defined in: [packages/core/src/types.ts:1207](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1207)

A record of input configurations for the context.

***

### instructions?

> `optional` **instructions**: [`Resolver`](./Resolver.md)\<[`Instruction`](./Instruction.md), [`ContextState`](./ContextState.md)\<`Context`\<`TMemory`, `Schema`, `Ctx`, `Actions`, `Events`\>\>\>

Defined in: [packages/core/src/types.ts:1149](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1149)

Optional instructions for this context

***

### key()?

> `optional` **key**: (`args`) => `string`

Defined in: [packages/core/src/types.ts:1127](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1127)

Function to generate a unique key from context arguments

#### Parameters

##### args

[`InferSchemaArguments`](./InferSchemaArguments.md)\<`Schema`\>

#### Returns

`string`

***

### load()?

> `optional` **load**: (`id`, `params`) => `Promise`\<`null` \| `TMemory`\>

Defined in: [packages/core/src/types.ts:1155](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1155)

Optional function to load existing memory

#### Parameters

##### id

`string`

##### params

###### options

`Ctx`

###### settings

[`ContextSettings`](./ContextSettings.md)

#### Returns

`Promise`\<`null` \| `TMemory`\>

***

### loader()?

> `optional` **loader**: (`state`, `agent`) => `Promise`\<`void`\>

Defined in: [packages/core/src/types.ts:1191](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1191)

#### Parameters

##### state

[`ContextState`](./ContextState.md)\<`Context`\<`TMemory`, `Schema`, `Ctx`, `Actions`, `Events`\>\>

##### agent

[`AnyAgent`](./AnyAgent.md)

#### Returns

`Promise`\<`void`\>

***

### maxSteps?

> `optional` **maxSteps**: `number`

Defined in: [packages/core/src/types.ts:1193](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1193)

***

### maxWorkingMemorySize?

> `optional` **maxWorkingMemorySize**: `number`

Defined in: [packages/core/src/types.ts:1195](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1195)

***

### model?

> `optional` **model**: [`LanguageModelV1`](./LanguageModelV1.md)

Defined in: [packages/core/src/types.ts:1167](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1167)

***

### modelSettings?

> `optional` **modelSettings**: `object`

Defined in: [packages/core/src/types.ts:1169](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1169)

#### Index Signature

\[`key`: `string`\]: `any`

#### maxTokens?

> `optional` **maxTokens**: `number`

#### providerOptions?

> `optional` **providerOptions**: `Record`\<`string`, `any`\>

#### stopSequences?

> `optional` **stopSequences**: `string`[]

#### temperature?

> `optional` **temperature**: `number`

#### topK?

> `optional` **topK**: `number`

#### topP?

> `optional` **topP**: `number`

***

### onError()?

> `optional` **onError**: (`error`, `ctx`, `agent`) => `Promise`\<`void`\>

Defined in: [packages/core/src/types.ts:1185](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1185)

#### Parameters

##### error

`unknown`

##### ctx

[`AgentContext`](./AgentContext.md)\<`Context`\<`TMemory`, `Schema`, `Ctx`, `Actions`, `Events`\>\>

##### agent

[`AnyAgent`](./AnyAgent.md)

#### Returns

`Promise`\<`void`\>

***

### onRun()?

> `optional` **onRun**: (`ctx`, `agent`) => `Promise`\<`void`\>

Defined in: [packages/core/src/types.ts:1179](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1179)

#### Parameters

##### ctx

[`AgentContext`](./AgentContext.md)\<`Context`\<`TMemory`, `Schema`, `Ctx`, `Actions`, `Events`\>\>

##### agent

[`AnyAgent`](./AnyAgent.md)

#### Returns

`Promise`\<`void`\>

***

### onStep()?

> `optional` **onStep**: (`ctx`, `agent`) => `Promise`\<`void`\>

Defined in: [packages/core/src/types.ts:1181](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1181)

#### Parameters

##### ctx

[`AgentContext`](./AgentContext.md)\<`Context`\<`TMemory`, `Schema`, `Ctx`, `Actions`, `Events`\>\>

##### agent

[`AnyAgent`](./AnyAgent.md)

#### Returns

`Promise`\<`void`\>

***

### outputs?

> `optional` **outputs**: [`Resolver`](./Resolver.md)\<`Record`\<`string`, `Omit`\<[`Output`](./Output.md)\<`any`, `any`, [`AnyContext`](./AnyContext.md), `any`\>, `"type"`\>\>, [`ContextState`](./ContextState.md)\<`Context`\<`TMemory`, `Schema`, `Ctx`, `Actions`, `Events`\>\>\>

Defined in: [packages/core/src/types.ts:1215](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1215)

A record of output configurations for the context.

***

### render()?

> `optional` **render**: (`state`) => `string` \| `string`[] \| [`XMLElement`](./XMLElement.md) \| [`XMLElement`](./XMLElement.md)[] \| (`string` \| [`XMLElement`](./XMLElement.md))[]

Defined in: [packages/core/src/types.ts:1163](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1163)

Optional function to render memory state

#### Parameters

##### state

[`ContextState`](./ContextState.md)\<`Context`\<`TMemory`, `Schema`, `Ctx`, `Actions`, `Events`\>\>

#### Returns

`string` \| `string`[] \| [`XMLElement`](./XMLElement.md) \| [`XMLElement`](./XMLElement.md)[] \| (`string` \| [`XMLElement`](./XMLElement.md))[]

***

### save()?

> `optional` **save**: (`state`) => `Promise`\<`void`\>

Defined in: [packages/core/src/types.ts:1160](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1160)

Optional function to save memory state

#### Parameters

##### state

[`ContextState`](./ContextState.md)\<`Context`\<`TMemory`, `Schema`, `Ctx`, `Actions`, `Events`\>\>

#### Returns

`Promise`\<`void`\>

***

### schema?

> `optional` **schema**: `Schema`

Defined in: [packages/core/src/types.ts:1125](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1125)

Zod schema for validating context arguments

***

### setup()?

> `optional` **setup**: (`args`, `settings`, `agent`) => `Ctx` \| `Promise`\<`Ctx`\>

Defined in: [packages/core/src/types.ts:1130](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1130)

Setup function to initialize context data

#### Parameters

##### args

[`InferSchemaArguments`](./InferSchemaArguments.md)\<`Schema`\>

##### settings

[`ContextSettings`](./ContextSettings.md)

##### agent

[`AnyAgent`](./AnyAgent.md)

#### Returns

`Ctx` \| `Promise`\<`Ctx`\>

***

### shouldContinue()?

> `optional` **shouldContinue**: (`ctx`) => `boolean`

Defined in: [packages/core/src/types.ts:1183](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1183)

#### Parameters

##### ctx

[`AgentContext`](./AgentContext.md)\<`Context`\<`TMemory`, `Schema`, `Ctx`, `Actions`, `Events`\>\>

#### Returns

`boolean`

***

### type

> **type**: `string`

Defined in: [packages/core/src/types.ts:1123](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1123)

Unique type identifier for this context

## Methods

### setActions()

> **setActions**\<`TActions`\>(`actions`): `Context`\<`TMemory`, `Schema`, `Ctx`, `TActions`, `Events`\>

Defined in: [packages/core/src/types.ts:1027](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1027)

#### Type Parameters

##### TActions

`TActions` *extends* [`AnyActionWithContext`](./AnyActionWithContext.md)\<`Context`\<`TMemory`, `Schema`, `Ctx`, `any`, `Events`\>\>[]

#### Parameters

##### actions

`TActions`

#### Returns

`Context`\<`TMemory`, `Schema`, `Ctx`, `TActions`, `Events`\>

#### Inherited from

`ContextConfigApi.setActions`

***

### setInputs()

> **setInputs**\<`TSchemas`\>(`inputs`): `Context`\<`TMemory`, `Schema`, `Ctx`, `Actions`, `Events`\>

Defined in: [packages/core/src/types.ts:1034](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1034)

#### Type Parameters

##### TSchemas

`TSchemas` *extends* `Record`\<`string`, `Readonly`\<\{[`k`: `string`]: `$ZodType`\<`unknown`, `unknown`\>; \}\> \| `ZodString` \| `ZodObject`\<`$ZodLooseShape`, `$ZodObjectConfig`\>\>

#### Parameters

##### inputs

\{ \[K in string \| number \| symbol\]: InputConfig\<TSchemas\[K\], Context\<TMemory, Schema, Ctx, Actions, Events\>, AnyAgent\> \}

#### Returns

`Context`\<`TMemory`, `Schema`, `Ctx`, `Actions`, `Events`\>

#### Inherited from

`ContextConfigApi.setInputs`

***

### setOutputs()

> **setOutputs**\<`TSchemas`\>(`outputs`): `Context`\<`TMemory`, `Schema`, `Ctx`, `Actions`, `Events`\>

Defined in: [packages/core/src/types.ts:1043](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1043)

#### Type Parameters

##### TSchemas

`TSchemas` *extends* `Record`\<`string`, `Readonly`\<\{[`k`: `string`]: `$ZodType`\<`unknown`, `unknown`\>; \}\> \| `ZodString` \| `ZodObject`\<`$ZodLooseShape`, `$ZodObjectConfig`\>\>

#### Parameters

##### outputs

\{ \[K in string \| number \| symbol\]: OutputConfig\<TSchemas\[K\], any, Context\<TMemory, Schema, Ctx, Actions, Events\>, AnyAgent\> \}

#### Returns

`Context`\<`TMemory`, `Schema`, `Ctx`, `Actions`, `Events`\>

#### Inherited from

`ContextConfigApi.setOutputs`

***

### use()

> **use**\<`Refs`\>(`composer`): `Context`\<`TMemory`, `Schema`, `Ctx`, `Actions`, `Events`\>

Defined in: [packages/core/src/types.ts:1054](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L1054)

#### Type Parameters

##### Refs

`Refs` *extends* [`AnyContext`](./AnyContext.md)[]

#### Parameters

##### composer

`ContextComposer`\<`Context`\<`TMemory`, `Schema`, `Ctx`, `Actions`, `Events`\>, `Refs`\>

#### Returns

`Context`\<`TMemory`, `Schema`, `Ctx`, `Actions`, `Events`\>

#### Inherited from

`ContextConfigApi.use`
