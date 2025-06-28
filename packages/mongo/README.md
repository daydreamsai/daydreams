# @daydreamsai/mongo

A MongoDB integration package for the DaydreamsAI platform, providing persistent key-value storage capabilities.

## Features

- **Key-Value Storage**: Persistent storage using MongoDB with TTL support and batch operations
- **Health Monitoring**: Built-in health checks for MongoDB connectivity
- **Auto-Indexing**: Automatic creation of optimized indexes for performance
- **Fully Typed**: Complete TypeScript support with proper error handling
- **Memory System Integration**: Works seamlessly with the DaydreamsAI memory system

> **Note**: This package only provides key-value storage via MongoDB. Vector and graph operations use in-memory providers from the core framework.

## Installation

```bash
npm install @daydreamsai/mongo
# or
yarn add @daydreamsai/mongo
# or
pnpm add @daydreamsai/mongo
```

## Prerequisites

- **MongoDB Instance**: You need access to a MongoDB database (local, Atlas, or self-hosted)
- **Node.js**: Version 18 or higher

## Quick Start

### Basic Memory System

```typescript
import { createMongoMemory } from "@daydreamsai/mongo";
import { createDreams } from "@daydreamsai/core";

// Create the memory system
const memory = createMongoMemory({
  uri: process.env.MONGODB_URI!,
  dbName: "daydreams_memory",        // Optional: defaults to "daydreams_memory"
  collectionName: "kv_store",        // Optional: defaults to "kv_store"
});

// Initialize the memory system
await memory.initialize();

// Create your agent with MongoDB memory
const agent = createDreams({
  memory,
  // ... other configuration
});
```

### Using Individual KV Provider

```typescript
import { createMongoKVProvider } from "@daydreamsai/mongo";

// Key-Value storage only
const kvProvider = createMongoKVProvider({
  uri: process.env.MONGODB_URI!,
  dbName: "my_app_data",
  collectionName: "kv_storage",
});

await kvProvider.initialize();

// Store and retrieve data
await kvProvider.set("user:123", { name: "John", age: 30 });
const user = await kvProvider.get("user:123");

// Use TTL (time-to-live) for temporary data
await kvProvider.set("session:abc", sessionData, { ttl: 3600 }); // Expires in 1 hour
```

## API Reference

### Memory System

The main `createMongoMemory()` function creates a memory system with MongoDB KV storage:

```typescript
interface MongoMemoryConfig {
  /** MongoDB connection URI */
  uri: string;
  /** Database name */
  dbName?: string;
  /** Collection name for key-value storage */
  collectionName?: string;
  /** Additional memory system options */
  options?: MemoryConfig["options"];
}
```

### Key-Value Provider

```typescript
// Basic operations
await kvProvider.set("key", value, { ttl: 3600 }); // TTL in seconds
const value = await kvProvider.get("key");
const exists = await kvProvider.exists("key");
await kvProvider.delete("key");

// Batch operations
await kvProvider.setBatch(new Map([
  ["key1", "value1"],
  ["key2", "value2"]
]));
const results = await kvProvider.getBatch(["key1", "key2"]);

// Pattern operations (limited functionality with hashed keys)
const count = await kvProvider.count();

// Scanning through all keys
for await (const [key, value] of kvProvider.scan()) {
  console.log(key, value);
}
```

## Health Monitoring

```typescript
const health = await kvProvider.health();
console.log(health.status); // "healthy" | "unhealthy"
console.log(health.message);
```

## Environment Variables

Set this environment variable for your MongoDB connection:

```env
MONGODB_URI=mongodb://localhost:27017/myapp
# or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/myapp
```

## Database Schema

The package automatically creates the following collection with optimized indexes:

### Key-Value Collection (`kv_store`)

```javascript
{
  _id: "hashed_key",           // SHA-256 hash of the original key
  value: { ... },              // The stored value (any JSON-serializable data)
  expiresAt: ISODate("..."),   // Optional: TTL expiration date
  tags: { "key": "value" },    // Optional: metadata tags
  createdAt: ISODate("..."),   // Document creation timestamp
  updatedAt: ISODate("...")    // Last update timestamp
}
```

### Indexes

The provider automatically creates these indexes for optimal performance:

1. **TTL Index**: `{ expiresAt: 1 }` - Automatic document expiration
2. **Tags Index**: `{ tags: 1 }` - Fast tag-based queries (sparse)

## Memory System Architecture

MongoDB provides only key-value storage. Other memory types use in-memory providers:

- **KV Storage**: MongoDB (persistent)
- **Vector Storage**: In-memory (not persistent)
- **Graph Storage**: In-memory (not persistent)
- **Working Memory**: In-memory (current session only)
- **Facts/Episodes/Semantic**: Built on top of KV + Vector + Graph

## Migration from Legacy API

If you're upgrading from the old MongoDB API:

```typescript
// Old API (deprecated)
import { createMongoMemoryStore } from "@daydreamsai/mongo";

const store = await createMongoMemoryStore({
  uri: process.env.MONGODB_URI!,
  dbName: "dreams_memory",
  collectionName: "conversations"
});

// New API (recommended)
import { createMongoMemory } from "@daydreamsai/mongo";

const memory = createMongoMemory({
  uri: process.env.MONGODB_URI!,
  dbName: "dreams_memory",
  collectionName: "conversations"
});

await memory.initialize();
```

## Key Limitations

### Hashed Keys
For security and performance, MongoDB stores SHA-256 hashes of keys rather than original keys. This means:

- `keys()` returns hashed keys, not original keys
- Pattern matching has limited functionality
- You cannot reverse-lookup original keys from stored data

### No Vector/Graph Persistence
MongoDB integration only provides key-value storage. Vector embeddings and graph data are stored in memory and will not persist between application restarts.

For persistent vector/graph storage, consider using:
- `@daydreamsai/supabase` - Full persistence (KV + Vector + Graph)
- `@daydreamsai/chroma` - Vector storage only

## Error Handling

All operations throw descriptive errors:

```typescript
try {
  await kvProvider.set("key", "value");
} catch (error) {
  console.error("MongoDB operation failed:", error.message);
}
```

Common errors:
- `"MongoDB not initialized"` - Call `await provider.initialize()` first
- Connection errors - Check your MongoDB URI and network connectivity
- Authentication errors - Verify your MongoDB credentials

## Performance Considerations

1. **Connection Pooling**: The MongoDB client uses connection pooling automatically
2. **Batch Operations**: Use `setBatch()` and `getBatch()` for multiple operations
3. **TTL Cleanup**: MongoDB automatically removes expired documents
4. **Indexing**: Indexes are created automatically for optimal query performance

## Example: Complete Setup

```typescript
import { createMongoMemory } from "@daydreamsai/mongo";
import { createDreams } from "@daydreamsai/core";

async function setupAgent() {
  // Create MongoDB memory system
  const memory = createMongoMemory({
    uri: process.env.MONGODB_URI!,
    dbName: "my_agent_memory",
    collectionName: "agent_kv_data"
  });

  // Initialize the memory system
  await memory.initialize();

  // Test connectivity
  const health = await memory.kv.health();
  if (health.status !== "healthy") {
    throw new Error(`MongoDB unhealthy: ${health.message}`);
  }

  // Create agent
  const agent = createDreams({
    memory,
    // ... other configuration
  });

  return agent;
}

// Usage
const agent = await setupAgent();
```

## Contributing

See the main DaydreamsAI repository for contribution guidelines.

## License

MIT - See the main DaydreamsAI repository for license details.