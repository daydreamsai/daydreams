# Memory System Comprehensive Example

This directory contains comprehensive examples demonstrating the memory system capabilities of Daydreams, including key-value storage, vector embeddings, and graph relationships using both in-memory providers (for testing) and Supabase as the backend.

## Prerequisites

### For In-Memory Examples (Recommended for Testing)
No additional setup required - these examples use in-memory providers and only need:
- `OPENAI_API_KEY` environment variable

### For Supabase Examples (Production Use)
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Enable the `pgvector` extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
3. Create the required function:
   ```sql
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

## Environment Variables

### For In-Memory Examples
```bash
OPENAI_API_KEY=your_openai_api_key
```

### For Supabase Examples
```bash
OPENAI_API_KEY=your_openai_api_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
```

## Examples

### 1. Interactive Agent Example (In-Memory)

```bash
npm run example
```

Runs the main interactive agent using in-memory providers. Demonstrates all memory types working together.

### 2. Supabase Production Example

```bash
npm run example:supabase
```

Demonstrates the complete Supabase integration with persistent storage and automatic embedding generation.

### 3. Individual Memory Type Tests (In-Memory)

```bash
# Test key-value memory operations
npm run test:kv

# Test vector memory and semantic search
npm run test:vector

# Test graph memory and relationships
npm run test:graph

# Test unified memory system
npm run test:unified

# Run comprehensive test suite
npm run test:all
```

## Files Overview

### Core Examples
- `index.ts` - Main interactive agent using in-memory providers
- `supabase-example.ts` - Production Supabase integration example

### Test Suite (In-Memory)
- `test-kv-memory.ts` - Key-value storage testing (CRUD, TTL, patterns)
- `test-vector-memory.ts` - Vector search and semantic similarity testing
- `test-graph-memory.ts` - Graph relationships and path finding
- `test-unified-memory.ts` - Cross-memory-type integration testing
- `test-all-memory-features.ts` - Complete test suite with performance benchmarks

### Documentation
- `package.json` - Scripts and dependencies
- `setup.md` - Detailed setup instructions
- `README.md` - This file

## Memory System Features Demonstrated

### Key-Value Memory
- **Basic CRUD**: Set, get, delete operations
- **Batch Operations**: Multi-key operations for efficiency  
- **TTL Support**: Automatic expiration of temporary data (in-memory only)
- **Pattern Matching**: Wildcard key searches
- **Tags & Metadata**: Rich data organization

### Vector Memory
- **Document Indexing**: Store text with automatic embeddings
- **Semantic Search**: Find similar content using AI embeddings
- **Metadata Filtering**: Combine semantic and structured queries
- **Namespace Isolation**: Separate vector collections
- **Similarity Thresholds**: Control result quality
- **Bulk Operations**: Efficient batch indexing

### Graph Memory
- **Entity Management**: Create and manage typed entities
- **Relationship Mapping**: Model complex connections
- **Path Finding**: Discover relationships between entities
- **Related Entity Queries**: Find connected entities
- **Property Storage**: Rich metadata on entities and relationships

### Unified Operations
- **Cross-Memory Queries**: Combine KV, vector, and graph data
- **Consistent State**: Synchronized updates across memory types
- **Performance Optimization**: Choose the right memory type for each query
- **Data Relationships**: Model complex data with multiple perspectives

## Architecture Differences

### In-Memory Providers (Testing)
- ✅ Fast development and testing
- ✅ No external dependencies
- ✅ All memory features supported
- ❌ Data lost when process restarts
- ❌ No cross-process sharing

### Supabase Providers (Production)
- ✅ Persistent storage
- ✅ Scalable PostgreSQL backend
- ✅ Automatic embedding generation
- ✅ Cross-process data sharing
- ❌ Requires Supabase setup
- ❌ Network latency

## Expected Output

When running the examples, you'll see:

### In-Memory Examples
1. **Memory System Initialization**: Instant in-memory setup
2. **Agent Startup**: Context loading and action registration
3. **Interactive Prompts**: CLI interface for testing memory operations
4. **Memory Operations**: Real-time feedback on storage operations
5. **Search Results**: Semantic search results with similarity scores
6. **Graph Relationships**: Entity connections and discoveries
7. **Performance Metrics**: Fast operation timings

### Supabase Examples
1. **Database Connection**: Supabase connection and table setup
2. **Embedding Generation**: Automatic vector embedding creation
3. **Persistent Storage**: Data persists between runs
4. **Real-time Search**: Production-ready semantic search
5. **Scalable Operations**: Database-backed performance

## Key Implementation Patterns

### Context Memory vs System Memory
```typescript
// Context memory (per conversation/session)
ctx.memory.notesCount++; // Context-specific state

// System memory (shared across contexts)
ctx.memory.kv.set(key, value); // Key-value storage
ctx.memory.vector.search(query); // Semantic search
ctx.memory.graph.findRelated(id); // Graph relationships
```

### Correct API Usage
```typescript
// ✅ Correct entity creation
await memory.graph.addEntity({
  id: "user:123",
  type: "user", 
  name: "Alice",
  properties: { email: "alice@example.com" },
  contextIds: ["chat:session1"]
});

// ✅ Correct relationship creation  
await memory.graph.addRelationship({
  id: "rel:user-likes-coffee",
  from: "user:123",
  to: "preference:coffee",
  type: "likes",
  strength: 0.9
});

// ✅ Correct vector search
const results = await memory.vector.search({
  query: "coffee preferences",
  filter: { userId: "123" },
  includeContent: true,
  includeMetadata: true,
  limit: 5
});
```

## Troubleshooting

### Common Issues
1. **Vector search fails**: Ensure embeddings are properly generated (use in-memory providers for testing)
2. **Graph queries return empty**: Check entity IDs and relationship types match exactly
3. **Memory initialization errors**: Verify environment variables and database setup
4. **Type errors**: Use the correct APIs (`findRelated` not `getNeighbors`, `addEntity` not `addNode`)

### Performance Tips
1. Use appropriate memory types for different use cases
2. Batch operations when possible
3. Set reasonable limits on search results
4. Use metadata filtering to narrow search scope

This comprehensive example suite provides both development-friendly testing tools and production-ready integration patterns for implementing memory systems in Daydreams applications.

**Recommendation**: Start with the in-memory examples for development and testing, then move to Supabase examples for production deployment.