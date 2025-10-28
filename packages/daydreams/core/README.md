# @daydreamsai/core

The core framework for building stateful AI agents with type-safe contexts,
persistent memory, and extensible actions.

## Installation

```bash
npm install @daydreamsai/core
```

## Quick Start

```typescript
import { createDreams, context, action } from "@daydreamsai/core";
import { openai } from "@ai-sdk/openai";
import * as z from "zod";

// Define a context
const chatContext = context({
  type: "chat",
  schema: z.object({
    userId: z.string(),
  }),
});

// Define an action
const searchAction = action({
  name: "search",
  description: "Search the web",
  schema: z.object({
    query: z.string(),
  }),
  handler: async ({ call }) => {
    // Implement search logic
    return { results: ["result1", "result2"] };
  },
});

// Create agent
const agent = createDreams({
  model: openai("gpt-4"),
  contexts: [chatContext],
  actions: [searchAction],
});

// Start the agent
await agent.start();

// Send a message
const response = await agent.send({
  context: chatContext,
  args: { userId: "user123" },
  input: { type: "text", data: "Search for AI news" },
});
```

## Core Concepts

### Contexts

Isolated stateful environments for managing conversations or tasks. Each context
maintains its own memory and state.

```typescript
const context = context({
  type: "support",
  schema: z.object({ ticketId: z.string() }),
  create: async ({ args }) => ({
    status: "open",
    messages: [],
  }),
});
```

### Memory System

Two-tier architecture for managing agent memory:

- **Working Memory**: Temporary execution state (inputs, outputs, actions)
- **Persistent Storage**: Long-term memory via pluggable providers (KV, Vector,
  Graph)

```typescript
// Access episodes from memory
const episodes = await agent.memory.episodes.getByContext("context:123");

// Export episodes
const result = await agent.exports.export({
  episodes,
  exporter: "json",
});
```

### Actions

Type-safe functions that agents can execute:

```typescript
const action = action({
  name: "sendEmail",
  schema: z.object({
    to: z.string().email(),
    subject: z.string(),
    body: z.string(),
  }),
  handler: async ({ call, memory }) => {
    // Implementation
    return { sent: true };
  },
});
```

### Extensions

Plugin system for adding capabilities:

```typescript
const extension = createExtension({
  name: "weather",
  actions: [getWeatherAction],
  contexts: [weatherContext],
});
```

## Key Features

- 🧠 **Stateful Contexts**: Manage isolated conversation states
- 💾 **Persistent Memory**: Built-in storage with episodes and context
  management
- 🔧 **Type-Safe Actions**: Zod-validated action schemas
- 🔌 **Extensible**: Plugin architecture for custom functionality
- 📊 **Memory Export**: Export conversations to JSON, Markdown, etc.
- 🔄 **Async Task Management**: Built-in task runner with concurrency control
- 📝 **Structured Logging**: Comprehensive execution tracking

## Architecture

```
Agent (dreams.ts)
├── Context System (context.ts)
│   ├── Context State Management
│   ├── Lifecycle Hooks
│   └── Memory Persistence
├── Memory System (memory/)
│   ├── Working Memory
│   ├── Episode Storage
│   └── Providers (KV, Vector, Graph)
├── Engine (engine.ts)
│   ├── Execution Router
│   ├── Action Handler
│   └── Output Processing
└── Task Runner (task.ts)
    ├── Queue Management
    └── Concurrency Control
```

## API Reference

### createDreams(config)

Creates a new agent instance.

### context(definition)

Defines a context type with schema and lifecycle hooks.

### action(definition)

Creates a type-safe action with validation.

### Agent Methods

- `agent.start()` - Initialize the agent
- `agent.run()` - Execute with context
- `agent.send()` - Send input and get response
- `agent.getContext()` - Retrieve context state
- `agent.exports.export()` - Export episodes

## Configuration

```typescript
const agent = createDreams({
  // Required
  model: languageModel,

  // Optional
  memory: memorySystem,
  contexts: [...],
  actions: [...],
  extensions: [...],
  modelSettings: {
    temperature: 0.7,
    maxTokens: 2000
  },
  debugLevel: 'info'
});
```

## Examples

- [Basic Chat](../../examples/basic) - Simple conversation agent
- [Multi-Context](../../examples/contexts) - Managing multiple contexts
- [Custom Actions](../../examples/actions) - Building custom actions
- [Memory Export](../../examples/memory) - Exporting conversations
- [Discord Bot](../../examples/discord) - Integration with Discord

## Advanced Topics

- [Memory System](https://daydreams.ai/docs/core/advanced/memory-system)
- [Episode Export](https://daydreams.ai/docs/core/advanced/episode-export)
- [Extensions](https://daydreams.ai/docs/core/advanced/extensions)
- [Custom Providers](https://daydreams.ai/docs/core/advanced/providers)

## Sub-Modules

- [`memory/`](./src/memory/README.md) - Memory system implementation
- [`memory/exporters/`](./src/memory/exporters/README.md) - Episode export
  system

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for development setup and
guidelines.

## License

MIT
