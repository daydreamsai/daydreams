# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.3.22](https://github.com/daydreamsai/daydreams/compare/v0.3.21...v0.3.22) (2025-09-03)

**Note:** Version bump only for package @daydreamsai/mongodb





## [0.3.21](https://github.com/daydreamsai/daydreams/compare/v0.3.20...v0.3.21) (2025-08-25)

**Note:** Version bump only for package @daydreamsai/mongodb





## [0.3.20](https://github.com/daydreamsai/daydreams/compare/v0.3.19...v0.3.20) (2025-08-22)

**Note:** Version bump only for package @daydreamsai/mongodb





## [0.3.19](https://github.com/daydreamsai/daydreams/compare/v0.3.18...v0.3.19) (2025-08-21)

**Note:** Version bump only for package @daydreamsai/mongodb





## [0.3.18](https://github.com/daydreamsai/daydreams/compare/v0.3.17...v0.3.18) (2025-08-21)

**Note:** Version bump only for package @daydreamsai/mongodb





## [0.3.17](https://github.com/daydreamsai/daydreams/compare/v0.3.16...v0.3.17) (2025-08-21)

**Note:** Version bump only for package @daydreamsai/mongodb





## [0.3.16](https://github.com/daydreamsai/daydreams/compare/v0.3.15...v0.3.16) (2025-08-21)

**Note:** Version bump only for package @daydreamsai/mongodb





## [0.3.15](https://github.com/daydreamsai/daydreams/compare/v0.3.14...v0.3.15) (2025-08-19)

**Note:** Version bump only for package @daydreamsai/mongodb





## [0.3.14](https://github.com/daydreamsai/daydreams/compare/v0.3.13...v0.3.14) (2025-08-18)

**Note:** Version bump only for package @daydreamsai/mongodb





## [0.3.13](https://github.com/daydreamsai/daydreams/compare/v0.3.12...v0.3.13) (2025-08-17)

**Note:** Version bump only for package @daydreamsai/mongodb





## [0.3.12](https://github.com/daydreamsai/daydreams/compare/v0.3.11...v0.3.12) (2025-08-16)

**Note:** Version bump only for package @daydreamsai/mongodb





## [0.3.11](https://github.com/daydreamsai/daydreams/compare/v0.3.10...v0.3.11) (2025-08-16)

**Note:** Version bump only for package @daydreamsai/mongodb





## [0.3.10](https://github.com/daydreamsai/daydreams/compare/v0.3.9...v0.3.10) (2025-08-14)

**Note:** Version bump only for package @daydreamsai/mongodb





## [0.3.9](https://github.com/daydreamsai/daydreams/compare/v0.3.9-alpha.2...v0.3.9) (2025-08-10)

**Note:** Version bump only for package @daydreamsai/mongodb





## [0.3.9-alpha.2](https://github.com/daydreamsai/daydreams/compare/v0.3.9-alpha.1...v0.3.9-alpha.2) (2025-08-10)

**Note:** Version bump only for package @daydreamsai/mongodb





## [0.3.9-alpha.1](https://github.com/daydreamsai/daydreams/compare/v0.3.9-alpha.0...v0.3.9-alpha.1) (2025-08-09)

**Note:** Version bump only for package @daydreamsai/mongodb





## [0.3.9-alpha.0](https://github.com/daydreamsai/daydreams/compare/v0.3.8...v0.3.9-alpha.0) (2025-08-08)

**Note:** Version bump only for package @daydreamsai/mongodb





## [Unreleased] - New Memory System Integration

### ✨ Added
- **New Memory System**: Implementation of the new DaydreamsAI memory interface
- **MongoKVProvider**: Enhanced key-value storage with TTL support, batch operations, and health monitoring
- **Memory System Factory**: `createMongoMemory()` function for complete memory system setup
- **Health Monitoring**: Built-in health checks for MongoDB connectivity
- **Auto-Indexing**: Automatic creation of TTL and tag indexes
- **Comprehensive Documentation**: Updated README with examples and migration guide

### 🔄 Changed
- **Primary API**: `createMongoMemory()` is now the main entry point
- **Provider Architecture**: Switched from legacy MemoryStore to new provider-based system
- **Enhanced Features**: Added TTL support, batch operations, and better error handling

### ⚠️ Deprecated
- **Legacy Files**: Old memory system files are now deprecated:
  - `mongo.ts` - Use `createMongoKVProvider` instead
- **Legacy Functions**:
  - `MongoMemoryStore` class - Use `MongoKVProvider`
  - `createMongoMemoryStore()` - Use `createMongoMemory()`

### 🎯 Key Features
- **KV-Only Focus**: MongoDB provides only key-value storage (as designed)
- **In-Memory Fallback**: Vector and graph operations use in-memory providers
- **Persistent Storage**: Key-value data persists between application restarts
- **Performance Optimized**: Automatic indexing and connection pooling

### 📦 Migration Path
```typescript
// Old API (deprecated)
import { createMongoMemoryStore } from "@daydreamsai/mongo";
const store = await createMongoMemoryStore({ uri });

// New API (recommended)
import { createMongoMemory } from "@daydreamsai/mongo";
const memory = createMongoMemory({ uri });
await memory.initialize();
```

## [0.3.8](https://github.com/daydreamsai/daydreams/compare/v0.3.7...v0.3.8) (2025-06-18)

**Note:** Version bump only for package @daydreamsai/mongodb





## [0.3.7](https://github.com/daydreamsai/daydreams/compare/v0.3.7-alpha.7...v0.3.7) (2025-06-02)

**Note:** Version bump only for package @daydreamsai/mongodb





## [0.3.7-alpha.7](https://github.com/daydreamsai/daydreams/compare/v0.3.7-alpha.6...v0.3.7-alpha.7) (2025-05-28)

**Note:** Version bump only for package @daydreamsai/mongodb





## [0.3.7-alpha.6](https://github.com/daydreamsai/daydreams/compare/v0.3.7-alpha.5...v0.3.7-alpha.6) (2025-05-27)

**Note:** Version bump only for package @daydreamsai/mongodb





## [0.3.7-alpha.5](https://github.com/daydreamsai/daydreams/compare/v0.3.7-alpha.4...v0.3.7-alpha.5) (2025-05-27)

**Note:** Version bump only for package @daydreamsai/mongodb





## [0.3.7-alpha.4](https://github.com/daydreamsai/daydreams/compare/v0.3.7-alpha.3...v0.3.7-alpha.4) (2025-05-27)

**Note:** Version bump only for package @daydreamsai/mongodb





## [0.3.7-alpha.3](https://github.com/daydreamsai/daydreams/compare/v0.3.7-alpha.2...v0.3.7-alpha.3) (2025-05-27)

**Note:** Version bump only for package @daydreamsai/mongodb





## [0.3.7-alpha.2](https://github.com/daydreamsai/daydreams/compare/v0.3.7-alpha.1...v0.3.7-alpha.2) (2025-05-23)

**Note:** Version bump only for package @daydreamsai/mongodb





## [0.3.7-alpha.1](https://github.com/daydreamsai/daydreams/compare/v0.3.7-alpha.0...v0.3.7-alpha.1) (2025-05-22)

**Note:** Version bump only for package @daydreamsai/mongodb





## [0.3.7-alpha.0](https://github.com/daydreamsai/daydreams/compare/v0.3.6...v0.3.7-alpha.0) (2025-05-22)

**Note:** Version bump only for package @daydreamsai/mongodb
