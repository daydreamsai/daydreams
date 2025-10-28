---
title: "Context"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / Context

# Interface: Context\<TMemory, Schema, Ctx, Actions, Events\>

Defined in: [packages/core/src/types.ts:1077](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L1077)

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

Defined in: [packages/core/src/types.ts:1191](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L1191)

***

### \_\_templateResolvers?

> `optional` **\_\_templateResolvers**: `Record`\<`string`, [`TemplateResolver`](./TemplateResolver.md)\<[`AgentContext`](./AgentContext.md)\<`Context`\<`TMemory`, `Schema`, `Ctx`, `Actions`, `Events`\>\> & [`ContextStateApi`](./ContextStateApi.md)\<`Context`\<`TMemory`, `Schema`, `Ctx`, `Actions`, `Events`\>\>\>\>

Defined in: [packages/core/src/types.ts:1193](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L1193)

***

### actions?

> `optional` **actions**: [`Resolver`](./Resolver.md)\<[`Action`](./Action.md)\<[`ActionSchema`](./ActionSchema.md), `any`, `unknown`, [`AnyContext`](./AnyContext.md), [`AnyAgent`](./AnyAgent.md), [`ActionState`](./ActionState.md)\>[], [`ContextState`](./ContextState.md)\<`Context`\<`TMemory`, `Schema`, `Ctx`, `Actions`, `Events`\>\>\>

Defined in: [packages/core/src/types.ts:1165](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L1165)

***

### create()?

> `optional` **create**: (`params`, `agent`) => `TMemory` \| `Promise`\<`TMemory`\>

Defined in: [packages/core/src/types.ts:1102](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L1102)

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

Defined in: [packages/core/src/types.ts:1117](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L1117)

Optional description of this context

***

### episodeHooks?

> `optional` **episodeHooks**: [`EpisodeHooks`](./EpisodeHooks.md)\<`Context`\<`TMemory`, `Schema`, `Ctx`, `Actions`, `Events`\>\>

Defined in: [packages/core/src/types.ts:1163](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L1163)

Episode detection and creation hooks for this context

***

### events?

> `optional` **events**: [`Resolver`](./Resolver.md)\<`Events`, [`ContextState`](./ContextState.md)\<`Context`\<`TMemory`, `Schema`, `Ctx`, `Actions`, `Events`\>\>\>

Defined in: [packages/core/src/types.ts:1167](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L1167)

***

### inputs?

> `optional` **inputs**: [`Resolver`](./Resolver.md)\<`Record`\<`string`, [`InputConfig`](./InputConfig.md)\<`any`, `any`, [`AnyAgent`](./AnyAgent.md)\>\>, [`ContextState`](./ContextState.md)\<`Context`\<`TMemory`, `Schema`, `Ctx`, `Actions`, `Events`\>\>\>

Defined in: [packages/core/src/types.ts:1172](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L1172)

A record of input configurations for the context.

***

### instructions?

> `optional` **instructions**: [`Resolver`](./Resolver.md)\<[`Instruction`](./Instruction.md), [`ContextState`](./ContextState.md)\<`Context`\<`TMemory`, `Schema`, `Ctx`, `Actions`, `Events`\>\>\>

Defined in: [packages/core/src/types.ts:1114](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L1114)

Optional instructions for this context

***

### key()?

> `optional` **key**: (`args`) => `string`

Defined in: [packages/core/src/types.ts:1092](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L1092)

Function to generate a unique key from context arguments

#### Parameters

##### args

[`InferSchemaArguments`](./InferSchemaArguments.md)\<`Schema`\>

#### Returns

`string`

***

### load()?

> `optional` **load**: (`id`, `params`) => `Promise`\<`null` \| `TMemory`\>

Defined in: [packages/core/src/types.ts:1120](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L1120)

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

Defined in: [packages/core/src/types.ts:1156](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L1156)

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

Defined in: [packages/core/src/types.ts:1158](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L1158)

***

### maxWorkingMemorySize?

> `optional` **maxWorkingMemorySize**: `number`

Defined in: [packages/core/src/types.ts:1160](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L1160)

***

### model?

> `optional` **model**: `LanguageModel`

Defined in: [packages/core/src/types.ts:1132](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L1132)

***

### modelSettings?

> `optional` **modelSettings**: `object`

Defined in: [packages/core/src/types.ts:1134](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L1134)

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

Defined in: [packages/core/src/types.ts:1150](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L1150)

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

Defined in: [packages/core/src/types.ts:1144](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L1144)

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

Defined in: [packages/core/src/types.ts:1146](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L1146)

#### Parameters

##### ctx

[`AgentContext`](./AgentContext.md)\<`Context`\<`TMemory`, `Schema`, `Ctx`, `Actions`, `Events`\>\>

##### agent

[`AnyAgent`](./AnyAgent.md)

#### Returns

`Promise`\<`void`\>

***

### outputs?

> `optional` **outputs**: [`Resolver`](./Resolver.md)\<`Record`\<`string`, `Omit`\<[`Output`](./Output.md)\<`any`, `any`, [`AnyContext`](./AnyContext.md), `any`\>, `"name"`\>\>, [`ContextState`](./ContextState.md)\<`Context`\<`TMemory`, `Schema`, `Ctx`, `Actions`, `Events`\>\>\>

Defined in: [packages/core/src/types.ts:1180](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L1180)

A record of output configurations for the context.

***

### render()?

> `optional` **render**: (`state`) => `string` \| `string`[] \| [`XMLElement`](./XMLElement.md) \| [`XMLElement`](./XMLElement.md)[] \| (`string` \| [`XMLElement`](./XMLElement.md))[]

Defined in: [packages/core/src/types.ts:1128](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L1128)

Optional function to render memory state

#### Parameters

##### state

[`ContextState`](./ContextState.md)\<`Context`\<`TMemory`, `Schema`, `Ctx`, `Actions`, `Events`\>\>

#### Returns

`string` \| `string`[] \| [`XMLElement`](./XMLElement.md) \| [`XMLElement`](./XMLElement.md)[] \| (`string` \| [`XMLElement`](./XMLElement.md))[]

***

### retrieval?

> `optional` **retrieval**: [`Resolver`](./Resolver.md)\<[`RetrievalPolicy`](./RetrievalPolicy.md), [`ContextState`](./ContextState.md)\<`Context`\<`TMemory`, `Schema`, `Ctx`, `Actions`, `Events`\>\>\>

Defined in: [packages/core/src/types.ts:1189](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L1189)

Retrieval configuration to adapt memory recall per-context.
Can be a static object or a function of the current context state.

***

### save()?

> `optional` **save**: (`state`) => `Promise`\<`void`\>

Defined in: [packages/core/src/types.ts:1125](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L1125)

Optional function to save memory state

#### Parameters

##### state

[`ContextState`](./ContextState.md)\<`Context`\<`TMemory`, `Schema`, `Ctx`, `Actions`, `Events`\>\>

#### Returns

`Promise`\<`void`\>

***

### schema?

> `optional` **schema**: `Schema`

Defined in: [packages/core/src/types.ts:1090](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L1090)

Zod schema for validating context arguments

***

### setup()?

> `optional` **setup**: (`args`, `settings`, `agent`) => `Ctx` \| `Promise`\<`Ctx`\>

Defined in: [packages/core/src/types.ts:1095](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L1095)

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

Defined in: [packages/core/src/types.ts:1148](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L1148)

#### Parameters

##### ctx

[`AgentContext`](./AgentContext.md)\<`Context`\<`TMemory`, `Schema`, `Ctx`, `Actions`, `Events`\>\>

#### Returns

`boolean`

***

### type

> **type**: `string`

Defined in: [packages/core/src/types.ts:1088](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L1088)

Unique type identifier for this context

## Methods

### setActions()

> **setActions**\<`TActions`\>(`actions`): `Context`\<`TMemory`, `Schema`, `Ctx`, `TActions`, `Events`\>

Defined in: [packages/core/src/types.ts:992](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L992)

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

Defined in: [packages/core/src/types.ts:999](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L999)

#### Type Parameters

##### TSchemas

`TSchemas` *extends* `Record`\<`string`, `Readonly`\<\{[`k`: `string`]: `$ZodType`\<`unknown`, `unknown`, `$ZodTypeInternals`\<`unknown`, `unknown`\>\>; \}\> \| `ZodString` \| `ZodObject`\<`$ZodLooseShape`, `$strip`\>\>

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

Defined in: [packages/core/src/types.ts:1008](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L1008)

#### Type Parameters

##### TSchemas

`TSchemas` *extends* `Record`\<`string`, `Readonly`\<\{[`k`: `string`]: `$ZodType`\<`unknown`, `unknown`, `$ZodTypeInternals`\<`unknown`, `unknown`\>\>; \}\> \| `ZodString` \| `ZodObject`\<`$ZodLooseShape`, `$strip`\>\>

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

Defined in: [packages/core/src/types.ts:1019](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L1019)

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
