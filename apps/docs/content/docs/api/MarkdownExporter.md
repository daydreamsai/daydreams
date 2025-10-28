---
title: "MarkdownExporter"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / MarkdownExporter

# Class: MarkdownExporter

Defined in: [packages/core/src/memory/exporters/markdown-exporter.ts:16](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/exporters/markdown-exporter.ts#L16)

Exports episodes to Markdown format

## Implements

- `EpisodeExporter`\<`MarkdownExportOptions`\>

## Constructors

### Constructor

> **new MarkdownExporter**(): `MarkdownExporter`

#### Returns

`MarkdownExporter`

## Properties

### description

> **description**: `string` = `"Export episodes as Markdown documents"`

Defined in: [packages/core/src/memory/exporters/markdown-exporter.ts:20](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/exporters/markdown-exporter.ts#L20)

Human-readable description

#### Implementation of

`EpisodeExporter.description`

***

### formats

> **formats**: `string`[]

Defined in: [packages/core/src/memory/exporters/markdown-exporter.ts:21](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/exporters/markdown-exporter.ts#L21)

Supported export formats

#### Implementation of

`EpisodeExporter.formats`

***

### name

> **name**: `string` = `"markdown"`

Defined in: [packages/core/src/memory/exporters/markdown-exporter.ts:19](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/exporters/markdown-exporter.ts#L19)

Unique name for this exporter

#### Implementation of

`EpisodeExporter.name`

## Methods

### exportBatch()

> **exportBatch**(`episodes`, `options?`): `Promise`\<`ExportResult`\>

Defined in: [packages/core/src/memory/exporters/markdown-exporter.ts:46](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/exporters/markdown-exporter.ts#L46)

Export multiple episodes

#### Parameters

##### episodes

[`Episode`](./Episode.md)[]

##### options?

`MarkdownExportOptions`

#### Returns

`Promise`\<`ExportResult`\>

#### Implementation of

`EpisodeExporter.exportBatch`

***

### exportEpisode()

> **exportEpisode**(`episode`, `options?`): `Promise`\<`ExportResult`\>

Defined in: [packages/core/src/memory/exporters/markdown-exporter.ts:23](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/exporters/markdown-exporter.ts#L23)

Export a single episode

#### Parameters

##### episode

[`Episode`](./Episode.md)

##### options?

`MarkdownExportOptions`

#### Returns

`Promise`\<`ExportResult`\>

#### Implementation of

`EpisodeExporter.exportEpisode`

***

### validate()

> **validate**(`options`): `Promise`\<`boolean`\>

Defined in: [packages/core/src/memory/exporters/markdown-exporter.ts:181](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/exporters/markdown-exporter.ts#L181)

Validate options before export

#### Parameters

##### options

`MarkdownExportOptions`

#### Returns

`Promise`\<`boolean`\>

#### Implementation of

`EpisodeExporter.validate`
