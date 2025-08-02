# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [Unreleased] - Complete Memory System Rewrite

### ✨ Added
- **New Memory System**: Complete implementation of the new DaydreamsAI memory interface
- **SupabaseKVProvider**: Key-value storage with TTL support, batch operations, and pattern matching
- **SupabaseVectorProvider**: Vector storage using pgvector with similarity search and namespaces
- **SupabaseGraphProvider**: Graph storage for nodes and edges with traversal algorithms
- **Health Monitoring**: Built-in health checks for all storage providers
- **Auto-Initialization**: Automatic table creation and schema setup
- **Comprehensive Documentation**: Updated README with examples and migration guide

### 🔄 Changed
- **Primary API**: `createSupabaseMemory()` is now the main entry point
- **Provider Architecture**: Switched from legacy BaseMemory to new provider-based system
- **Type Safety**: Improved TypeScript support with better generic constraints

### ⚠️ Deprecated
- **Legacy Files**: All old memory system files are now deprecated:
  - `memory-store.ts` - Use `createSupabaseKVProvider` instead
  - `vector-store.ts` - Use `createSupabaseVectorProvider` instead  
  - `supabase.ts` - Use `createSupabaseVectorProvider` instead
  - `types.ts` - Use new provider config types
  - `schema.ts` - Use new provider schemas
- **Legacy Functions**:
  - `createSupabaseMemoryStore()` - Use `createSupabaseKVProvider()`
  - `createSupabaseVectorStore()` - Use `createSupabaseVectorProvider()`
  - `createSupabaseBaseMemory()` - Use `createSupabaseMemory()`
  - `createOpenAIEmbeddingProvider()` - Use core framework embedding models

### 📦 Migration Path
```typescript
// Old API (deprecated)
import { createSupabaseBaseMemory } from "@daydreamsai/supabase";
const memory = createSupabaseBaseMemory({ url, key });

// New API (recommended)
import { createSupabaseMemory } from "@daydreamsai/supabase";
const memory = createSupabaseMemory({ url, key });
```

## [0.3.8](https://github.com/daydreamsai/daydreams/compare/v0.3.7...v0.3.8) (2025-06-18)

**Note:** Version bump only for package @daydreamsai/supabase





## [0.3.7](https://github.com/daydreamsai/daydreams/compare/v0.3.7-alpha.7...v0.3.7) (2025-06-02)

**Note:** Version bump only for package @daydreamsai/supabase





## [0.3.7-alpha.7](https://github.com/daydreamsai/daydreams/compare/v0.3.7-alpha.6...v0.3.7-alpha.7) (2025-05-28)

**Note:** Version bump only for package @daydreamsai/supabase





## [0.3.7-alpha.6](https://github.com/daydreamsai/daydreams/compare/v0.3.7-alpha.5...v0.3.7-alpha.6) (2025-05-27)

**Note:** Version bump only for package @daydreamsai/supabase





## [0.3.7-alpha.5](https://github.com/daydreamsai/daydreams/compare/v0.3.7-alpha.4...v0.3.7-alpha.5) (2025-05-27)

**Note:** Version bump only for package @daydreamsai/supabase





## [0.3.7-alpha.4](https://github.com/daydreamsai/daydreams/compare/v0.3.7-alpha.3...v0.3.7-alpha.4) (2025-05-27)

**Note:** Version bump only for package @daydreamsai/supabase





## [0.3.7-alpha.3](https://github.com/daydreamsai/daydreams/compare/v0.3.7-alpha.2...v0.3.7-alpha.3) (2025-05-27)

**Note:** Version bump only for package @daydreamsai/supabase





## [0.3.7-alpha.2](https://github.com/daydreamsai/daydreams/compare/v0.3.7-alpha.1...v0.3.7-alpha.2) (2025-05-23)

**Note:** Version bump only for package @daydreamsai/supabase





## [0.3.7-alpha.1](https://github.com/daydreamsai/daydreams/compare/v0.3.7-alpha.0...v0.3.7-alpha.1) (2025-05-22)

**Note:** Version bump only for package @daydreamsai/supabase





## [0.3.7-alpha.0](https://github.com/daydreamsai/daydreams/compare/v0.3.6...v0.3.7-alpha.0) (2025-05-22)

**Note:** Version bump only for package @daydreamsai/supabase
