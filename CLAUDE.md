# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Package Management
- `pnpm install` - Install all dependencies (uses pnpm workspaces)
- `./scripts/build.sh` - Build all packages
- `./scripts/build.sh --watch` - Build packages in watch mode
- `./scripts/clean.sh` - Clean build artifacts
- `./scripts/clean.sh --dry-run` - Preview what would be cleaned

### Testing
- `bun run packages/core` - Run core package tests (primary test command)

### Documentation
- `cd docs && bun run dev` - Run documentation development server
- `cd docs && bun run docs:build` - Build documentation

### Code Quality
- `pnpx prettier --check packages` - Check code formatting
- `pnpx prettier --write packages` - Format code
- `knip` - Find unused dependencies and exports

## Project Architecture

This is **Daydreams**, a TypeScript framework for building stateful AI agents. The architecture is designed around:

### Core Components (`packages/core/`)
- **Agent (`dreams.ts`)**: Main orchestrator managing lifecycle, context state, and execution
- **Context System (`context.ts`)**: Type-safe isolated state management for conversations/tasks
- **Memory System (`memory/`)**: Dual-tier storage (working memory + persistent storage)
- **Task Runner (`task.ts`)**: Async operation management with concurrency control
- **Engine (`engine.ts`)**: Execution engine processing inputs and coordinating actions

### Package Structure
- **`packages/core/`** - Core framework with agent, context, memory, and task systems
- **`packages/*`** - Extensions for platforms (discord, twitter, telegram), storage (supabase, chroma, mongo), chains (hyperliquid, defai), utilities (cli, create-agent, synthetic)
- **`examples/`** - Working examples organized by use case (basic, chains, games, social platforms)
- **`clients/example-ui/`** - React frontend demonstrating agent capabilities
- **`docs/`** - Next.js documentation site

### Key Concepts
- **Context**: Isolated stateful environment (like a chat session) with type-safe args and memory
- **Working Memory**: Temporary execution state (inputs, outputs, calls, results, thoughts)
- **Actions**: Type-safe functions agents can execute
- **Extensions**: Plugin architecture for platforms, storage, and custom features

### Memory Architecture
The system uses a two-tier memory approach:
1. **Working Memory**: Temporary state during execution (logs, calls, results)
2. **Persistent Storage**: Long-term memory via pluggable stores (KV, Vector)

Context state is automatically persisted and restored between sessions.

### Context System
Each context maintains isolated state identified by `type:key`. Contexts can have:
- Custom creation logic (`create`)
- Schema validation for arguments (`schema`)
- Setup/teardown hooks (`setup`, `onStep`, `onRun`, `onError`)
- Custom save/load logic (`save`, `load`)

## Development Notes

### Writing Documentation
Follow `.cursor/rules/write-docs.mdc` guidelines:
- Avoid marketing language ("powerful", "built-in", "complete")
- Focus on technical details over benefits
- Address engineers directly with nuts-and-bolts information
- Use frontmatter in MDX tutorials
- Extract meaningful content from examples, not just copy code

### Monorepo Structure
- Uses **pnpm workspaces** with Lerna for package management
- TypeScript configuration shared via `tsconfig.json` at root
- Build system uses `tsup` for individual packages
- Dependencies managed via catalog pattern in `package.json`

### Testing Approach
- Primary testing runs through `bun run packages/core`
- Tests are co-located with source files (`*.test.ts`)
- Uses Vitest as the test runner

### Extension Development
New extensions should follow the pattern:
- Implement extension interface with optional `inputs`, `outputs`, `actions`, `services`
- Provide `install` hook for setup
- Register contexts if the extension adds new context types

## Complete Data Flow Architecture

### 1. Agent Creation and Initialization

When you create an agent with `createDreams()`:

```
createDreams(config) → Agent instance
├── Container (dependency injection)
├── TaskRunner (concurrency management)
├── Memory (store + vector)
├── Registry (contexts, actions, outputs, inputs)
└── Context tracking maps (contextIds, contexts, contextsRunning)
```

The agent maintains:
- **contextIds**: Set of all known context IDs
- **contexts**: Map of context ID → ContextState
- **contextsRunning**: Map of context ID → running execution state
- **workingMemories**: Map of context ID → WorkingMemory

### 2. Message Processing Flow

When a user sends a message via `agent.send()`:

```
1. Create InputRef → wraps user input with metadata
2. Call agent.run() with InputRef in chain
3. Get/Create ContextState for the conversation
4. Get/Create WorkingMemory for the context
5. Create Engine instance for this execution
6. Process through Engine's router system
7. Generate LLM response with structured XML parsing
8. Handle outputs and persist state
```

### 3. Engine: The Execution Core

The Engine (`engine.ts`) orchestrates all execution:

```
Engine State:
├── step: Current execution step number
├── chain: Array of all logs (inputs, outputs, actions, etc.)
├── contexts: Array of active ContextStates
├── promises: Array of pending async operations
├── errors: Array of any errors encountered
└── defer: Promise that resolves when execution completes

Engine Router handles:
├── input → Processes InputRef through input handlers
├── output → Processes OutputRef through output handlers
└── action_call → Executes actions with full context
```

### 4. Context System Deep Dive

Contexts are isolated stateful environments:

```
Context Creation Flow:
1. context() defines configuration
2. getContext() creates/retrieves ContextState
3. ContextState contains:
   ├── id: "type:key" identifier
   ├── memory: Custom data from create()
   ├── settings: Model and execution settings
   ├── workingMemory: Execution logs
   └── options: Setup-time configuration

Context Lifecycle:
1. Setup → context.setup() runs
2. Active → Processes messages
3. Step → context.onStep() after each LLM call
4. Run → context.onRun() after execution
5. Save → Persisted to memory store
```

### 5. Working Memory Architecture

Working Memory tracks all execution logs:

```
WorkingMemory Structure:
├── inputs: Array<InputRef> - User messages
├── outputs: Array<OutputRef> - Agent responses
├── thoughts: Array<ThoughtRef> - LLM reasoning
├── calls: Array<ActionCall> - Action invocations
├── results: Array<ActionResult> - Action results
├── events: Array<EventRef> - System events
├── steps: Array<StepRef> - Execution steps
└── runs: Array<RunRef> - Complete runs

Log Processing:
1. LLM generates XML-structured response
2. Stream parser extracts elements in real-time
3. Elements pushed to WorkingMemory arrays
4. Subscribers notified of new logs
5. Memory persisted after each step
```

### 6. Action Execution Flow

Actions are type-safe functions with full context access:

```
Action Call Flow:
1. LLM outputs <action_call name="search">
2. Engine router resolves action by name
3. prepareActionCall():
   ├── Parse action arguments
   ├── Resolve templates (e.g., {{calls[0].data}})
   ├── Validate with Zod schema
   └── Create ActionCallContext
4. TaskRunner enqueues action
5. Action handler executes with context
6. Result pushed back to WorkingMemory
7. Available to LLM in next step
```

### 7. Memory Persistence

Two-tier memory system:

```
Persistent Storage (between sessions):
├── context:{id} → Context metadata
├── memory:{id} → Context custom memory
├── working-memory:{id} → Execution logs
└── contexts → Array of all context IDs

Working Memory (during execution):
├── Held in engine.state
├── Pushed to after each log
├── Persisted after each step
└── Restored on context load
```

### 8. Stream Processing

Real-time XML parsing for LLM responses:

```
Stream Flow:
1. LLM generates text stream
2. xmlStreamParser processes chunks
3. Detects elements: <think>, <action_call>, <output>
4. Pushes incomplete elements to subscribers
5. Completes elements when closing tag found
6. Each element becomes a typed Ref in WorkingMemory
```

### 9. Concurrency Management

TaskRunner ensures controlled execution:

```
Task Queuing:
├── Default "main" queue with concurrency limit
├── Actions can specify custom queues
├── Priority-based task ordering
├── Retry logic with exponential backoff
└── AbortController integration
```

### 10. Data Flow Example

Here's a complete example of processing "Search for AI news":

```
1. User Input:
   InputRef { content: "Search for AI news", type: "text" }

2. Engine prepares prompt with:
   - System instructions
   - Available actions
   - Working memory history
   - Context state

3. LLM responds:
   <think>User wants AI news, I'll search for it</think>
   <action_call name="search">
   {"query": "AI news latest"}
   </action_call>

4. Engine processes:
   - ThoughtRef → workingMemory.thoughts
   - ActionCall → router → action handler
   - ActionResult → workingMemory.results

5. Next step includes results:
   - LLM sees search results in working memory
   - Generates response with findings

6. Final output:
   <output type="text">
   Here are the latest AI news...
   </output>

7. State persisted:
   - WorkingMemory saved
   - Context state updated
   - Ready for next interaction
```

This architecture ensures every piece of data flows through well-defined paths, maintains type safety, and enables powerful features like action chaining, context switching, and long-term memory.

## Framework Improvement Opportunities

Based on deep analysis of the core package, here are key areas where Daydreams could be enhanced:

### 1. Error Handling & Recovery
**Current Issues:**
- Scattered error handling across engine, actions, and contexts
- No automatic retry for failed LLM calls
- Errors pushed to `state.errors` without clear recovery strategy
- Error events created but not well-typed

**Suggested Improvements:**
- Unified error handling with typed error classes
- Automatic retry logic for transient failures (network, rate limits)
- Error recovery mechanisms (rollback state, retry from checkpoint)
- Error aggregation and reporting dashboard

### 2. Memory Management & Performance
**Current Issues:**
- Working memory grows unbounded during long conversations
- No automatic pruning or summarization
- All logs kept in memory during execution
- No streaming to disk for large contexts

**Suggested Improvements:**
- Memory windowing with automatic summarization
- Streaming persistence for large working memories
- Memory indexing for faster retrieval
- Memory usage limits and eviction policies

### 3. Type Safety & Developer Experience
**Current Issues:**
- Heavy use of `any` types throughout codebase
- Complex generics hard to understand
- Template resolution (`{{calls[0].data}}`) is string-based
- No compile-time validation of action names

**Suggested Improvements:**
- Stronger typing for contexts, actions, and memory
- Type-safe template system with autocomplete
- Better generic constraints and inference
- Runtime validation with development warnings

### 4. Testing & Debugging
**Current Issues:**
- Limited test coverage in core package
- No built-in debugging tools
- Difficult to replay conversation states
- No execution flow visualization

**Suggested Improvements:**
- Execution replay functionality
- Built-in debugging UI/CLI tools
- Structured logging with trace IDs
- Visual execution flow debugger
- Test utilities for mocking LLM responses

### 5. Concurrency & State Management
**Current Issues:**
- `contextsRunning` prevents concurrent messages to same context
- No parallel execution within a context
- Basic task queuing without sophisticated scheduling
- Possible race conditions in state updates

**Suggested Improvements:**
- Queue multiple messages per context
- Support parallel action execution
- Advanced task scheduling (priority queues, deadlines)
- Atomic state updates with proper locking

### 6. LLM Integration
**Current Issues:**
- XML parsing is fragile and model-specific
- No fallback for models without XML support
- Fixed prompt structure
- No function calling API support

**Suggested Improvements:**
- Multiple output formats (JSON, function calls, XML)
- Automatic format detection by model capability
- Customizable prompt templates per model
- Model-specific quirk handling

### 7. Modularity & Extension System
**Current Issues:**
- Extensions modify global state
- No isolation between extensions
- No dependency management
- Limited lifecycle hooks

**Suggested Improvements:**
- Scoped extensions with namespaces
- Extension dependency resolution
- More lifecycle hooks (pre/post execution)
- Extension marketplace/registry

### 8. Performance Optimizations
**Current Issues:**
- Every state change triggers full persistence
- No caching of frequently accessed data
- Vector search on every input
- Synchronous state updates block execution

**Suggested Improvements:**
- Batch persistence updates
- In-memory caching layer
- Lazy loading of context data
- Async state updates with eventual consistency

### 9. Monitoring & Observability
**Current Issues:**
- No built-in metrics collection
- Limited structured logging
- No distributed tracing support
- No performance profiling

**Suggested Improvements:**
- OpenTelemetry integration
- Built-in metrics (latency, tokens, errors)
- Distributed tracing for multi-agent systems
- Performance profiling tools

### 10. Context System Enhancements
**Current Issues:**
- Isolated contexts with no communication
- No context hierarchies or inheritance
- Limited lifecycle management
- No built-in versioning

**Suggested Improvements:**
- Inter-context communication protocols
- Context inheritance and composition
- Advanced lifecycle (suspend, resume, fork)
- Context versioning and migration

### Implementation Priority
1. **Immediate**: Error handling, type safety, memory windowing
2. **Medium-term**: Testing infrastructure, debugging tools, performance
3. **Long-term**: Advanced contexts, distributed support, extension marketplace

## Documentation Structure

### README Files
The repository follows a comprehensive README structure to help developers navigate the codebase:

#### Package READMEs (`packages/*/README.md`)
Every package has its own README with:
- Package description and purpose
- Installation instructions
- Quick start example
- API reference or link to full docs
- Configuration options
- Links to relevant examples

#### Example READMEs (`examples/*/README.md`)
Each example directory contains a README explaining:
- What concepts are demonstrated
- Prerequisites and setup instructions
- How to run the example
- Expected output
- Key files and their purpose

#### Sub-module READMEs
Complex sub-modules have their own documentation:
- `packages/core/src/memory/README.md` - Memory system details
- `packages/core/src/memory/exporters/README.md` - Export system usage

### Finding Information
When looking for documentation:
1. **Start with package README** - Check `packages/[name]/README.md` for package-specific info
2. **Check examples** - Look in `examples/` for practical implementations
3. **Sub-module docs** - Complex features may have README in their source directory
4. **Main docs site** - Full documentation at `docs/content/docs/`

### Documentation Standards
- **Technical focus** - Direct, engineering-focused content without marketing language
- **Example-first** - Show working code before explaining concepts
- **Complete examples** - All code snippets should be runnable
- **Clear structure** - Consistent sections across all READMEs