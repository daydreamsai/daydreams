---
title: "JSONExporter"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / JSONExporter

# Class: JSONExporter

Defined in: [packages/core/src/memory/exporters/json-exporter.ts:14](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/exporters/json-exporter.ts#L14)

Exports episodes to JSON or JSONL format

## Implements

- `EpisodeExporter`\<`JSONExportOptions`\>

## Constructors

### Constructor

> **new JSONExporter**(): `JSONExporter`

#### Returns

`JSONExporter`

## Properties

### description

> **description**: `string` = `"Export episodes as JSON or JSONL format"`

Defined in: [packages/core/src/memory/exporters/json-exporter.ts:16](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/exporters/json-exporter.ts#L16)

Human-readable description

#### Implementation of

`EpisodeExporter.description`

***

### formats

> **formats**: `string`[]

Defined in: [packages/core/src/memory/exporters/json-exporter.ts:17](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/exporters/json-exporter.ts#L17)

Supported export formats

#### Implementation of

`EpisodeExporter.formats`

***

### name

> **name**: `string` = `"json"`

Defined in: [packages/core/src/memory/exporters/json-exporter.ts:15](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/exporters/json-exporter.ts#L15)

Unique name for this exporter

#### Implementation of

`EpisodeExporter.name`

## Methods

### exportBatch()

> **exportBatch**(`episodes`, `options?`): `Promise`\<`ExportResult`\>

Defined in: [packages/core/src/memory/exporters/json-exporter.ts:44](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/exporters/json-exporter.ts#L44)

Export multiple episodes

#### Parameters

##### episodes

[`Episode`](./Episode.md)[]

##### options?

`JSONExportOptions`

#### Returns

`Promise`\<`ExportResult`\>

#### Implementation of

`EpisodeExporter.exportBatch`

***

### exportEpisode()

> **exportEpisode**(`episode`, `options?`): `Promise`\<`ExportResult`\>

Defined in: [packages/core/src/memory/exporters/json-exporter.ts:19](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/exporters/json-exporter.ts#L19)

Export a single episode

#### Parameters

##### episode

[`Episode`](./Episode.md)

##### options?

`JSONExportOptions`

#### Returns

`Promise`\<`ExportResult`\>

#### Implementation of

`EpisodeExporter.exportEpisode`

***

### validate()

> **validate**(`options`): `Promise`\<`boolean`\>

Defined in: [packages/core/src/memory/exporters/json-exporter.ts:79](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/exporters/json-exporter.ts#L79)

Validate options before export

#### Parameters

##### options

`JSONExportOptions`

#### Returns

`Promise`\<`boolean`\>

#### Implementation of

`EpisodeExporter.validate`
