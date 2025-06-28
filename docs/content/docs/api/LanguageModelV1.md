---
title: "LanguageModelV1"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / LanguageModelV1

# Type Alias: LanguageModelV1

> **LanguageModelV1** = `object`

Defined in: node\_modules/.pnpm/@ai-sdk+provider@1.1.3/node\_modules/@ai-sdk/provider/dist/index.d.ts:951

Specification for a language model that implements the language model interface version 1.

## Properties

### defaultObjectGenerationMode

> `readonly` **defaultObjectGenerationMode**: `LanguageModelV1ObjectGenerationMode`

Defined in: node\_modules/.pnpm/@ai-sdk+provider@1.1.3/node\_modules/@ai-sdk/provider/dist/index.d.ts:976

Default object generation mode that should be used with this model when
no mode is specified. Should be the mode with the best results for this
model. `undefined` can be returned if object generation is not supported.

This is needed to generate the best objects possible w/o requiring the
user to explicitly specify the object generation mode.

***

### modelId

> `readonly` **modelId**: `string`

Defined in: node\_modules/.pnpm/@ai-sdk+provider@1.1.3/node\_modules/@ai-sdk/provider/dist/index.d.ts:967

Provider-specific model ID for logging purposes.

***

### provider

> `readonly` **provider**: `string`

Defined in: node\_modules/.pnpm/@ai-sdk+provider@1.1.3/node\_modules/@ai-sdk/provider/dist/index.d.ts:963

Name of the provider for logging purposes.

***

### specificationVersion

> `readonly` **specificationVersion**: `"v1"`

Defined in: node\_modules/.pnpm/@ai-sdk+provider@1.1.3/node\_modules/@ai-sdk/provider/dist/index.d.ts:959

The language model must specify which language model interface
version it implements. This will allow us to evolve the language
model interface and retain backwards compatibility. The different
implementation versions can be handled as a discriminated union
on our side.

***

### supportsImageUrls?

> `readonly` `optional` **supportsImageUrls**: `boolean`

Defined in: node\_modules/.pnpm/@ai-sdk+provider@1.1.3/node\_modules/@ai-sdk/provider/dist/index.d.ts:983

Flag whether this model supports image URLs. Default is `true`.

When the flag is set to `false`, the AI SDK will download the image and
pass the image data to the model.

***

### supportsStructuredOutputs?

> `readonly` `optional` **supportsStructuredOutputs**: `boolean`

Defined in: node\_modules/.pnpm/@ai-sdk+provider@1.1.3/node\_modules/@ai-sdk/provider/dist/index.d.ts:1000

Flag whether this model supports grammar-guided generation,
i.e. follows JSON schemas for object generation
when the response format is set to 'json' or
when the `object-json` mode is used.

This means that the model guarantees that the generated JSON
will be a valid JSON object AND that the object will match the
JSON schema.

Please note that `generateObject` and `streamObject` will work
regardless of this flag, but might send different prompts and
use further optimizations if this flag is set to `true`.

Defaults to `false`.

## Methods

### doGenerate()

> **doGenerate**(`options`): `PromiseLike`\<\{ `files?`: `object`[]; `finishReason`: `LanguageModelV1FinishReason`; `logprobs?`: `LanguageModelV1LogProbs`; `providerMetadata?`: `LanguageModelV1ProviderMetadata`; `rawCall`: \{ `rawPrompt`: `unknown`; `rawSettings`: `Record`\<`string`, `unknown`\>; \}; `rawResponse?`: \{ `body?`: `unknown`; `headers?`: `Record`\<`string`, `string`\>; \}; `reasoning?`: `string` \| (\{ `signature?`: `string`; `text`: `string`; `type`: `"text"`; \} \| \{ `data`: `string`; `type`: `"redacted"`; \})[]; `request?`: \{ `body?`: `string`; \}; `response?`: \{ `id?`: `string`; `modelId?`: `string`; `timestamp?`: `Date`; \}; `sources?`: `LanguageModelV1Source`[]; `text?`: `string`; `toolCalls?`: `LanguageModelV1FunctionToolCall`[]; `usage`: \{ `completionTokens`: `number`; `promptTokens`: `number`; \}; `warnings?`: `LanguageModelV1CallWarning`[]; \}\>

Defined in: node\_modules/.pnpm/@ai-sdk+provider@1.1.3/node\_modules/@ai-sdk/provider/dist/index.d.ts:1015

Generates a language model output (non-streaming).

Naming: "do" prefix to prevent accidental direct usage of the method
by the user.

#### Parameters

##### options

`LanguageModelV1CallOptions`

#### Returns

`PromiseLike`\<\{ `files?`: `object`[]; `finishReason`: `LanguageModelV1FinishReason`; `logprobs?`: `LanguageModelV1LogProbs`; `providerMetadata?`: `LanguageModelV1ProviderMetadata`; `rawCall`: \{ `rawPrompt`: `unknown`; `rawSettings`: `Record`\<`string`, `unknown`\>; \}; `rawResponse?`: \{ `body?`: `unknown`; `headers?`: `Record`\<`string`, `string`\>; \}; `reasoning?`: `string` \| (\{ `signature?`: `string`; `text`: `string`; `type`: `"text"`; \} \| \{ `data`: `string`; `type`: `"redacted"`; \})[]; `request?`: \{ `body?`: `string`; \}; `response?`: \{ `id?`: `string`; `modelId?`: `string`; `timestamp?`: `Date`; \}; `sources?`: `LanguageModelV1Source`[]; `text?`: `string`; `toolCalls?`: `LanguageModelV1FunctionToolCall`[]; `usage`: \{ `completionTokens`: `number`; `promptTokens`: `number`; \}; `warnings?`: `LanguageModelV1CallWarning`[]; \}\>

***

### doStream()

> **doStream**(`options`): `PromiseLike`\<\{ `rawCall`: \{ `rawPrompt`: `unknown`; `rawSettings`: `Record`\<`string`, `unknown`\>; \}; `rawResponse?`: \{ `headers?`: `Record`\<`string`, `string`\>; \}; `request?`: \{ `body?`: `string`; \}; `stream`: `ReadableStream`\<`LanguageModelV1StreamPart`\>; `warnings?`: `LanguageModelV1CallWarning`[]; \}\>

Defined in: node\_modules/.pnpm/@ai-sdk+provider@1.1.3/node\_modules/@ai-sdk/provider/dist/index.d.ts:1145

Generates a language model output (streaming).

Naming: "do" prefix to prevent accidental direct usage of the method
by the user.
   *

#### Parameters

##### options

`LanguageModelV1CallOptions`

#### Returns

`PromiseLike`\<\{ `rawCall`: \{ `rawPrompt`: `unknown`; `rawSettings`: `Record`\<`string`, `unknown`\>; \}; `rawResponse?`: \{ `headers?`: `Record`\<`string`, `string`\>; \}; `request?`: \{ `body?`: `string`; \}; `stream`: `ReadableStream`\<`LanguageModelV1StreamPart`\>; `warnings?`: `LanguageModelV1CallWarning`[]; \}\>

A stream of higher-level language model output parts.

***

### supportsUrl()?

> `optional` **supportsUrl**(`url`): `boolean`

Defined in: node\_modules/.pnpm/@ai-sdk+provider@1.1.3/node\_modules/@ai-sdk/provider/dist/index.d.ts:1008

Checks if the model supports the given URL for file parts natively.
If the model does not support the URL,
the AI SDK will download the file and pass the file data to the model.

When undefined, the AI SDK will download the file.

#### Parameters

##### url

`URL`

#### Returns

`boolean`
