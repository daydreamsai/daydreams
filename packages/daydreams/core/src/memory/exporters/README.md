# Episode Export System

The episode export system provides a clean and extensible way to export conversation episodes from the Daydreams memory system.

## Usage

### Basic Export

```typescript
// Export episodes to JSON
const episodes = await agent.memory.episodes.getByContext('context:123');
const result = await agent.exports.export({
  episodes,
  exporter: 'json',
  options: { pretty: true }
});

if (result.success) {
  console.log(result.metadata.content); // JSON string
}
```

### Export to Markdown

```typescript
const result = await agent.exports.export({
  episodes,
  exporter: 'markdown',
  options: { 
    includeMetadata: true,
    includeTimestamps: true 
  }
});

// Save to file
fs.writeFileSync('conversation.md', result.metadata.content);
```

### Export with Transformations

```typescript
// Sort and filter fields
const result = await agent.exports.export({
  episodes,
  exporter: 'json',
  transform: {
    sortBy: 'timestamp',
    sortOrder: 'asc',
    fields: {
      exclude: ['metadata', 'duration']
    }
  }
});

// Apply custom sanitization
const result = await agent.exports.export({
  episodes,
  exporter: 'json',
  transform: {
    sanitize: (episode) => ({
      ...episode,
      input: sanitizeContent(episode.input),
      output: sanitizeContent(episode.output)
    })
  }
});
```

### JSONL Export

```typescript
// Export as JSON Lines (one JSON object per line)
const result = await agent.exports.export({
  episodes,
  exporter: 'json',
  options: { format: 'jsonl' }
});

// Each line is a valid JSON object
const lines = result.metadata.content.split('\n');
lines.forEach(line => {
  const episode = JSON.parse(line);
  console.log(episode.id);
});
```

## Available Exporters

- **JSONExporter**: Exports to JSON or JSONL format
- **MarkdownExporter**: Exports to human-readable Markdown

## Creating Custom Exporters

```typescript
import { EpisodeExporter, ExportResult } from '@daydreamsai/core';

class CSVExporter implements EpisodeExporter<CSVOptions> {
  name = 'csv';
  formats = ['csv'];
  
  async exportBatch(episodes: Episode[], options?: CSVOptions): Promise<ExportResult> {
    const csv = episodes.map(e => 
      `${e.id},${e.type},${e.timestamp}`
    ).join('\n');
    
    return {
      success: true,
      format: 'csv',
      metadata: { content: csv }
    };
  }
}

// Register the exporter
agent.exports.registerExporter(new CSVExporter());
```