# @daydreamsai/supabase

A Supabase integration package for the DaydreamsAI platform, providing comprehensive memory storage capabilities including key-value storage, vector embeddings, and graph relationships.

## Features

- **Complete Memory System**: Implements the full DaydreamsAI memory interface
- **Key-Value Storage**: Persistent storage with TTL support and batch operations
- **Vector Storage**: Store and retrieve vector embeddings using pgvector with similarity search
- **Graph Storage**: Store and query entity relationships with graph traversal capabilities
- **Health Monitoring**: Built-in health checks for all storage providers
- **Fully Typed**: Complete TypeScript support with Zod schema validation
- **Auto-Initialization**: Automatic table creation and setup

## Installation

```bash
npm install @daydreamsai/supabase
# or
yarn add @daydreamsai/supabase
# or
pnpm add @daydreamsai/supabase
```

## Prerequisites

1. **Supabase Project**: You need a Supabase project with:
   - `pgvector` extension enabled
   - `execute_sql` function (see setup instructions below)

2. **Database Setup**: Run the SQL setup script to enable required functions:

```sql
-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Function to execute arbitrary SQL (required for table initialization)
CREATE OR REPLACE FUNCTION execute_sql(query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE query;
END;
$$;
```

## Quick Start

### Basic Memory System

```typescript
import { createSupabaseMemory } from "@daydreamsai/supabase";
import { createDreams } from "@daydreamsai/core";

// Create the memory system
const memory = createSupabaseMemory({
  url: process.env.SUPABASE_URL!,
  key: process.env.SUPABASE_ANON_KEY!,
  kvTableName: "kv_store",           // Optional: defaults to "kv_store"
  vectorTableName: "vector_store",    // Optional: defaults to "vector_store"
  nodesTableName: "graph_nodes",      // Optional: defaults to "graph_nodes"
  edgesTableName: "graph_edges",      // Optional: defaults to "graph_edges"
  embeddingDimension: 1536,           // Optional: defaults to 1536
});

// Initialize the memory system
await memory.initialize();

// Create your agent with Supabase memory
const agent = createDreams({
  memory,
  // ... other configuration
});
```

### Using Individual Providers

You can also use individual storage providers:

```typescript
import { 
  createSupabaseKVProvider,
  createSupabaseVectorProvider,
  createSupabaseGraphProvider 
} from "@daydreamsai/supabase";

// Key-Value storage only
const kvProvider = createSupabaseKVProvider({
  url: process.env.SUPABASE_URL!,
  key: process.env.SUPABASE_ANON_KEY!,
  tableName: "my_kv_store",
});

await kvProvider.initialize();

// Store and retrieve data
await kvProvider.set("user:123", { name: "John", age: 30 });
const user = await kvProvider.get("user:123");

// Vector storage only
const vectorProvider = createSupabaseVectorProvider({
  url: process.env.SUPABASE_URL!,
  key: process.env.SUPABASE_ANON_KEY!,
  tableName: "my_vectors",
  embeddingDimension: 1536,
});

await vectorProvider.initialize();

// Store and search vectors
await vectorProvider.index([{
  id: "doc1",
  content: "This is a sample document",
  embedding: [0.1, 0.2, 0.3, ...], // 1536-dimensional vector
  metadata: { type: "document", category: "sample" }
}]);

const results = await vectorProvider.search({
  embedding: [0.1, 0.2, 0.3, ...],
  limit: 5,
  minScore: 0.7
});
```

## API Reference

### Memory System

The main `createSupabaseMemory()` function creates a complete memory system with all storage types:

```typescript
interface SupabaseMemoryConfig {
  /** Supabase URL */
  url: string;
  /** Supabase API key */
  key: string;
  /** Table name for key-value storage */
  kvTableName?: string;
  /** Table name for vector storage */
  vectorTableName?: string;
  /** Table name for graph nodes */
  nodesTableName?: string;
  /** Table name for graph edges */
  edgesTableName?: string;
  /** Vector embedding dimension */
  embeddingDimension?: number;
  /** Additional memory system options */
  options?: MemoryConfig["options"];
}
```

### Key-Value Provider

```typescript
// Basic operations
await kvProvider.set("key", value, { ttl: 3600 }); // TTL in seconds
const value = await kvProvider.get("key");
await kvProvider.delete("key");

// Batch operations
await kvProvider.setBatch(new Map([
  ["key1", "value1"],
  ["key2", "value2"]
]));
const results = await kvProvider.getBatch(["key1", "key2"]);

// Pattern matching
const keys = await kvProvider.keys("user:*");
const count = await kvProvider.count("session:*");

// Scanning
for await (const [key, value] of kvProvider.scan("prefix:*")) {
  console.log(key, value);
}
```

### Vector Provider

```typescript
// Index documents
await vectorProvider.index([
  {
    id: "doc1",
    content: "Document content",
    embedding: [...], // Vector array
    metadata: { category: "docs" },
    namespace: "documents"
  }
]);

// Search by vector
const results = await vectorProvider.search({
  embedding: [...],
  limit: 10,
  minScore: 0.7,
  namespace: "documents",
  filter: { category: "docs" },
  includeMetadata: true,
  includeContent: true
});

// Update and delete
await vectorProvider.update("doc1", { 
  content: "Updated content",
  metadata: { category: "updated" }
});
await vectorProvider.delete(["doc1", "doc2"]);
```

### Graph Provider

```typescript
// Add nodes and edges
await graphProvider.addNode({
  id: "person1",
  type: "Person",
  properties: { name: "Alice", age: 30 },
  labels: ["Employee", "Developer"]
});

await graphProvider.addEdge({
  id: "edge1",
  from: "person1",
  to: "person2",
  type: "KNOWS",
  properties: { since: "2020" }
});

// Find and traverse
const nodes = await graphProvider.findNodes({
  type: "Person",
  properties: { age: 30 }
});

const paths = await graphProvider.traverse({
  start: "person1",
  direction: "out",
  maxDepth: 3
});

const shortestPath = await graphProvider.shortestPath("person1", "person2");
```

## Health Monitoring

All providers include health monitoring:

```typescript
const health = await kvProvider.health();
console.log(health.status); // "healthy" | "unhealthy" | "degraded"
console.log(health.message);
```

## Environment Variables

Set these environment variables for your Supabase project:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

## Database Schema

The package automatically creates the following tables:

### Key-Value Store (`kv_store`)
```sql
CREATE TABLE kv_store (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  tags JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Vector Store (`vector_store`)
```sql
CREATE TABLE vector_store (
  id TEXT PRIMARY KEY,
  content TEXT,
  embedding vector(1536),
  metadata JSONB,
  namespace TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Graph Nodes (`graph_nodes`)
```sql
CREATE TABLE graph_nodes (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  labels TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Graph Edges (`graph_edges`)
```sql
CREATE TABLE graph_edges (
  id TEXT PRIMARY KEY,
  from_node TEXT NOT NULL,
  to_node TEXT NOT NULL,
  type TEXT NOT NULL,
  properties JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (from_node) REFERENCES graph_nodes(id) ON DELETE CASCADE,
  FOREIGN KEY (to_node) REFERENCES graph_nodes(id) ON DELETE CASCADE
);
```

## Migration from Legacy API

If you're upgrading from the old `BaseMemory` interface:

```typescript
// Old API
import { createSupabaseBaseMemory } from "@daydreamsai/supabase";

const memory = createSupabaseBaseMemory({
  url: process.env.SUPABASE_URL!,
  key: process.env.SUPABASE_ANON_KEY!,
  memoryTableName: "memory",
  vectorTableName: "embeddings"
});

// New API
import { createSupabaseMemory } from "@daydreamsai/supabase";

const memory = createSupabaseMemory({
  url: process.env.SUPABASE_URL!,
  key: process.env.SUPABASE_ANON_KEY!,
  kvTableName: "memory",        // Renamed from memoryTableName
  vectorTableName: "embeddings" // Same name
});
```

## Error Handling

All operations throw descriptive errors:

```typescript
try {
  await kvProvider.set("key", "value");
} catch (error) {
  console.error("Storage operation failed:", error.message);
}
```

## Contributing

See the main DaydreamsAI repository for contribution guidelines.

## License

MIT - See the main DaydreamsAI repository for license details.