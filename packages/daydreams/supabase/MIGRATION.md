# Migration Guide: Supabase Package v1.0

This guide helps you migrate from the old Supabase package API to the new memory system.

## Overview

The Supabase package has been completely rewritten to support the new DaydreamsAI memory system. The new system provides:

- **Complete Memory Interface**: Supports all memory types (working, kv, vector, facts, episodes, semantic, graph)
- **Provider Architecture**: Modular providers for different storage types
- **Better Performance**: Optimized queries and batch operations
- **Type Safety**: Improved TypeScript support
- **Health Monitoring**: Built-in health checks

## Migration Steps

### 1. Update Imports

**Old API:**
```typescript
import { 
  createSupabaseBaseMemory,
  createSupabaseMemoryStore,
  createSupabaseVectorStore,
  createOpenAIEmbeddingProvider
} from "@daydreamsai/supabase";
```

**New API:**
```typescript
import { 
  createSupabaseMemory,
  createSupabaseKVProvider,
  createSupabaseVectorProvider,
  createSupabaseGraphProvider
} from "@daydreamsai/supabase";
```

### 2. Update Memory System Creation

**Old API:**
```typescript
// Old BaseMemory approach
const memory = createSupabaseBaseMemory({
  url: process.env.SUPABASE_URL!,
  key: process.env.SUPABASE_ANON_KEY!,
  memoryTableName: "memory",
  vectorTableName: "embeddings",
  vectorModel: someEmbeddingModel
});
```

**New API:**
```typescript
// New MemorySystem approach
const memory = createSupabaseMemory({
  url: process.env.SUPABASE_URL!,
  key: process.env.SUPABASE_ANON_KEY!,
  kvTableName: "memory",        // Renamed from memoryTableName
  vectorTableName: "embeddings", // Same name
  embeddingDimension: 1536      // Specify dimension instead of model
});

// Initialize the memory system
await memory.initialize();
```

### 3. Update Agent Configuration

**Old API:**
```typescript
const agent = createDreams({
  memory,  // BaseMemory
  // ... other config
});
```

**New API:**
```typescript
const agent = createDreams({
  memory,  // MemorySystem
  // ... other config
});
```

### 4. Update Individual Provider Usage

**Old Memory Store:**
```typescript
const store = createSupabaseMemoryStore({
  url: process.env.SUPABASE_URL!,
  key: process.env.SUPABASE_ANON_KEY!,
  tableName: "memory"
});

await store.set("key", value);
const value = await store.get("key");
```

**New KV Provider:**
```typescript
const kvProvider = createSupabaseKVProvider({
  url: process.env.SUPABASE_URL!,
  key: process.env.SUPABASE_ANON_KEY!,
  tableName: "memory"
});

await kvProvider.initialize();
await kvProvider.set("key", value, { ttl: 3600 }); // Now supports TTL
const value = await kvProvider.get("key");
```

**Old Vector Store:**
```typescript
const vectorStore = createSupabaseVectorStore(
  {
    url: process.env.SUPABASE_URL!,
    key: process.env.SUPABASE_ANON_KEY!,
    tableName: "embeddings",
    embeddingColumnName: "embedding",
    contentColumnName: "content",
    metadataColumnName: "metadata"
  },
  embeddingProvider
);

await vectorStore.upsert("context", data);
const results = await vectorStore.search("context", embedding, { threshold: 0.7 });
```

**New Vector Provider:**
```typescript
const vectorProvider = createSupabaseVectorProvider({
  url: process.env.SUPABASE_URL!,
  key: process.env.SUPABASE_ANON_KEY!,
  tableName: "embeddings",
  embeddingDimension: 1536
});

await vectorProvider.initialize();
await vectorProvider.index([{
  id: "doc1",
  content: "content",
  embedding: [...],
  metadata: { ... },
  namespace: "context"
}]);

const results = await vectorProvider.search({
  embedding: [...],
  minScore: 0.7,
  namespace: "context",
  limit: 10
});
```

## Database Schema Changes

### Table Renames and Structure

**Old Tables:**
- `memory` - Simple key-value storage
- `embeddings` - Vector storage

**New Tables:**
- `kv_store` - Enhanced key-value storage with TTL and tags
- `vector_store` - Enhanced vector storage with namespaces
- `graph_nodes` - New graph node storage
- `graph_edges` - New graph edge storage

### Migration SQL

If you have existing data, you may need to migrate your tables:

```sql
-- Migrate memory table to kv_store
CREATE TABLE kv_store AS 
SELECT 
  key,
  value,
  NULL as expires_at,
  NULL as tags,
  created_at,
  updated_at
FROM memory;

-- Migrate embeddings table to vector_store  
CREATE TABLE vector_store AS
SELECT
  key as id,
  content,
  embedding,
  metadata,
  NULL as namespace,
  created_at,
  updated_at
FROM embeddings;

-- Drop old tables (after confirming data migration)
-- DROP TABLE memory;
-- DROP TABLE embeddings;
```

## New Features Available

### Enhanced Key-Value Storage
```typescript
// TTL support
await kvProvider.set("session", data, { ttl: 3600 });

// Batch operations
await kvProvider.setBatch(new Map([
  ["key1", "value1"],
  ["key2", "value2"]
]));

// Pattern matching
const sessionKeys = await kvProvider.keys("session:*");

// Scanning
for await (const [key, value] of kvProvider.scan("user:*")) {
  console.log(key, value);
}
```

### Enhanced Vector Storage
```typescript
// Namespace support
await vectorProvider.index([{
  id: "doc1",
  content: "content",
  embedding: [...],
  namespace: "documents"
}]);

// Advanced filtering
const results = await vectorProvider.search({
  embedding: [...],
  namespace: "documents",
  filter: { category: "important" },
  minScore: 0.8,
  includeMetadata: true
});
```

### New Graph Storage
```typescript
// Store entities and relationships
await graphProvider.addNode({
  id: "person1",
  type: "Person",
  properties: { name: "Alice" },
  labels: ["Employee"]
});

await graphProvider.addEdge({
  id: "edge1",
  from: "person1",
  to: "person2",
  type: "KNOWS"
});

// Graph traversal
const paths = await graphProvider.traverse({
  start: "person1",
  direction: "out",
  maxDepth: 3
});
```

### Health Monitoring
```typescript
const health = await kvProvider.health();
console.log(health.status); // "healthy" | "unhealthy" | "degraded"
```

## Breaking Changes

1. **Function Names**: Most factory functions have been renamed
2. **Configuration Objects**: New configuration structure with different property names
3. **Return Types**: Methods now return different types aligned with the new memory interface
4. **Initialization**: Explicit `initialize()` call required for providers
5. **Embedding Models**: No longer handled by Supabase package - use core framework models

## Deprecation Timeline

- **Current**: All old APIs are deprecated but still functional
- **Next Major Version**: Old APIs will be removed entirely
- **Recommendation**: Migrate to new APIs as soon as possible

## Troubleshooting

### Common Issues

1. **"MemoryStore is not assignable to MemorySystem"**
   - Update to use `createSupabaseMemory()` instead of individual stores

2. **"Table does not exist"**
   - Ensure you run `await memory.initialize()` or `await provider.initialize()`

3. **"Function execute_sql does not exist"**
   - Run the SQL setup script from the README to create required functions

4. **"Cannot find module '@daydreamsai/core'"**
   - Update `@daydreamsai/core` to the latest version

### Getting Help

1. Check the [README.md](./README.md) for complete API documentation
2. Look at examples in the DaydreamsAI repository
3. Open an issue if you encounter migration problems

## Example: Complete Migration

**Before (Old API):**
```typescript
import { createSupabaseBaseMemory } from "@daydreamsai/supabase";
import { createDreams } from "@daydreamsai/core";

const memory = createSupabaseBaseMemory({
  url: process.env.SUPABASE_URL!,
  key: process.env.SUPABASE_ANON_KEY!,
  memoryTableName: "chat_memory",
  vectorTableName: "chat_embeddings"
});

const agent = createDreams({ memory });
```

**After (New API):**
```typescript
import { createSupabaseMemory } from "@daydreamsai/supabase";
import { createDreams } from "@daydreamsai/core";

const memory = createSupabaseMemory({
  url: process.env.SUPABASE_URL!,
  key: process.env.SUPABASE_ANON_KEY!,
  kvTableName: "chat_memory",
  vectorTableName: "chat_embeddings"
});

// Initialize the memory system
await memory.initialize();

const agent = createDreams({ memory });
```

That's it! Your Supabase memory system is now using the new architecture with enhanced capabilities. 🚀