# Memory Management

Daydreams provides powerful memory management capabilities to prevent context overload and enable long-running conversations. The memory management system is designed to be fully customizable while providing sensible defaults.

## Quick Start

```typescript
import { context, tokenLimiter, smartMemoryManager } from "@daydreamsai/core";

// Prevent context overload with token limiting
const chatContext = context({
  type: "chat",
  memoryManager: tokenLimiter(8000), // Keep under 8k tokens
  
  async create() {
    return { conversationHistory: [] };
  }
});

// Use AI to intelligently compress old conversations  
const assistantContext = context({
  type: "assistant",
  memoryManager: smartMemoryManager({
    maxSize: 100,
    preserveImportant: true
  }),
  
  async create() {
    return { taskHistory: [] };
  }
});
```

## Built-in Memory Managers

### Token Limiter
Manages memory based on estimated token count to prevent context overload:

```typescript
import { tokenLimiter } from "@daydreamsai/core";

const context = context({
  type: "chat",
  memoryManager: tokenLimiter(4000), // ~4k tokens max
});
```

### Smart Memory Manager
Uses AI to intelligently summarize old conversations:

```typescript
import { smartMemoryManager } from "@daydreamsai/core";

const context = context({
  type: "assistant",
  memoryManager: smartMemoryManager({
    maxSize: 50,              // Keep 50 recent entries
    preserveImportant: true   // Preserve important context
  }),
});
```

### Tool Call Filter
Focuses on preserving important tool calls:

```typescript
import { toolCallFilter } from "@daydreamsai/core";

const context = context({
  type: "workflow",
  memoryManager: toolCallFilter({
    keepLastCalls: 15,
    preserveTools: ["search", "analyze", "save"],
    maxSize: 80
  }),
});
```

### Context-Aware Manager
Preserves information relevant to specific keywords:

```typescript
import { contextAwareManager } from "@daydreamsai/core";

const context = context({
  type: "project",
  memoryManager: contextAwareManager({
    maxSize: 100,
    taskKeywords: ["implementation", "analysis", "design"],
    preserveErrors: true
  }),
});
```

### FIFO Manager
Simple first-in-first-out with preservation rules:

```typescript
import { fifoManager } from "@daydreamsai/core";

const context = context({
  type: "simple",
  memoryManager: fifoManager({
    maxSize: 60,
    preserveInputs: 5,
    preserveOutputs: 5,
    preserveActions: ["important_action"]
  }),
});
```

### Hybrid Manager
Combines multiple strategies for robust memory handling:

```typescript
import { hybridManager, smartMemoryManager, fifoManager } from "@daydreamsai/core";

const context = context({
  type: "robust",
  memoryManager: hybridManager({
    primary: smartMemoryManager({ maxSize: 80 }),
    fallback: fifoManager({ maxSize: 40 }),
    useTokenLimit: 6000
  }),
});
```

## Custom Memory Management

Create your own memory management logic:

```typescript
import { type MemoryManager } from "@daydreamsai/core";

const customManager: MemoryManager = {
  maxSize: 50,
  strategy: "custom",
  
  // Decide when to prune memory
  async shouldPrune(ctx, workingMemory, newEntry, agent) {
    const errorCount = workingMemory.results.filter(r => 'error' in r).length;
    return errorCount > 3; // Prune when too many errors
  },
  
  // Handle memory pressure
  async onMemoryPressure(ctx, workingMemory, agent) {
    // Keep only successful results and recent messages
    return {
      ...workingMemory,
      inputs: workingMemory.inputs.slice(-10),
      outputs: workingMemory.outputs.slice(-10),
      results: workingMemory.results.filter(r => !('error' in r)),
      thoughts: workingMemory.thoughts.slice(-5),
      calls: workingMemory.calls.slice(-15),
      events: [],
      runs: workingMemory.runs.slice(-3),
      steps: workingMemory.steps.slice(-3),
    };
  },
  
  // Generate summaries of removed content
  async compress(ctx, entries, agent) {
    const messageCount = entries.filter(e => 
      e.ref === 'input' || e.ref === 'output'
    ).length;
    return `Compressed ${entries.length} entries (${messageCount} messages)`;
  },
  
  // Preserve important entries
  preserve: {
    recentInputs: 3,
    recentOutputs: 3,
    actionNames: ["save", "commit"],
    custom: (entry, ctx) => {
      // Custom preservation logic
      return entry.ref === 'action_call' && 'critical' in entry;
    }
  }
};

const context = context({
  type: "custom",
  memoryManager: customManager,
});
```

## Memory Manager Interface

```typescript
interface MemoryManager<TContext = AnyContext> {
  /** Maximum entries before triggering management */
  maxSize?: number;
  
  /** Memory management strategy */
  strategy?: 'fifo' | 'lru' | 'smart' | 'custom';
  
  /** Called when memory needs pruning */
  onMemoryPressure?: (
    ctx: AgentContext<TContext>, 
    workingMemory: WorkingMemory,
    agent: AnyAgent
  ) => Promise<WorkingMemory> | WorkingMemory;
  
  /** Called before adding entries to check if pruning needed */
  shouldPrune?: (
    ctx: AgentContext<TContext>, 
    workingMemory: WorkingMemory, 
    newEntry: AnyRef,
    agent: AnyAgent
  ) => Promise<boolean> | boolean;
  
  /** Called to compress/summarize old entries */
  compress?: (
    ctx: AgentContext<TContext>, 
    entries: AnyRef[],
    agent: AnyAgent
  ) => Promise<string> | string;
  
  /** Rules for preserving important entries */
  preserve?: {
    recentInputs?: number;
    recentOutputs?: number; 
    actionNames?: string[];
    custom?: (entry: AnyRef, ctx: AgentContext<TContext>) => boolean;
  };
}
```

## Memory Strategies

### FIFO (First In, First Out)
Removes the oldest entries first. Good for simple use cases.

### LRU (Least Recently Used)  
Removes entries that haven't been accessed recently. More sophisticated than FIFO.

### Smart
Uses AI compression to summarize removed content. Preserves context quality while managing memory.

### Custom
Allows complete control over memory management logic.

## Monitoring Memory Usage

```typescript
// Subscribe to memory changes
const unsubscribe = agent.subscribeContext("context-id", (log, done) => {
  if (done) {
    agent.getWorkingMemory("context-id").then(memory => {
      const totalEntries = memory.inputs.length + memory.outputs.length + 
                          memory.calls.length + memory.results.length;
      console.log(`Memory entries: ${totalEntries}`);
      
      // Check for summaries
      const summaries = memory.thoughts.filter(t => 
        t.content.includes('[Memory Summary]')
      );
      if (summaries.length > 0) {
        console.log(`Memory summaries: ${summaries.length}`);
      }
    });
  }
});
```

## Best Practices

### 1. Choose the Right Strategy
- **Token Limiter**: For preventing context overload
- **Smart Manager**: For maintaining conversation quality  
- **Tool Filter**: For workflow-heavy applications
- **Custom**: For specific business logic

### 2. Set Appropriate Limits
```typescript
// For chat applications
memoryManager: tokenLimiter(8000)

// For complex workflows  
memoryManager: smartMemoryManager({ maxSize: 100 })

// For simple scripts
memoryManager: fifoManager({ maxSize: 30 })
```

### 3. Preserve Important Information
```typescript
preserve: {
  recentInputs: 5,        // Always keep recent user messages
  recentOutputs: 5,       // Always keep recent responses
  actionNames: ["save"],  // Always keep important actions
}
```

### 4. Use Hybrid Approaches
```typescript
memoryManager: hybridManager({
  primary: smartMemoryManager({ maxSize: 80 }),
  fallback: fifoManager({ maxSize: 40 }),
  useTokenLimit: 6000
})
```

### 5. Handle Errors Gracefully
```typescript
async onMemoryPressure(ctx, workingMemory, agent) {
  try {
    // Your memory management logic
    return managedMemory;
  } catch (error) {
    console.warn('Memory management failed:', error);
    // Fallback to simple pruning
    return simpleManager.onMemoryPressure(ctx, workingMemory, agent);
  }
}
```

## Performance Considerations

- Memory management is applied after each log entry
- Compression is only used for the 'smart' strategy
- Large memory operations are batched to avoid blocking
- Memory is managed in-place to preserve object references

## Troubleshooting

### Memory Still Growing
- Check if `maxSize` is set appropriately
- Verify memory manager is configured on the context
- Monitor preservation rules aren't keeping too many entries

### Context Quality Degraded
- Use `smartMemoryManager` instead of simple pruning
- Increase `maxSize` if possible
- Configure preservation rules for important content

### Performance Issues
- Reduce `maxSize` to trigger management earlier
- Use simpler strategies like `fifoManager`
- Avoid expensive operations in custom managers

## Migration Guide

Existing contexts continue to work without changes. To add memory management:

```typescript
// Before
const context = context({
  type: "chat",
  maxWorkingMemorySize: 100, // This still works for LLM view
});

// After  
const context = context({
  type: "chat", 
  maxWorkingMemorySize: 100, // Keep for LLM compatibility
  memoryManager: tokenLimiter(8000), // Add actual memory management
});
```

The `maxWorkingMemorySize` setting controls what the LLM sees, while `memoryManager` controls actual memory usage.