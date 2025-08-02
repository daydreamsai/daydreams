---
title: "Agent"
---

[**@daydreamsai/core**](./api-reference.md)

---

[@daydreamsai/core](./api-reference.md) / Agent

# Interface: Agent\<TContext\>

Defined in:
[packages/core/src/types.ts:741](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L741)

Represents an agent with various configurations and methods for handling
contexts, inputs, outputs, and more.

## Template

The type of memory used by the agent.

## Extends

- `AgentDef`\<`TContext`\>

## Type Parameters

### TContext

`TContext` _extends_ [`AnyContext`](./AnyContext.md) =
[`AnyContext`](./AnyContext.md)

The type of context used by the agent.

## Properties

### actions

> **actions**: [`Action`](./Action.md)\<`any`, `any`, `unknown`,
> [`AnyContext`](./AnyContext.md), `Agent`\<`TContext`\>,
> [`ActionState`](./ActionState.md)\<`any`\>\>[]

Defined in:
[packages/core/src/types.ts:707](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L707)

An array of actions available to the agent.

#### Inherited from

`AgentDef.actions`

---

### container

> **container**: `Container`

Defined in:
[packages/core/src/types.ts:639](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L639)

The container used by the agent.

#### Inherited from

`AgentDef.container`

---

### context?

> `optional` **context**: `TContext`

Defined in:
[packages/core/src/types.ts:629](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L629)

The current context of the agent.

#### Inherited from

`AgentDef.context`

---

### debugger

> **debugger**: [`Debugger`](./Debugger.md)

Defined in:
[packages/core/src/types.ts:634](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L634)

Debugger function for the agent.

#### Inherited from

`AgentDef.debugger`

---

### emit()

> **emit**: (...`args`) => `void`

Defined in:
[packages/core/src/types.ts:751](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L751)

Emits an event with the provided arguments.

#### Parameters

##### args

...`any`[]

Arguments to pass to the event handler.

#### Returns

`void`

---

### events

> **events**: `Record`\<`string`, `z.ZodObject`\>

Defined in:
[packages/core/src/types.ts:697](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L697)

A record of event schemas for the agent.

#### Inherited from

`AgentDef.events`

---

### experts

> **experts**: `Record`\<`string`, [`ExpertConfig`](./ExpertConfig.md)\>

Defined in:
[packages/core/src/types.ts:702](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L702)

A record of expert configurations for the agent.

#### Inherited from

`AgentDef.experts`

---

### exports?

> `optional` **exports**: `ExportManager`

Defined in:
[packages/core/src/types.ts:756](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L756)

Export manager for episodes

---

### exportTrainingData?

> `optional` **exportTrainingData**: `boolean`

Defined in:
[packages/core/src/types.ts:719](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L719)

Whether to export training data for episodes

#### Inherited from

`AgentDef.exportTrainingData`

---

### inputs

> **inputs**: `Record`\<`string`, [`InputConfig`](./InputConfig.md)\<`any`,
> [`AnyContext`](./AnyContext.md), `Agent`\<`TContext`\>\>\>

Defined in:
[packages/core/src/types.ts:687](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L687)

A record of input configurations for the agent.

#### Inherited from

`AgentDef.inputs`

---

### logger

> **logger**: `Logger`

Defined in:
[packages/core/src/types.ts:619](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L619)

#### Inherited from

`AgentDef.logger`

---

### memory

> **memory**: [`MemorySystem`](./MemorySystem.md)

Defined in:
[packages/core/src/types.ts:624](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L624)

The memory store and vector store used by the agent.

#### Inherited from

`AgentDef.memory`

---

### model?

> `optional` **model**: [`LanguageModel`](./LanguageModel.md)

Defined in:
[packages/core/src/types.ts:659](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L659)

The primary language model used by the agent.

#### Inherited from

`AgentDef.model`

---

### modelSettings?

> `optional` **modelSettings**: `object`

Defined in:
[packages/core/src/types.ts:674](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L674)

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

---

### outputs

> **outputs**: `Record`\<`string`, `Omit`\<[`Output`](./Output.md)\<`any`,
> `any`, `TContext`, `any`\>, `"type"`\>\>

Defined in:
[packages/core/src/types.ts:692](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L692)

A record of output configurations for the agent.

#### Inherited from

`AgentDef.outputs`

---

### reasoningModel?

> `optional` **reasoningModel**: [`LanguageModel`](./LanguageModel.md)

Defined in:
[packages/core/src/types.ts:664](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L664)

The reasoning model used by the agent, if any.

#### Inherited from

`AgentDef.reasoningModel`

---

### registry

> **registry**: [`Registry`](./Registry.md)

Defined in:
[packages/core/src/types.ts:743](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L743)

---

### requestTracker?

> `optional` **requestTracker**: `RequestTracker`

Defined in:
[packages/core/src/types.ts:649](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L649)

Request tracker for monitoring model usage and performance.

#### Inherited from

`AgentDef.requestTracker`

---

### requestTrackingConfig?

> `optional` **requestTrackingConfig**: `Partial`\<`RequestTrackingConfig`\>

Defined in:
[packages/core/src/types.ts:654](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L654)

Configuration for request tracking.

#### Inherited from

`AgentDef.requestTrackingConfig`

---

### run()

> **run**: \<`TContext`, `SubContextRefs`\>(`opts`) =>
> `Promise`\<[`AnyRef`](./AnyRef.md)[]\>

Defined in:
[packages/core/src/types.ts:763](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L763)

Runs the agent with the provided options.

#### Type Parameters

##### TContext

`TContext` _extends_ [`AnyContext`](./AnyContext.md)

##### SubContextRefs

`SubContextRefs` _extends_ [`AnyContext`](./AnyContext.md)[] =
[`AnyContext`](./AnyContext.md)[]

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

[`LanguageModel`](./LanguageModel.md)

###### modelSettings?

\{[`key`: `string`]: `any`; `maxTokens?`: `number`; `providerOptions?`:
`Record`\<`string`, `any`\>; `stopSequences?`: `string`[]; `temperature?`:
`number`; `topK?`: `number`; `topP?`: `number`; \}

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

`Record`\<`string`, `Omit`\<[`Output`](./Output.md)\<`any`, `any`, `TContext`,
`any`\>, `"type"`\>\>

###### requestContext?

`RequestContext`

#### Returns

`Promise`\<[`AnyRef`](./AnyRef.md)[]\>

A promise that resolves to an array of logs.

---

### send()

> **send**: \<`SContext`, `SubContextRefs`\>(`opts`) =>
> `Promise`\<[`AnyRef`](./AnyRef.md)[]\>

Defined in:
[packages/core/src/types.ts:793](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L793)

Sends an input to the agent with the provided options.

#### Type Parameters

##### SContext

`SContext` _extends_ [`AnyContext`](./AnyContext.md)

##### SubContextRefs

`SubContextRefs` _extends_ [`AnyContext`](./AnyContext.md)[] =
[`AnyContext`](./AnyContext.md)[]

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

[`LanguageModel`](./LanguageModel.md)

###### outputs?

`Record`\<`string`, `Omit`\<[`Output`](./Output.md)\<`any`, `any`, `SContext`,
`any`\>, `"type"`\>\>

#### Returns

`Promise`\<[`AnyRef`](./AnyRef.md)[]\>

A promise that resolves to an array of logs.

---

### taskRunner

> **taskRunner**: `TaskRunner`

Defined in:
[packages/core/src/types.ts:644](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L644)

The task runner used by the agent.

#### Inherited from

`AgentDef.taskRunner`

---

### trainingDataPath?

> `optional` **trainingDataPath**: `string`

Defined in:
[packages/core/src/types.ts:724](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L724)

Path to save training data

#### Inherited from

`AgentDef.trainingDataPath`

---

### vectorModel?

> `optional` **vectorModel**: [`LanguageModel`](./LanguageModel.md)

Defined in:
[packages/core/src/types.ts:669](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L669)

The vector model used by the agent, if any.

#### Inherited from

`AgentDef.vectorModel`

## Methods

### \_\_subscribeChunk()

> **\_\_subscribeChunk**(`contextId`, `handler`): () => `void`

Defined in:
[packages/core/src/types.ts:889](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L889)

#### Parameters

##### contextId

`string`

##### handler

(`log`) => `void`

#### Returns

> (): `void`

##### Returns

`void`

---

### deleteContext()

> **deleteContext**(`contextId`): `Promise`\<`void`\>

Defined in:
[packages/core/src/types.ts:882](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L882)

#### Parameters

##### contextId

`string`

#### Returns

`Promise`\<`void`\>

---

### evaluator()

> **evaluator**\<`SContext`\>(`ctx`): `Promise`\<`void`\>

Defined in:
[packages/core/src/types.ts:814](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L814)

Evaluates the provided context.

#### Type Parameters

##### SContext

`SContext` _extends_ [`AnyContext`](./AnyContext.md)

#### Parameters

##### ctx

[`AgentContext`](./AgentContext.md)\<`SContext`\>

The context to evaluate.

#### Returns

`Promise`\<`void`\>

A promise that resolves when evaluation is complete.

---

### getAgentContext()

> **getAgentContext**(): `Promise`\<`undefined` \| >
> [`ContextState`](./ContextState.md)\<`TContext`\>\>

Defined in:
[packages/core/src/types.ts:849](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L849)

#### Returns

`Promise`\<`undefined` \| [`ContextState`](./ContextState.md)\<`TContext`\>\>

---

### getContext()

> **getContext**\<`TContext`\>(`params`):
> `Promise`\<[`ContextState`](./ContextState.md)\<`TContext`\>\>

Defined in:
[packages/core/src/types.ts:856](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L856)

Retrieves the state of a given context and arguments.

#### Type Parameters

##### TContext

`TContext` _extends_ [`AnyContext`](./AnyContext.md)

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

---

### getContextById()

> **getContextById**\<`TContext`\>(`id`): `Promise`\<`null` \| >
> [`ContextState`](./ContextState.md)\<`TContext`\>\>

Defined in:
[packages/core/src/types.ts:871](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L871)

#### Type Parameters

##### TContext

`TContext` _extends_ [`AnyContext`](./AnyContext.md)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<`null` \| [`ContextState`](./ContextState.md)\<`TContext`\>\>

---

### getContextId()

> **getContextId**\<`TContext`\>(`params`): `string`

Defined in:
[packages/core/src/types.ts:844](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L844)

Retrieves the ID for a given context and arguments.

#### Type Parameters

##### TContext

`TContext` _extends_ [`AnyContext`](./AnyContext.md) =
[`AnyContext`](./AnyContext.md)

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

---

### getContexts()

> **getContexts**(): `Promise`\<`object`[]\>

Defined in:
[packages/core/src/types.ts:835](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L835)

Retrieves the contexts managed by the agent.

#### Returns

`Promise`\<`object`[]\>

A promise that resolves to an array of context objects.

---

### getWorkingMemory()

> **getWorkingMemory**(`contextId`):
> `Promise`\<[`WorkingMemory`](./WorkingMemory.md)\>

Defined in:
[packages/core/src/types.ts:880](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L880)

Retrieves the working memory for a given context ID.

#### Parameters

##### contextId

`string`

The ID of the context.

#### Returns

`Promise`\<[`WorkingMemory`](./WorkingMemory.md)\>

A promise that resolves to the working memory.

---

### isBooted()

> **isBooted**(): `boolean`

Defined in:
[packages/core/src/types.ts:745](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L745)

#### Returns

`boolean`

---

### loadContext()

> **loadContext**\<`TContext`\>(`params`): `Promise`\<`null` \| >
> [`ContextState`](./ContextState.md)\<`TContext`\>\>

Defined in:
[packages/core/src/types.ts:861](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L861)

#### Type Parameters

##### TContext

`TContext` _extends_ [`AnyContext`](./AnyContext.md)

#### Parameters

##### params

###### args

[`InferSchemaArguments`](./InferSchemaArguments.md)\<`TContext`\[`"schema"`\]\>

###### context

`TContext`

#### Returns

`Promise`\<`null` \| [`ContextState`](./ContextState.md)\<`TContext`\>\>

---

### saveContext()

> **saveContext**(`state`, `workingMemory?`): `Promise`\<`boolean`\>

Defined in:
[packages/core/src/types.ts:866](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L866)

#### Parameters

##### state

[`ContextState`](./ContextState.md)\<[`AnyContext`](./AnyContext.md)\>

##### workingMemory?

[`WorkingMemory`](./WorkingMemory.md)

#### Returns

`Promise`\<`boolean`\>

---

### start()

> **start**(`args?`): `Promise`\<`Agent`\<`TContext`\>\>

Defined in:
[packages/core/src/types.ts:823](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L823)

Starts the agent with the provided arguments.

#### Parameters

##### args?

[`InferSchemaArguments`](./InferSchemaArguments.md)\<`TContext`\[`"schema"`\]\>

Arguments to pass to the agent on start.

#### Returns

`Promise`\<`Agent`\<`TContext`\>\>

A promise that resolves to the agent instance.

---

### stop()

> **stop**(): `Promise`\<`void`\>

Defined in:
[packages/core/src/types.ts:829](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L829)

Stops the agent.

#### Returns

`Promise`\<`void`\>

A promise that resolves when the agent is stopped.

---

### subscribeContext()

> **subscribeContext**(`contextId`, `handler`): () => `void`

Defined in:
[packages/core/src/types.ts:884](https://github.com/dojoengine/daydreams/blob/877d54c3d7a1ffa2e1fe799ae3402216c969af05/packages/core/src/types.ts#L884)

#### Parameters

##### contextId

`string`

##### handler

(`log`, `done`) => `void`

#### Returns

> (): `void`

##### Returns

`void`
