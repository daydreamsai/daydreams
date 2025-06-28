# Daydreams Memory System

The Daydreams memory system implements a sophisticated multi-tier memory architecture inspired by cognitive science concepts of human memory. It provides context-aware storage, intelligent retrieval, and automatic learning capabilities for AI agents.

## Architecture Overview

### Core Design Principles

1. **Context-Aware**: Memory is partitioned by context IDs, enabling isolation and prioritization
2. **Multi-Tier**: Layered architecture with providers, memory types, and unified API
3. **Pluggable**: Swappable storage backends and configurable middleware
4. **Cognitive**: Models human memory systems (working, episodic, semantic, factual)

### Memory Types

```typescript
interface Memory {
  working: IWorkingMemory;     // Current execution state
  facts: FactualMemory;        // Verified structured facts  
  episodes: EpisodicMemory;    // Past experiences/conversations
  semantic: SemanticMemory;    // Learned patterns and concepts
  graph: GraphMemory;          // Entity relationships
  kv: KeyValueMemory;          // Raw key-value storage
  vector: VectorMemory;        // Vector search index
}
```

## Context-Aware Storage

### Storage Hierarchy

The system implements a three-tier context priority system:

```typescript
// Priority order for retrieval:
1. Context-specific: `type:${contextId}:${id}`
2. Global scope: `type:global:${id}`  
3. Legacy fallback: `type:${id}`
```

### Benefits

- **Privacy**: Conversations remain isolated
- **Relevance**: Context-specific memories prioritized in search
- **Scalability**: Memory partitioning improves performance
- **Personalization**: Per-context learning and adaptation

## Memory Types Deep Dive

### Working Memory
**Purpose**: Manages current execution state and conversation flow

```typescript
interface WorkingMemoryData {
  inputs: InputRef<any>[];     // User messages
  outputs: OutputRef[];        // Agent responses  
  thoughts: ThoughtRef[];      // LLM reasoning
  calls: ActionCall<any>[];    // Action invocations
  results: ActionResult<any>[]; // Action results
  events: EventRef[];          // System events
  steps: StepRef[];            // Execution steps
  runs: RunRef[];              // Complete runs
}
```

**Features**:
- Memory pressure detection and automatic pruning
- Smart compression with episodic memory integration
- Real-time execution tracking
- Configurable memory management strategies (FIFO, LRU, Smart)

### Factual Memory
**Purpose**: Stores verified, structured facts with confidence scoring

```typescript
interface Fact {
  id: string;
  statement: string;
  confidence: number;          // 0.0 - 1.0
  source: string;
  entities?: string[];         // Extracted entities
  tags?: Record<string, string>;
  timestamp: number;
  contextId?: string;          // Context association
  verification?: FactVerification;
}
```

**Features**:
- Context-aware storage with priority-based retrieval
- Verification system that cross-references facts to detect conflicts
- Automatic entity extraction to graph memory
- Tag-based categorization and filtering

### Semantic Memory
**Purpose**: Learns patterns, concepts, and skills from interactions

```typescript
interface Pattern extends SemanticConcept {
  type: "pattern";
  trigger: string;             // Input pattern
  response: string;            // Expected output
  successRate: number;         // Track effectiveness
}
```

**Features**:
- Automatic pattern learning from action-result pairs
- Context-specific and global pattern storage
- Confidence evolution based on success/failure
- Pattern prioritization by context and success rate

### Episodic Memory
**Purpose**: Stores past experiences and conversation history

```typescript
interface Episode {
  id: string;
  type: "conversation" | "action" | "event" | "compression";
  input?: any;
  output?: any;
  context: string;
  timestamp: number;
  duration?: number;
  summary?: string;
  metadata?: Record<string, any>;
}
```

**Features**:
- Temporal organization with timeline-based retrieval
- Vector-based similarity search for related episodes
- Automatic compression of old episodes to save space
- Context-based episode grouping

### Graph Memory
**Purpose**: Manages entity relationships and knowledge graphs

```typescript
interface Entity {
  id: string;
  type: string;
  name: string;
  properties: Record<string, any>;
  contextIds: string[];        // Multi-context entities
}

interface Relationship {
  id: string;
  from: string;                // Source entity ID
  to: string;                  // Target entity ID
  type: string;                // Relationship type
  properties?: Record<string, any>;
  strength?: number;           // Relationship weight
}
```

**Features**:
- Entity management with context associations
- Weighted relationship tracking
- Path finding algorithms for relationship discovery
- Cross-context entity sharing

## Middleware System

### Middleware Interface

```typescript
interface MemoryMiddleware {
  name: string;
  initialize?(memory: Memory): Promise<void>;
  
  // Lifecycle hooks
  beforeRemember?(context: MemoryContext): Promise<void>;
  afterRemember?(context: MemoryContext): Promise<void>;
  beforeRecall?(context: MemoryContext): Promise<void>;
  afterRecall?(context: MemoryContext): Promise<void>;
  beforeForget?(context: MemoryContext): Promise<void>;
  afterForget?(context: MemoryContext): Promise<void>;
  
  // Transform hooks
  transformStore?(data: any): Promise<any>;
  transformRetrieve?(data: any): Promise<any>;
}
```

### Common Use Cases

- **Encryption**: Transform data before storage
- **Compression**: Reduce storage footprint
- **Audit Logging**: Track all memory operations
- **Content Filtering**: Apply privacy/safety filters
- **Performance Monitoring**: Collect metrics and timing
- **Caching**: Implement result caching strategies

## Data Flows

### Memory Storage Flow

```mermaid
graph LR
    A[remember(content)] --> B[Middleware.beforeRemember]
    B --> C[classifyContent]
    C --> D[Store in appropriate types]
    D --> E[Index for search]
    E --> F[Middleware.afterRemember]
```

### Memory Retrieval Flow

```mermaid
graph LR
    A[recall(query)] --> B[Middleware.beforeRecall]
    B --> C[Parallel search across types]
    C --> D[Boost/rank results]
    D --> E[Apply limits]
    E --> F[Middleware.afterRecall]
```

### Working Memory Lifecycle

```mermaid
graph LR
    A[Execution starts] --> B[Create/load working memory]
    B --> C[Push entries]
    C --> D[Check pressure]
    D --> E[Prune if needed]
    E --> F[Persist]
    F --> G[Extract to long-term memory]
```

## Advanced Features

### Memory Evolution System
- **Automatic Consolidation**: Merges duplicate/similar facts
- **Pattern Detection**: Discovers recurring patterns from episodes
- **Confidence Updates**: Adjusts confidence based on verification
- **Compression**: Reduces storage of old episodes

### Memory Pressure Management
- **Configurable Strategies**: FIFO, LRU, Smart compression
- **Automatic Pruning**: Prevents memory overflow
- **Intelligent Compression**: Preserves important information
- **Episode Integration**: Compressed data becomes episodes

### Verification and Confidence
- **Fact Verification**: Cross-references facts for conflicts
- **Pattern Success Tracking**: Monitors pattern effectiveness
- **Confidence Scoring**: Dynamic confidence adjustment
- **Context-Aware Verification**: Prioritizes same-context evidence

## Usage Examples

### Basic Memory Operations

```typescript
// Initialize memory system
const memory = new MemorySystem({
  providers: {
    kv: new InMemoryKeyValueProvider(),
    vector: new InMemoryVectorProvider(),
    graph: new InMemoryGraphProvider(),
  },
  middleware: [loggingMiddleware, encryptionMiddleware],
});

await memory.initialize();

// Store a fact
await memory.remember("The user prefers dark mode", {
  type: "fact",
  context: "user:123",
  metadata: { category: "preference" }
});

// Recall relevant memories
const memories = await memory.recall("user preferences", {
  context: "user:123",
  types: ["fact"],
  limit: 10
});

// Store an episode
await memory.episodes.store({
  type: "conversation",
  input: "What's my preferred theme?",
  output: "You prefer dark mode",
  context: "user:123",
});
```

### Context-Aware Operations

```typescript
// Store context-specific fact
await memory.facts.store({
  statement: "Project uses TypeScript",
  confidence: 1.0,
  source: "codebase",
  contextId: "project:abc",
});

// Retrieve with context priority
const fact = await memory.facts.get("fact:123", "project:abc");

// Search within context
const projectFacts = await memory.facts.search("TypeScript", {
  contextId: "project:abc"
});
```

### Semantic Learning

```typescript
// Learn from action results
await memory.semantic.learnFromAction(
  { name: "search", input: { query: "TypeScript docs" } },
  { data: "Found 10 results", error: false },
  "development:context"
);

// Get relevant patterns
const patterns = await memory.semantic.getRelevantPatterns("development:context");
```

## Configuration

### Memory Managers

```typescript
import { tokenLimiter, smartMemoryManager } from "./memory-managers";

const workingMemory = new WorkingMemoryImpl(memory, {
  manager: hybridManager({
    maxSize: 1000,
    tokenLimit: 50000,
    enableCompression: true
  })
});
```

### Middleware Configuration

```typescript
const memory = new MemorySystem({
  providers: { /* ... */ },
  middleware: [
    {
      name: "encryption",
      transformStore: async (data) => encrypt(data),
      transformRetrieve: async (data) => decrypt(data),
    },
    {
      name: "logging",
      beforeRemember: async (ctx) => console.log("Storing:", ctx.data),
      afterRecall: async (ctx) => console.log("Retrieved:", ctx.data.length),
    }
  ]
});
```

## Performance Considerations

1. **Context Partitioning**: Improves search performance by reducing scope
2. **Vector Indexing**: Enables fast similarity search across large datasets  
3. **Memory Pressure**: Automatic pruning prevents memory bloat
4. **Batch Operations**: Support for bulk storage and retrieval
5. **Lazy Loading**: Context data loaded on-demand

## Best Practices

1. **Context Granularity**: Use meaningful context IDs (user:123, session:abc, project:xyz)
2. **Fact Verification**: Regularly verify facts to maintain accuracy
3. **Memory Management**: Configure appropriate memory managers for your use case
4. **Middleware Ordering**: Place performance-critical middleware early in the chain
5. **Evolution Strategy**: Enable memory evolution for long-running agents

The Daydreams memory system provides a sophisticated foundation for building stateful, learning-capable AI agents that can maintain context-aware conversations while continuously improving through experience.