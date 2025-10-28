# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.3.22](https://github.com/daydreamsai/daydreams/compare/v0.3.21...v0.3.22) (2025-09-03)

**Note:** Version bump only for package @daydreamsai/supabase





## [0.3.21](https://github.com/daydreamsai/daydreams/compare/v0.3.20...v0.3.21) (2025-08-25)

**Note:** Version bump only for package @daydreamsai/supabase





## [0.3.20](https://github.com/daydreamsai/daydreams/compare/v0.3.19...v0.3.20) (2025-08-22)

**Note:** Version bump only for package @daydreamsai/supabase





## [0.3.19](https://github.com/daydreamsai/daydreams/compare/v0.3.18...v0.3.19) (2025-08-21)

**Note:** Version bump only for package @daydreamsai/supabase





## [0.3.18](https://github.com/daydreamsai/daydreams/compare/v0.3.17...v0.3.18) (2025-08-21)

**Note:** Version bump only for package @daydreamsai/supabase





## [0.3.17](https://github.com/daydreamsai/daydreams/compare/v0.3.16...v0.3.17) (2025-08-21)

**Note:** Version bump only for package @daydreamsai/supabase





## [0.3.16](https://github.com/daydreamsai/daydreams/compare/v0.3.15...v0.3.16) (2025-08-21)

**Note:** Version bump only for package @daydreamsai/supabase





## [0.3.15](https://github.com/daydreamsai/daydreams/compare/v0.3.14...v0.3.15) (2025-08-19)

**Note:** Version bump only for package @daydreamsai/supabase





## [0.3.14](https://github.com/daydreamsai/daydreams/compare/v0.3.13...v0.3.14) (2025-08-18)

**Note:** Version bump only for package @daydreamsai/supabase





## [0.3.13](https://github.com/daydreamsai/daydreams/compare/v0.3.12...v0.3.13) (2025-08-17)

**Note:** Version bump only for package @daydreamsai/supabase





## [0.3.12](https://github.com/daydreamsai/daydreams/compare/v0.3.11...v0.3.12) (2025-08-16)

**Note:** Version bump only for package @daydreamsai/supabase





## [0.3.11](https://github.com/daydreamsai/daydreams/compare/v0.3.10...v0.3.11) (2025-08-16)

**Note:** Version bump only for package @daydreamsai/supabase





## [0.3.10](https://github.com/daydreamsai/daydreams/compare/v0.3.9...v0.3.10) (2025-08-14)

**Note:** Version bump only for package @daydreamsai/supabase





## [0.3.9](https://github.com/daydreamsai/daydreams/compare/v0.3.9-alpha.2...v0.3.9) (2025-08-10)

**Note:** Version bump only for package @daydreamsai/supabase





## [0.3.9-alpha.2](https://github.com/daydreamsai/daydreams/compare/v0.3.9-alpha.1...v0.3.9-alpha.2) (2025-08-10)

**Note:** Version bump only for package @daydreamsai/supabase





## [0.3.9-alpha.1](https://github.com/daydreamsai/daydreams/compare/v0.3.9-alpha.0...v0.3.9-alpha.1) (2025-08-09)

**Note:** Version bump only for package @daydreamsai/supabase





## [0.3.9-alpha.0](https://github.com/daydreamsai/daydreams/compare/v0.3.8...v0.3.9-alpha.0) (2025-08-08)

**Note:** Version bump only for package @daydreamsai/supabase





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
