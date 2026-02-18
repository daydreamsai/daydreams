---
title: "ExportManager"
---

[**@daydreamsai/core**](./api-reference.md)

***

[@daydreamsai/core](./api-reference.md) / ExportManager

# Class: ExportManager

Defined in: [packages/core/src/memory/exporters/export-manager.ts:12](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/exporters/export-manager.ts#L12)

Manages episode export operations

## Constructors

### Constructor

> **new ExportManager**(): `ExportManager`

#### Returns

`ExportManager`

## Methods

### cleanup()

> **cleanup**(): `Promise`\<`void`\>

Defined in: [packages/core/src/memory/exporters/export-manager.ts:176](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/exporters/export-manager.ts#L176)

Cleanup all registered exporters

#### Returns

`Promise`\<`void`\>

***

### export()

> **export**(`params`): `Promise`\<`ExportResult`\>

Defined in: [packages/core/src/memory/exporters/export-manager.ts:47](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/exporters/export-manager.ts#L47)

Export episodes using specified exporter

#### Parameters

##### params

`ExportParams`

#### Returns

`Promise`\<`ExportResult`\>

***

### listExporters()

> **listExporters**(): `object`[]

Defined in: [packages/core/src/memory/exporters/export-manager.ts:32](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/exporters/export-manager.ts#L32)

Get list of available exporters

#### Returns

`object`[]

***

### registerExporter()

> **registerExporter**(`exporter`): `void`

Defined in: [packages/core/src/memory/exporters/export-manager.ts:18](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/exporters/export-manager.ts#L18)

Register an exporter

#### Parameters

##### exporter

`EpisodeExporter`

#### Returns

`void`

***

### unregisterExporter()

> **unregisterExporter**(`name`): `void`

Defined in: [packages/core/src/memory/exporters/export-manager.ts:25](https://github.com/dojoengine/daydreams/blob/612e9304717c546d301f9cac8c204de734cac957/packages/core/src/memory/exporters/export-manager.ts#L25)

Unregister an exporter

#### Parameters

##### name

`string`

#### Returns

`void`
