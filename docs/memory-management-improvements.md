# Memory Management Improvements for Daydreams

## Overview

This document outlines the design and implementation plan for improving memory management in the Daydreams framework. The current system keeps all working memory in RAM without bounds, leading to potential performance issues and memory exhaustion in long-running conversations.

## Current State

### Existing Implementation
The framework has a `maxWorkingMemorySize` configuration that limits what the LLM sees:
```typescript
// In context configuration
maxWorkingMemorySize: 200  // Show only last 200 entries to LLM
```

However, this is only a **view-time constraint** - it doesn't actually limit memory usage.

### Problems
- **Unbounded Growth**: Working memory accumulates all logs without removal, despite `maxWorkingMemorySize`
- **View vs Storage**: The limit only affects LLM prompts, not actual memory storage
- **No Pruning**: Historical messages are never removed from RAM, only hidden from LLM view
- **Full Memory Load**: All conversation history stays in RAM during execution
- **No Streaming**: Large contexts can exhaust available memory
- **Performance Degradation**: As memory grows, operations become slower

### Current Architecture
```typescript
// Working memory structure
interface WorkingMemory {
  inputs: InputRef[];
  outputs: OutputRef[];
  thoughts: ThoughtRef[];
  calls: ActionCall[];
  results: ActionResult[];
  events: EventRef[];
  steps: StepRef[];
  runs: RunRef[];
}
```

## Proposed Solution

### 1. Memory Window System

Implement a sliding window approach that keeps only recent messages in active memory.

```typescript
interface MemoryConfig {
  windowSize: number;           // Number of recent messages to keep
  windowType: 'count' | 'time'; // Window by message count or time
  preserveImportant: boolean;    // Keep flagged important messages
  summarizeOnEviction: boolean;  // Generate summaries when pruning
}

interface MemoryWindow {
  active: WorkingMemory;        // Current window
  summaries: Summary[];         // Historical summaries
  metadata: WindowMetadata;     // Stats and indexes
}
```

### 2. Streaming Persistence

Write logs to disk as they arrive instead of keeping everything in memory.

```typescript
interface StreamingMemory {
  writer: LogWriter;            // Append-only log writer
  reader: LogReader;            // Random access reader
  cache: LRUCache;              // Recently accessed items
  index: MemoryIndex;           // Fast lookups
}

class LogWriter {
  async append(entry: LogEntry): Promise<void>;
  async flush(): Promise<void>;
  async rotate(): Promise<void>; // Start new log file
}

class LogReader {
  async read(offset: number, count: number): Promise<LogEntry[]>;
  async search(query: SearchQuery): Promise<LogEntry[]>;
  async getRange(start: Date, end: Date): Promise<LogEntry[]>;
}
```

### 3. Automatic Summarization

Generate contextual summaries when messages leave the active window.

```typescript
interface SummarizationConfig {
  strategy: 'periodic' | 'threshold' | 'smart';
  chunkSize: number;            // Messages per summary
  model?: string;               // Model for summarization
  maxTokens?: number;           // Summary length limit
}

interface Summary {
  id: string;
  contextId: string;
  startTime: Date;
  endTime: Date;
  messageCount: number;
  content: string;              // Generated summary text
  keywords: string[];           // Extracted key topics
  importance: number;           // Relevance score
}

class Summarizer {
  async summarize(messages: LogEntry[]): Promise<Summary>;
  async extractKeywords(messages: LogEntry[]): Promise<string[]>;
  async scoreImportance(message: LogEntry): Promise<number>;
}
```

### 4. Memory Limits & Eviction

Implement configurable limits with smart eviction policies.

```typescript
interface MemoryLimits {
  maxMemoryMB: number;          // Hard memory limit
  softLimitMB: number;          // Trigger pruning threshold
  maxMessages: number;          // Message count limit
  maxAge: Duration;             // Time-based limit
}

interface EvictionPolicy {
  type: 'lru' | 'lfu' | 'fifo' | 'smart';
  preserve: PreservationRule[]; // Rules for keeping messages
}

interface PreservationRule {
  type: 'action' | 'error' | 'marked' | 'recent';
  condition: (entry: LogEntry) => boolean;
  priority: number;
}
```

### 5. Indexing System

Build indexes for fast retrieval of historical data.

```typescript
interface MemoryIndex {
  byTime: TimeIndex;            // Timestamp-based index
  byType: TypeIndex;            // Message type index
  byContent: ContentIndex;      // Full-text search
  byVector: VectorIndex;        // Semantic search
}

class IndexManager {
  async index(entry: LogEntry): Promise<void>;
  async search(query: Query): Promise<LogEntry[]>;
  async rebuild(): Promise<void>;
  async optimize(): Promise<void>;
}
```

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1-2)
- [ ] Add `MemoryConfig` to context options
- [ ] Implement basic windowing without summarization
- [ ] Create streaming log writer/reader
- [ ] Add memory metrics collection

### Phase 2: Summarization (Week 3-4)
- [ ] Build summarization pipeline
- [ ] Integrate with step processing
- [ ] Implement summary storage and retrieval
- [ ] Add summary inclusion in prompts

### Phase 3: Advanced Features (Week 5-6)
- [ ] Implement full indexing system
- [ ] Add eviction policies
- [ ] Build memory optimization tools
- [ ] Create debugging/visualization tools

## API Changes

### Context Creation
```typescript
const myContext = context<MyMemory>({
  type: "chat",
  memory: {
    window: {
      size: 100,
      type: 'count',
      summarize: true
    },
    limits: {
      maxMemoryMB: 50,
      softLimitMB: 40
    },
    persistence: {
      enabled: true,
      path: './memory'
    }
  }
});
```

### Runtime Access
```typescript
// Access current window
const recentMessages = ctx.memory.window.active;

// Search historical data
const results = await ctx.memory.search({
  type: 'action',
  name: 'search',
  timeRange: { start: '1h ago' }
});

// Get summaries
const summaries = await ctx.memory.getSummaries({
  count: 5,
  includeKeywords: true
});
```

## Configuration

### Environment Variables
```bash
DAYDREAMS_MEMORY_WINDOW_SIZE=100
DAYDREAMS_MEMORY_MAX_MB=100
DAYDREAMS_MEMORY_PERSISTENCE_PATH=./memory
DAYDREAMS_MEMORY_SUMMARIZATION_MODEL=gpt-4o-mini
```

### Per-Context Overrides
```typescript
agent.setMemoryConfig('chat:user123', {
  window: { size: 50 },
  limits: { maxMemoryMB: 25 }
});
```

## Migration Strategy

1. **Backward Compatibility**: Existing code continues to work with full memory
2. **Opt-in Features**: New memory management disabled by default
3. **Gradual Migration**: Provide tools to migrate existing contexts
4. **Monitoring**: Track memory usage before/after migration

## Performance Considerations

### Benchmarks to Track
- Memory usage over time
- Message processing latency
- Summary generation time
- Index query performance
- Disk I/O patterns

### Optimization Strategies
- Batch write operations
- Compress historical logs
- Cache frequently accessed data
- Use memory-mapped files for large datasets
- Implement read-ahead for sequential access

## Testing Plan

### Unit Tests
- Window management logic
- Summarization accuracy
- Index consistency
- Eviction policies

### Integration Tests
- Long-running conversation simulation
- Memory limit enforcement
- Persistence and recovery
- Cross-context memory isolation

### Performance Tests
- Memory usage under load
- Query performance at scale
- Summarization throughput
- Concurrent access patterns

## Monitoring & Debugging

### Metrics to Collect
```typescript
interface MemoryMetrics {
  windowSize: number;
  totalMessages: number;
  memoryUsageMB: number;
  summaryCount: number;
  evictionRate: number;
  queryLatencyP95: number;
}
```

### Debug Tools
- Memory usage visualizer
- Message flow tracer
- Summary quality analyzer
- Performance profiler

## Future Enhancements

1. **Distributed Memory**: Share memory across instances
2. **Hierarchical Summaries**: Multi-level summarization
3. **Smart Caching**: ML-based cache prediction
4. **Memory Sharing**: Share summaries between similar contexts
5. **Compression**: Advanced compression for historical data

## Conclusion

This memory management system will enable Daydreams to handle long-running conversations efficiently while maintaining context quality through intelligent summarization and indexing. The phased implementation approach ensures backward compatibility while gradually introducing powerful new capabilities.