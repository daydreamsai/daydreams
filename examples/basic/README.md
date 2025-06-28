# Basic Examples

A collection of fundamental examples demonstrating core Daydreams features and common use cases.

## Examples in this Directory

1. **example-basic.ts** - Simple chat interface with a character personality
2. **example-chat-with-code.ts** - Agent that can write and execute code
3. **example-chroma.ts** - Vector database integration with Chroma
4. **example-filesystem.ts** - File system operations and memory persistence
5. **example-supabase.ts** - Supabase integration for cloud storage

## Prerequisites

- Node.js 18+
- API keys for the services you want to use:
  - OpenAI API key
  - Anthropic API key (optional)
  - Groq API key (optional)
  - Supabase credentials (for Supabase example)

## Setup

1. Clone the repository and navigate to this directory:
```bash
cd examples/basic
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with your API keys:
```bash
cp .env.example .env
# Edit .env with your API keys
```

Example `.env` file:
```env
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key  # Optional
GROQ_API_KEY=your_groq_key            # Optional
SUPABASE_URL=your_supabase_url       # For Supabase example
SUPABASE_ANON_KEY=your_anon_key      # For Supabase example
```

## Running the Examples

### Basic Chat Example
The simplest example showing a character-based chat:

```bash
npx tsx example-basic.ts
```

This demonstrates:
- Creating a character with personality traits
- Basic CLI interaction
- Context management
- Simple conversation flow

### Chat with Code Execution
An agent that can write and execute TypeScript code:

```bash
npx tsx example-chat-with-code.ts
```

Features:
- Code generation and execution
- File system access
- Error handling
- Multi-step problem solving

### Chroma Vector Database
Example using Chroma for semantic search:

```bash
# Start Chroma first (requires Docker)
docker run -p 8000:8000 chromadb/chroma

# Run the example
npx tsx example-chroma.ts
```

Demonstrates:
- Vector embeddings
- Semantic search
- Memory with vector storage
- Document retrieval

### File System Memory
Persistent memory using the file system:

```bash
npx tsx example-filesystem.ts
```

Shows:
- File-based memory storage
- Context persistence
- Session resumption
- Data export

### Supabase Integration
Cloud-based memory with Supabase:

```bash
npx tsx example-supabase.ts
```

Features:
- Cloud storage
- Real-time sync
- Multi-user support
- Scalable memory

## Key Concepts Demonstrated

### 1. Context Creation
```typescript
const myContext = context({
  type: 'chat',
  schema: z.object({
    userId: z.string()
  }),
  create: async ({ args }) => ({
    messages: [],
    user: args.userId
  })
});
```

### 2. Action Definition
```typescript
const searchAction = action({
  name: 'search',
  description: 'Search for information',
  schema: z.object({
    query: z.string()
  }),
  handler: async ({ call }) => {
    // Implementation
    return { results: [...] };
  }
});
```

### 3. Agent Creation
```typescript
const agent = createDreams({
  model: openai('gpt-4'),
  contexts: [myContext],
  actions: [searchAction],
  extensions: [cliExtension()]
});
```

## Common Patterns

### Error Handling
All examples include proper error handling:
```typescript
try {
  await agent.start();
} catch (error) {
  console.error('Failed to start agent:', error);
  process.exit(1);
}
```

### Environment Validation
Using Zod for environment variable validation:
```typescript
validateEnv(
  z.object({
    OPENAI_API_KEY: z.string().min(1)
  })
);
```

### Memory Persistence
Examples show different persistence strategies:
- In-memory (default)
- File system
- Vector database
- Cloud storage

## Next Steps

After running these examples, explore:

1. [Actions Example](../actions) - Advanced action usage
2. [Contexts Example](../contexts) - Multi-context agents
3. [Discord Example](../discord) - Building a Discord bot
4. [Memory Example](../memory) - Advanced memory patterns

## Troubleshooting

### Missing API Keys
Ensure all required environment variables are set in your `.env` file.

### Import Errors
Make sure you've built the packages:
```bash
cd ../.. && pnpm build
```

### Permission Errors
Some examples write to the file system. Ensure you have write permissions in the current directory.

## Contributing

Feel free to add more basic examples that demonstrate fundamental concepts. See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

MIT