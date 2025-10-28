---
title: "Agent"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / Agent

# Interface: Agent\<TContext\>

Defined in: [packages/core/src/types.ts:672](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L672)

Represents an agent with various configurations and methods for handling contexts, inputs, outputs, and more.

## Template

The type of memory used by the agent.

## Extends

- `AgentDef`\<`TContext`\>

## Type Parameters

### TContext

`TContext` *extends* [`AnyContext`](./AnyContext.md) = [`AnyContext`](./AnyContext.md)

The type of context used by the agent.

## Properties

### actions

> **actions**: [`Action`](./Action.md)\<`any`, `any`, `unknown`, [`AnyContext`](./AnyContext.md), `Agent`\<`TContext`\>, [`ActionState`](./ActionState.md)\<`any`\>\>[]

Defined in: [packages/core/src/types.ts:638](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L638)

An array of actions available to the agent.

#### Inherited from

`AgentDef.actions`

***

### container

> **container**: `Container`

Defined in: [packages/core/src/types.ts:595](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L595)

The container used by the agent.

#### Inherited from

`AgentDef.container`

***

### context?

> `optional` **context**: `TContext`

Defined in: [packages/core/src/types.ts:585](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L585)

The current context of the agent.

#### Inherited from

`AgentDef.context`

***

### debugger

> **debugger**: [`Debugger`](./Debugger.md)

Defined in: [packages/core/src/types.ts:590](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L590)

Debugger function for the agent.

#### Inherited from

`AgentDef.debugger`

***

### emit()

> **emit**: (...`args`) => `void`

Defined in: [packages/core/src/types.ts:706](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L706)

Emits an event with the provided arguments.

#### Parameters

##### args

...`any`[]

Arguments to pass to the event handler.

#### Returns

`void`

***

### events

> **events**: `Record`\<`string`, `z.ZodObject`\>

Defined in: [packages/core/src/types.ts:633](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L633)

A record of event schemas for the agent.

#### Inherited from

`AgentDef.events`

***

### exports?

> `optional` **exports**: [`ExportManager`](./ExportManager.md)

Defined in: [packages/core/src/types.ts:711](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L711)

Export manager for episodes

***

### exportTrainingData?

> `optional` **exportTrainingData**: `boolean`

Defined in: [packages/core/src/types.ts:650](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L650)

Whether to export training data for episodes

#### Inherited from

`AgentDef.exportTrainingData`

***

### inputs

> **inputs**: `Record`\<`string`, [`InputConfig`](./InputConfig.md)\<`any`, [`AnyContext`](./AnyContext.md), `Agent`\<`TContext`\>\>\>

Defined in: [packages/core/src/types.ts:623](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L623)

A record of input configurations for the agent.

#### Inherited from

`AgentDef.inputs`

***

### logger

> **logger**: `Logger`

Defined in: [packages/core/src/types.ts:570](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L570)

#### Inherited from

`AgentDef.logger`

***

### memory

> **memory**: [`MemorySystem`](./MemorySystem.md)

Defined in: [packages/core/src/types.ts:580](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L580)

The memory store and vector store used by the agent.

#### Inherited from

`AgentDef.memory`

***

### model?

> `optional` **model**: `LanguageModel`

Defined in: [packages/core/src/types.ts:605](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L605)

The primary language model used by the agent.

#### Inherited from

`AgentDef.model`

***

### modelSettings?

> `optional` **modelSettings**: `object`

Defined in: [packages/core/src/types.ts:610](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L610)

Model settings for the agent.

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

#### Inherited from

`AgentDef.modelSettings`

***

### outputs

> **outputs**: `Record`\<`string`, `Omit`\<[`Output`](./Output.md)\<`any`, `any`, `TContext`, `any`\>, `"name"`\>\>

Defined in: [packages/core/src/types.ts:628](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L628)

A record of output configurations for the agent.

#### Inherited from

`AgentDef.outputs`

***

### registry

> **registry**: [`Registry`](./Registry.md)

Defined in: [packages/core/src/types.ts:674](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L674)

***

### run()

> **run**: \<`TContext`, `SubContextRefs`\>(`opts`) => `Promise`\<[`AnyRef`](./AnyRef.md)[]\>

Defined in: [packages/core/src/types.ts:718](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L718)

Runs the agent with the provided options.

#### Type Parameters

##### TContext

`TContext` *extends* [`AnyContext`](./AnyContext.md)

##### SubContextRefs

`SubContextRefs` *extends* [`AnyContext`](./AnyContext.md)[] = [`AnyContext`](./AnyContext.md)[]

#### Parameters

##### opts

Options for running the agent.

###### abortSignal?

`AbortSignal`

###### actions?

[`AnyAction`](./AnyAction.md)[]

###### args

[`InferSchemaArguments`](./InferSchemaArguments.md)\<`TContext`\[`"schema"`\]\>

###### chain?

[`Log`](./Log.md)[]

###### context

`TContext`

###### contexts?

[`ContextRefArray`](./ContextRefArray.md)\<`SubContextRefs`\>

###### handlers?

`Partial`\<[`Handlers`](./Handlers.md)\>

###### model?

`LanguageModel`

###### modelSettings?

\{[`key`: `string`]: `any`; `maxTokens?`: `number`; `providerOptions?`: `Record`\<`string`, `any`\>; `stopSequences?`: `string`[]; `temperature?`: `number`; `topK?`: `number`; `topP?`: `number`; \}

###### modelSettings.maxTokens?

`number`

###### modelSettings.providerOptions?

`Record`\<`string`, `any`\>

###### modelSettings.stopSequences?

`string`[]

###### modelSettings.temperature?

`number`

###### modelSettings.topK?

`number`

###### modelSettings.topP?

`number`

###### outputs?

`Record`\<`string`, `Omit`\<[`Output`](./Output.md)\<`any`, `any`, `TContext`, `any`\>, `"name"`\>\>

###### priority?

`number`

Task priority for execution ordering (higher = more priority)

#### Returns

`Promise`\<[`AnyRef`](./AnyRef.md)[]\>

A promise that resolves to an array of logs.

***

### send()

> **send**: \<`SContext`, `SubContextRefs`\>(`opts`) => `Promise`\<[`AnyRef`](./AnyRef.md)[]\>

Defined in: [packages/core/src/types.ts:749](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L749)

Sends an input to the agent with the provided options.

#### Type Parameters

##### SContext

`SContext` *extends* [`AnyContext`](./AnyContext.md)

##### SubContextRefs

`SubContextRefs` *extends* [`AnyContext`](./AnyContext.md)[] = [`AnyContext`](./AnyContext.md)[]

#### Parameters

##### opts

Options for sending input to the agent.

###### abortSignal?

`AbortSignal`

###### actions?

[`AnyAction`](./AnyAction.md)[]

###### args

[`InferSchemaArguments`](./InferSchemaArguments.md)\<`SContext`\[`"schema"`\]\>

###### chain?

[`Log`](./Log.md)[]

###### context

`SContext`

###### contexts?

[`ContextRefArray`](./ContextRefArray.md)\<`SubContextRefs`\>

###### handlers?

`Partial`\<[`Handlers`](./Handlers.md)\>

###### input

\{ `data`: `any`; `type`: `string`; \}

###### input.data

`any`

###### input.type

`string`

###### model?

`LanguageModel`

###### outputs?

`Record`\<`string`, `Omit`\<[`Output`](./Output.md)\<`any`, `any`, `SContext`, `any`\>, `"name"`\>\>

#### Returns

`Promise`\<[`AnyRef`](./AnyRef.md)[]\>

A promise that resolves to an array of logs.

***

### taskRunner

> **taskRunner**: `TaskRunner`

Defined in: [packages/core/src/types.ts:600](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L600)

The task runner used by the agent.

#### Inherited from

`AgentDef.taskRunner`

***

### tracker

> **tracker**: `SimpleTracker`

Defined in: [packages/core/src/types.ts:575](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L575)

Analytics tracker automatically extracts metrics from logger events

#### Inherited from

`AgentDef.tracker`

***

### trainingDataPath?

> `optional` **trainingDataPath**: `string`

Defined in: [packages/core/src/types.ts:655](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L655)

Path to save training data

#### Inherited from

`AgentDef.trainingDataPath`

## Methods

### \_\_subscribeChunk()

> **\_\_subscribeChunk**(`contextId`, `handler`): () => `void`

Defined in: [packages/core/src/types.ts:836](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L836)

#### Parameters

##### contextId

`string`

##### handler

(`log`) => `void`

#### Returns

> (): `void`

##### Returns

`void`

***

### deleteContext()

> **deleteContext**(`contextId`): `Promise`\<`void`\>

Defined in: [packages/core/src/types.ts:829](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L829)

#### Parameters

##### contextId

`string`

#### Returns

`Promise`\<`void`\>

***

### getAgentContext()

> **getAgentContext**(): `Promise`\<`undefined` \| [`ContextState`](./ContextState.md)\<`TContext`\>\>

Defined in: [packages/core/src/types.ts:796](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L796)

#### Returns

`Promise`\<`undefined` \| [`ContextState`](./ContextState.md)\<`TContext`\>\>

***

### getContext()

> **getContext**\<`TContext`\>(`params`): `Promise`\<[`ContextState`](./ContextState.md)\<`TContext`\>\>

Defined in: [packages/core/src/types.ts:803](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L803)

Retrieves the state of a given context and arguments.

#### Type Parameters

##### TContext

`TContext` *extends* [`AnyContext`](./AnyContext.md)

#### Parameters

##### params

Parameters for retrieving the context state.

###### args

[`InferSchemaArguments`](./InferSchemaArguments.md)\<`TContext`\[`"schema"`\]\>

###### context

`TContext`

#### Returns

`Promise`\<[`ContextState`](./ContextState.md)\<`TContext`\>\>

A promise that resolves to the context state.

***

### getContextById()

> **getContextById**\<`TContext`\>(`id`): `Promise`\<`null` \| [`ContextState`](./ContextState.md)\<`TContext`\>\>

Defined in: [packages/core/src/types.ts:818](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L818)

#### Type Parameters

##### TContext

`TContext` *extends* [`AnyContext`](./AnyContext.md)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<`null` \| [`ContextState`](./ContextState.md)\<`TContext`\>\>

***

### getContextId()

> **getContextId**\<`TContext`\>(`params`): `string`

Defined in: [packages/core/src/types.ts:791](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L791)

Retrieves the ID for a given context and arguments.

#### Type Parameters

##### TContext

`TContext` *extends* [`AnyContext`](./AnyContext.md) = [`AnyContext`](./AnyContext.md)

#### Parameters

##### params

Parameters for retrieving the context ID.

###### args

[`InferSchemaArguments`](./InferSchemaArguments.md)\<`TContext`\[`"schema"`\]\>

###### context

`TContext`

#### Returns

`string`

The context ID.

***

### getContexts()

> **getContexts**(): `Promise`\<`object`[]\>

Defined in: [packages/core/src/types.ts:782](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L782)

Retrieves the contexts managed by the agent.

#### Returns

`Promise`\<`object`[]\>

A promise that resolves to an array of context objects.

***

### getPriorityLevels()

> **getPriorityLevels**(): `object`

Defined in: [packages/core/src/types.ts:681](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L681)

Gets the configured task priority levels

#### Returns

`object`

##### default

> **default**: `number`

##### high

> **high**: `number`

##### low

> **low**: `number`

***

### getTaskConfig()

> **getTaskConfig**(): `object`

Defined in: [packages/core/src/types.ts:690](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L690)

Gets the current task configuration

#### Returns

`object`

##### concurrency

> **concurrency**: `object`

###### concurrency.default

> **default**: `number`

###### concurrency.llm

> **llm**: `number`

##### priority

> **priority**: `object`

###### priority.default

> **default**: `number`

###### priority.high?

> `optional` **high**: `number`

###### priority.low?

> `optional` **low**: `number`

***

### getWorkingMemory()

> **getWorkingMemory**(`contextId`): `Promise`\<[`WorkingMemory`](./WorkingMemory.md)\>

Defined in: [packages/core/src/types.ts:827](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L827)

Retrieves the working memory for a given context ID.

#### Parameters

##### contextId

`string`

The ID of the context.

#### Returns

`Promise`\<[`WorkingMemory`](./WorkingMemory.md)\>

A promise that resolves to the working memory.

***

### isBooted()

> **isBooted**(): `boolean`

Defined in: [packages/core/src/types.ts:676](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L676)

#### Returns

`boolean`

***

### loadContext()

> **loadContext**\<`TContext`\>(`params`): `Promise`\<`null` \| [`ContextState`](./ContextState.md)\<`TContext`\>\>

Defined in: [packages/core/src/types.ts:808](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L808)

#### Type Parameters

##### TContext

`TContext` *extends* [`AnyContext`](./AnyContext.md)

#### Parameters

##### params

###### args

[`InferSchemaArguments`](./InferSchemaArguments.md)\<`TContext`\[`"schema"`\]\>

###### context

`TContext`

#### Returns

`Promise`\<`null` \| [`ContextState`](./ContextState.md)\<`TContext`\>\>

***

### saveContext()

> **saveContext**(`state`, `workingMemory?`): `Promise`\<`boolean`\>

Defined in: [packages/core/src/types.ts:813](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L813)

#### Parameters

##### state

[`ContextState`](./ContextState.md)\<[`AnyContext`](./AnyContext.md)\>

##### workingMemory?

[`WorkingMemory`](./WorkingMemory.md)

#### Returns

`Promise`\<`boolean`\>

***

### start()

> **start**(`args?`): `Promise`\<`Agent`\<`TContext`\>\>

Defined in: [packages/core/src/types.ts:770](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L770)

Starts the agent with the provided arguments.

#### Parameters

##### args?

[`InferSchemaArguments`](./InferSchemaArguments.md)\<`TContext`\[`"schema"`\]\>

Arguments to pass to the agent on start.

#### Returns

`Promise`\<`Agent`\<`TContext`\>\>

A promise that resolves to the agent instance.

***

### stop()

> **stop**(): `Promise`\<`void`\>

Defined in: [packages/core/src/types.ts:776](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L776)

Stops the agent.

#### Returns

`Promise`\<`void`\>

A promise that resolves when the agent is stopped.

***

### subscribeContext()

> **subscribeContext**(`contextId`, `handler`): () => `void`

Defined in: [packages/core/src/types.ts:831](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/types.ts#L831)

#### Parameters

##### contextId

`string`

##### handler

(`log`, `done`) => `void`

#### Returns

> (): `void`

##### Returns

`void`
