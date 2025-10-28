# @daydreamsai/chroma

ChromaDB integration for the DaydreamsAI memory system. This package provides persistent vector storage using ChromaDB while using in-memory providers for key-value and graph operations.

## Installation

```bash
pnpm add @daydreamsai/chroma chromadb
```

## Setup

### 1. ChromaDB Installation & Setup

Choose one of the following options to run ChromaDB:

#### Option A: Docker (Recommended)
```bash
# Run ChromaDB server
docker run -p 8000:8000 chromadb/chroma
```

#### Option B: Python Installation
```bash
pip install chromadb
chroma run --host 0.0.0.0 --port 8000
```

#### Option C: Embedded Mode (Client-only)
ChromaDB can run embedded within your Node.js application (no separate server needed).

### 2. Environment Variables (Optional)

For OpenAI embeddings:
```bash
export OPENAI_API_KEY="your-openai-api-key"
```

## Quick Start

```typescript
import { createDreams } from "@daydreamsai/core";
import { createChromaMemory } from "@daydreamsai/chroma";

// Create memory system
const memory = createChromaMemory({
  path: "http://localhost:8000", // ChromaDB server URL
  collectionName: "my_agents", // optional, defaults to "daydreams_vectors"
});

// Initialize the memory system
await memory.initialize();

// Create agent with ChromaDB memory
const agent = createDreams({
  memory,
  // ... other config
});
```

## Configuration

### ChromaMemoryConfig

```typescript
interface ChromaMemoryConfig {
  /** ChromaDB connection URL/path (default: embedded mode) */
  path?: string;
  /** Collection name (default: "daydreams_vectors") */
  collectionName?: string;
  /** Custom embedding function from chromadb */
  embeddingFunction?: IEmbeddingFunction;
  /** Auth configuration for ChromaDB */
  auth?: {
    provider?: string;
    credentials?: any;
  };
  /** Additional metadata for the collection */
  metadata?: Record<string, any>;
  /** Memory system options */
  options?: MemoryConfig["options"];
}
```

## Features

### Vector Storage
- ✅ **Persistent Storage**: Vectors persist between application restarts
- ✅ **Embedding Models**: Support for OpenAI, custom, or default embeddings
- ✅ **Similarity Search**: Semantic search with configurable parameters
- ✅ **Namespaces**: Organize vectors by namespace/context
- ✅ **Metadata Filtering**: Filter searches by custom metadata
- ✅ **Health Monitoring**: Built-in connection health checks
- ✅ **Batch Operations**: Efficient bulk indexing and deletion

### Memory Architecture
- **Vector Storage**: ChromaDB (persistent)
- **KV Storage**: In-memory (session-only)
- **Graph Storage**: In-memory (session-only)

### Embedding Options
- **OpenAI Embeddings**: Automatic if `OPENAI_API_KEY` is set
- **Custom Functions**: Provide your own embedding function
- **Default Embeddings**: ChromaDB's built-in embeddings as fallback

## API Reference

### Core Functions

#### `createChromaMemory(config)`
Creates a complete memory system with ChromaDB vector storage.

```typescript
const memory = createChromaMemory({
  path: "http://localhost:8000",
  collectionName: "my_vectors",
  embeddingFunction: myCustomEmbedder,
  metadata: {
    project: "my-ai-project",
    version: "1.0.0"
  }
});
```

#### `createChromaVectorProvider(config)`
Creates just the vector provider for advanced use cases.

```typescript
import { createChromaVectorProvider } from "@daydreamsai/chroma";

const vectorProvider = createChromaVectorProvider({
  path: "http://localhost:8000",
  collectionName: "custom_collection"
});
```

### Memory Operations

All standard memory operations are supported:

```typescript
// Initialize
await memory.initialize();

// Health check
const health = await memory.health();
console.log(health.status); // "healthy" | "unhealthy"

// Vector operations
await memory.vector.index([
  {
    id: "doc1",
    content: "The quick brown fox",
    metadata: { category: "animals" },
    namespace: "examples"
  }
]);

const results = await memory.vector.search({
  query: "fast animals",
  namespace: "examples",
  limit: 5,
  includeMetadata: true
});

// KV operations (in-memory)
await memory.kv.set("user:123", { name: "Alice" });
const user = await memory.kv.get("user:123");
```

## Configuration Examples

### Embedded Mode (No Server)
```typescript
const memory = createChromaMemory({
  // No path specified - runs embedded
  collectionName: "my_collection"
});
```

### Remote Server with Auth
```typescript
const memory = createChromaMemory({
  path: "https://my-chroma-server.com",
  auth: {
    provider: "token",
    credentials: process.env.CHROMA_TOKEN
  }
});
```

### Custom Embedding Function
```typescript
import { OpenAIEmbeddingFunction } from "chromadb";

const memory = createChromaMemory({
  path: "http://localhost:8000",
  embeddingFunction: new OpenAIEmbeddingFunction({
    openai_api_key: process.env.OPENAI_API_KEY!,
    openai_model: "text-embedding-3-large" // Higher quality embeddings
  })
});
```

### Production Configuration
```typescript
const memory = createChromaMemory({
  path: process.env.CHROMA_URL || "http://localhost:8000",
  collectionName: `${process.env.APP_NAME}-vectors`,
  metadata: {
    environment: process.env.NODE_ENV,
    version: process.env.APP_VERSION,
    created_by: "daydreams-ai"
  },
  options: {
    learning: {
      enabled: true,
      model: myLanguageModel
    }
  }
});
```

## ChromaDB Schema

The ChromaDB provider stores vectors with this structure:

```typescript
{
  id: string,              // Document ID
  embedding: number[],     // Vector embedding
  document: string,        // Original content
  metadata: {
    namespace: string,     // Logical grouping
    indexed_at: string,    // Timestamp
    // ... custom metadata
  }
}
```

## Performance Considerations

### ChromaDB Limits
- **Collection size**: Millions of vectors supported
- **Embedding dimensions**: Up to 2048 dimensions typically
- **Query performance**: Sub-second for most datasets
- **Concurrent operations**: Good support for parallel queries

### Optimization Tips
1. **Batch Operations**: Use batch indexing for multiple documents
2. **Namespace Strategy**: Use namespaces to partition data logically
3. **Metadata Indexing**: ChromaDB automatically indexes metadata for filtering
4. **Embedding Quality**: Higher-quality embeddings improve search relevance
5. **Connection Pooling**: Reuse ChromaDB client connections

## Environment Variables

Supported environment variables for configuration:

```bash
# Embedding configuration
OPENAI_API_KEY="sk-..."                    # For OpenAI embeddings

# ChromaDB connection
CHROMA_URL="http://localhost:8000"         # ChromaDB server URL
CHROMA_COLLECTION="daydreams_vectors"      # Default collection name

# Authentication (if required)
CHROMA_TOKEN="your-auth-token"             # ChromaDB auth token
```

## Migration from Legacy API

If you're using the old ChromaVectorStore:

```typescript
// Old API (deprecated)
import { createChromaVectorStore } from "@daydreamsai/chroma";
const store = createChromaVectorStore("collection_name", "http://localhost:8000");

// New API (recommended)
import { createChromaMemory } from "@daydreamsai/chroma";
const memory = createChromaMemory({
  path: "http://localhost:8000",
  collectionName: "collection_name"
});
await memory.initialize();
```

The new API provides:
- Better type safety and error handling
- Standardized VectorProvider interface
- Health monitoring and connection management
- Namespace and metadata support
- Consistent interface across all memory providers

## Troubleshooting

### Common Issues

1. **Connection Errors**
   ```
   Error: Failed to initialize ChromaDB collection
   ```
   - Ensure ChromaDB server is running on the specified port
   - Check the `path` configuration matches your server URL

2. **Embedding Errors**
   ```
   Error: OpenAI API key not found
   ```
   - Set `OPENAI_API_KEY` environment variable, or
   - Provide a custom `embeddingFunction` in config

3. **Collection Issues**
   ```
   Error: Collection already exists with different configuration
   ```
   - Use a different `collectionName`, or
   - Delete the existing collection in ChromaDB

4. **Memory Issues**
   ```
   Error: Embedding dimension mismatch
   ```
   - Ensure all documents use the same embedding model
   - Clear the collection if switching embedding models

### Debug Mode

Enable debug logging:

```typescript
const memory = createChromaMemory({
  path: "http://localhost:8000",
  metadata: {
    debug: true // Add debug metadata
  }
});

// Monitor health
setInterval(async () => {
  const health = await memory.health();
  console.log("Vector storage health:", health);
}, 30000);
```

### Performance Monitoring

```typescript
// Monitor vector operations
const startTime = Date.now();
await memory.vector.search({ query: "example" });
console.log(`Search took ${Date.now() - startTime}ms`);

// Check collection size
const count = await memory.vector.count();
console.log(`Collection contains ${count} vectors`);
```

## Docker Compose Example

For development setup:

```yaml
version: '3.8'
services:
  chromadb:
    image: chromadb/chroma:latest
    ports:
      - "8000:8000"
    environment:
      - CHROMA_SERVER_HOST=0.0.0.0
    volumes:
      - chroma_data:/chroma/chroma
      
volumes:
  chroma_data:
```

## License

MIT License - see LICENSE file for details.