# @daydreamsai/firebase

Firebase Firestore integration for the DaydreamsAI memory system. This package provides persistent key-value storage using Firebase Firestore while using in-memory providers for vector and graph operations.

## Installation

```bash
pnpm add @daydreamsai/firebase firebase-admin
```

## Setup

### 1. Firebase Project Setup

1. Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database
3. Generate a service account key:
   - Go to Project Settings > Service Accounts
   - Click "Generate new private key"
   - Download the JSON file

### 2. Authentication Options

You can authenticate with Firebase in two ways:

#### Option A: Service Account Object
```typescript
import { createFirebaseMemory } from "@daydreamsai/firebase";

const memory = createFirebaseMemory({
  serviceAccount: {
    projectId: "your-project-id",
    clientEmail: "your-service-account@your-project.iam.gserviceaccount.com",
    privateKey: "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
  }
});
```

#### Option B: Environment Variables
Set these environment variables and omit the `serviceAccount` config:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
# OR
export FIREBASE_PROJECT_ID="your-project-id"
export FIREBASE_CLIENT_EMAIL="your-service-account@your-project.iam.gserviceaccount.com"
export FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

```typescript
const memory = createFirebaseMemory({
  // No serviceAccount needed - uses environment variables
});
```

## Quick Start

```typescript
import { createDreams } from "@daydreamsai/core";
import { createFirebaseMemory } from "@daydreamsai/firebase";

// Create memory system
const memory = createFirebaseMemory({
  serviceAccount: {
    projectId: "your-project-id",
    clientEmail: "your-service-account@your-project.iam.gserviceaccount.com",
    privateKey: process.env.FIREBASE_PRIVATE_KEY!
  },
  collectionName: "daydreams_kv", // optional, defaults to "kv_store"
});

// Initialize the memory system
await memory.initialize();

// Create agent with Firebase memory
const agent = createDreams({
  memory,
  // ... other config
});
```

## Configuration

### FirebaseMemoryConfig

```typescript
interface FirebaseMemoryConfig {
  /** Firebase service account configuration (optional if using env vars) */
  serviceAccount?: {
    projectId: string;
    clientEmail: string;
    privateKey: string;
  };
  /** Firestore collection name (default: "kv_store") */
  collectionName?: string;
  /** Max retries for operations (default: 3) */
  maxRetries?: number;
  /** Base retry delay in ms (default: 1000) */
  retryDelay?: number;
  /** Memory system options */
  options?: MemoryConfig["options"];
}
```

## Features

### Key-Value Storage
- ✅ **Persistent Storage**: Data persists between application restarts
- ✅ **TTL Support**: Automatic expiration of keys
- ✅ **Batch Operations**: Efficient bulk operations
- ✅ **Tag Support**: Organize data with custom tags
- ✅ **Pattern Matching**: Query keys with glob patterns
- ✅ **Health Monitoring**: Built-in connection health checks
- ✅ **Automatic Retry**: Handles transient Firebase errors

### Memory Architecture
- **KV Storage**: Firebase Firestore (persistent)
- **Vector Storage**: In-memory (session-only)
- **Graph Storage**: In-memory (session-only)

### Error Handling
- Automatic retry with exponential backoff
- Handles Firebase-specific errors (RST_STREAM, INTERNAL, etc.)
- Graceful fallback for connection issues
- Comprehensive error logging

## API Reference

### Core Functions

#### `createFirebaseMemory(config)`
Creates a complete memory system with Firebase KV storage.

```typescript
const memory = createFirebaseMemory({
  serviceAccount: {
    projectId: "my-project",
    clientEmail: "service@my-project.iam.gserviceaccount.com",
    privateKey: "-----BEGIN PRIVATE KEY-----\n..."
  },
  collectionName: "my_kv_store",
  maxRetries: 5,
  retryDelay: 2000
});
```

#### `createFirebaseKVProvider(config)`
Creates just the KV provider for advanced use cases.

```typescript
import { createFirebaseKVProvider } from "@daydreamsai/firebase";

const kvProvider = createFirebaseKVProvider({
  serviceAccount: { /* ... */ },
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

// KV operations
await memory.kv.set("user:123", { name: "Alice" });
const user = await memory.kv.get("user:123");

// TTL support
await memory.kv.set("session:abc", { token: "xyz" }, { ttl: 3600 }); // 1 hour

// Batch operations
const entries = new Map([
  ["key1", "value1"],
  ["key2", "value2"]
]);
await memory.kv.setBatch(entries);

// Pattern matching
const userKeys = await memory.kv.keys("user:*");

// Scanning
for await (const [key, value] of memory.kv.scan("session:*")) {
  console.log(key, value);
}
```

## Firestore Schema

The Firebase provider stores data in Firestore documents with this structure:

```typescript
{
  value: any,           // Your stored data
  expiresAt?: Date,     // TTL expiration (optional)
  tags?: { [key]: string }, // Custom tags (optional)
  createdAt: Date,      // Creation timestamp
  updatedAt: Date       // Last update timestamp
}
```

## Performance Considerations

### Firestore Limits
- **Document size**: Max 1MB per document
- **Writes**: 1 write per second per document
- **Reads**: No limit, but costs scale with usage
- **Collections**: Virtually unlimited

### Optimization Tips
1. **Batch Operations**: Use `setBatch`/`getBatch` for multiple operations
2. **Connection Reuse**: Initialize Firebase app once, reuse across providers
3. **TTL Management**: Use TTL to automatically clean up expired data
4. **Key Design**: Use hierarchical keys (`user:123:profile`) for better organization

## Environment Variables

Supported environment variables for configuration:

```bash
# Firebase authentication
GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="service@your-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Optional configuration
FIREBASE_COLLECTION_NAME="kv_store"
FIREBASE_MAX_RETRIES="3"
FIREBASE_RETRY_DELAY="1000"
```

## Migration from Legacy API

If you're using the old Firebase memory store:

```typescript
// Old API (deprecated)
import { createFirebaseMemoryStore } from "@daydreamsai/firebase";
const store = await createFirebaseMemoryStore({ serviceAccount });

// New API (recommended)
import { createFirebaseMemory } from "@daydreamsai/firebase";
const memory = createFirebaseMemory({ serviceAccount });
await memory.initialize();
```

The new API provides:
- Better type safety
- Enhanced error handling
- TTL and tagging support
- Batch operations
- Health monitoring
- Consistent interface across all memory providers

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   ```
   Error: Could not load the default credentials
   ```
   - Ensure `GOOGLE_APPLICATION_CREDENTIALS` is set, or provide `serviceAccount` in config
   - Verify the service account JSON file exists and is readable

2. **Permission Errors**
   ```
   Error: Missing or insufficient permissions
   ```
   - Ensure your service account has "Firestore Admin" or "Cloud Datastore User" role
   - Check Firebase project permissions

3. **Connection Timeouts**
   ```
   Error: RST_STREAM or INTERNAL errors
   ```
   - These are automatically retried with exponential backoff
   - Check network connectivity and Firebase service status

4. **Firestore Rules**
   - Ensure Firestore security rules allow your service account to read/write
   - For server-side usage, rules typically allow all operations for authenticated users

### Debug Mode

Enable debug logging:

```typescript
const memory = createFirebaseMemory({
  serviceAccount: { /* ... */ },
  maxRetries: 5, // Increase retries for debugging
});

// Monitor health
setInterval(async () => {
  const health = await memory.health();
  console.log("Memory health:", health);
}, 30000);
```

## License

MIT License - see LICENSE file for details. 