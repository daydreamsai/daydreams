# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [Unreleased] - New Memory System Integration

### ✨ Added
- **New Memory System**: Implementation of the new DaydreamsAI memory interface
- **FirebaseKVProvider**: Enhanced key-value storage with TTL support, batch operations, and health monitoring
- **Memory System Factory**: `createFirebaseMemory()` function for complete memory system setup
- **Health Monitoring**: Built-in health checks for Firebase/Firestore connectivity
- **Auto-Retry Logic**: Exponential backoff retry for transient Firebase errors
- **Comprehensive Documentation**: Updated README with examples and migration guide

### 🔄 Changed
- **Primary API**: `createFirebaseMemory()` is now the main entry point
- **Provider Architecture**: Switched from legacy MemoryStore to new provider-based system
- **Enhanced Features**: Added TTL support, batch operations, and better error handling

### ⚠️ Deprecated
- **Legacy Files**: Old memory system files are now deprecated:
  - `firebase.ts` - Use `createFirebaseKVProvider` instead
- **Legacy Functions**:
  - `FirebaseMemoryStore` class - Use `FirebaseKVProvider`
  - `createFirebaseMemoryStore()` - Use `createFirebaseMemory()`

### 🎯 Key Features
- **KV-Only Focus**: Firebase provides only key-value storage (as designed)
- **In-Memory Fallback**: Vector and graph operations use in-memory providers
- **Persistent Storage**: Key-value data persists between application restarts
- **Performance Optimized**: Connection reuse and automatic retry logic
- **Firestore Integration**: Full Firebase Admin SDK integration with service account support

### 📦 Migration Path
```typescript
// Old API (deprecated)
import { createFirebaseMemoryStore } from "@daydreamsai/firebase";
const store = await createFirebaseMemoryStore({ serviceAccount });

// New API (recommended)
import { createFirebaseMemory } from "@daydreamsai/firebase";
const memory = createFirebaseMemory({ serviceAccount });
await memory.initialize();
```

## [0.3.8](https://github.com/daydreamsai/daydreams/compare/v0.3.7...v0.3.8) (2025-06-18)

**Note:** Version bump only for package @daydreamsai/firebase





## [0.3.7](https://github.com/daydreamsai/daydreams/compare/v0.3.7-alpha.7...v0.3.7) (2025-06-02)

**Note:** Version bump only for package @daydreamsai/firebase





## [0.3.7-alpha.7](https://github.com/daydreamsai/daydreams/compare/v0.3.7-alpha.6...v0.3.7-alpha.7) (2025-05-28)

**Note:** Version bump only for package @daydreamsai/firebase





## [0.3.7-alpha.6](https://github.com/daydreamsai/daydreams/compare/v0.3.7-alpha.5...v0.3.7-alpha.6) (2025-05-27)

**Note:** Version bump only for package @daydreamsai/firebase





## [0.3.7-alpha.5](https://github.com/daydreamsai/daydreams/compare/v0.3.7-alpha.4...v0.3.7-alpha.5) (2025-05-27)

**Note:** Version bump only for package @daydreamsai/firebase





## [0.3.7-alpha.4](https://github.com/daydreamsai/daydreams/compare/v0.3.7-alpha.3...v0.3.7-alpha.4) (2025-05-27)

**Note:** Version bump only for package @daydreamsai/firebase





## [0.3.7-alpha.3](https://github.com/daydreamsai/daydreams/compare/v0.3.7-alpha.2...v0.3.7-alpha.3) (2025-05-27)


### Bug Fixes

* added missing keys property ([4500a53](https://github.com/daydreamsai/daydreams/commit/4500a53273037acaa8e932dd888135681767a2ca))
* fixed keys property ([abe08ce](https://github.com/daydreamsai/daydreams/commit/abe08cea213fe52daa1db66b08935b17690944d9))
