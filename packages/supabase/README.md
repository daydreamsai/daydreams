# @daydreamsai/supabase

A Supabase integration package for the DaydreamsAI platform, providing vector
storage with pgvector and memory storage capabilities.

## Features

- Store and retrieve vector embeddings in Supabase using pgvector
- Perform similarity searches with customizable thresholds and filters
- Persistent memory storage for conversation data
- Fully typed API with Zod schema validation
- Implements core DaydreamsAI interfaces for seamless integration

## Installation

```bash
npm install @daydreamsai/supabase
# or
yarn add @daydreamsai/supabase
# or
pnpm add @daydreamsai/supabase
```

## Usage

### Vector Store

#### Basic Vector Store Setup

```typescript
import { SupabaseVectorStore } from "@daydreamsai/supabase";
import { createClient } from "@supabase/supabase-js";

// Create a Supabase client
const supabaseClient = createClient(
  "https://your-project-url.supabase.co",
  "your-supabase-api-key"
);

// Create a vector store
const vectorStore = new SupabaseVectorStore({
  client: supabaseClient,
  tableName: "embeddings",
});

// Initialize the database schema (creates tables and functions)
await vectorStore.initialize(1536); // 1536 is the dimension of OpenAI embeddings
```

#### Using Core VectorStore Interface

```typescript
import { createSupabaseStore } from '@daydreamsai/supabase';

// Create a vector store that implements the core VectorStore interface
const vectorStore = createSupabaseStore(
  'https://your-project-url.supabase.co',
  'your-supabase-api-key',
  'embeddings' // optional table name
);

// Use with the core interface
await vectorStore.upsert('context-123', [
  {
    id: '1',
    content: 'This is a sample text',
    embedding: [0.1, 0.2, 0.3, ...], // Your embedding vector
    metadata: { source: 'example' },
  }
]);

// Query for similar vectors
const results = await vectorStore.query('context-123', {
  embedding: [0.1, 0.2, 0.3, ...],
  threshold: 0.7,
  limit: 5
});
```

### Memory Store

```typescript
import { createSupabaseMemory } from "@daydreamsai/supabase";

// Create a memory store that implements the core MemoryStore interface
const memoryStore = createSupabaseMemory(
  "https://your-project-url.supabase.co",
  "your-supabase-api-key",
  "memory" // optional table name
);

// Store data
await memoryStore.set("conversation-123", {
  messages: [
    { role: "user", content: "Hello" },
    { role: "assistant", content: "Hi there!" },
  ],
});

// Retrieve data
const conversation = await memoryStore.get("conversation-123");

// Delete data
await memoryStore.delete("conversation-123");

// Clear all data
await memoryStore.clear();
```

### Complete Memory System

```typescript
import { createSupabaseBaseMemory } from "@daydreamsai/supabase";
import { OpenAI } from "openai";

// Create OpenAI client for embeddings
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Create a complete memory system with both memory store and vector store
const memory = createSupabaseBaseMemory({
  url: "https://your-project-url.supabase.co",
  key: "your-supabase-api-key",
  memoryTableName: "memory",
  vectorTableName: "embeddings",
  vectorModel: {
    // Implement the TextEmbeddingModel interface for embeddings
    provider: "openai",
    modelId: "text-embedding-3-small",
    async generateEmbeddings(texts) {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: texts,
      });
      return response.data.map((item) => item.embedding);
    },
  },
});

// Use the memory system with an agent
const agent = createAgent({
  memory,
  // ... other agent configuration
});
```

### Using Vector Store with Embeddings

The Supabase vector store now includes built-in support for generating
embeddings. You can use the default OpenAI embedding provider or provide your
own custom embedding provider.

#### Default OpenAI Embedding Provider

If you have an OpenAI API key set in your environment variables
(`OPENAI_API_KEY`), the vector store will automatically use OpenAI's embedding
model to generate embeddings for your data:

```typescript
import { createSupabaseStore } from "@daydreamsai/supabase";

// Create a vector store with automatic OpenAI embeddings
const vectorStore = createSupabaseStore(
  "https://your-project-url.supabase.co",
  "your-supabase-api-key",
  "embeddings" // optional table name
);

// Add data to the vector store - embeddings will be generated automatically
await vectorStore.upsert("context-123", [
  { text: "This is a document about artificial intelligence" },
  { text: "This is a document about machine learning" },
]);

// Query the vector store - embeddings will be generated for the query text
const results = await vectorStore.query("context-123", "What is AI?");
```

#### Custom Embedding Provider

You can also provide your own custom embedding provider:

```typescript
import {
  createSupabaseStore,
  createOpenAIEmbeddingProvider,
  type TextEmbeddingModel,
} from "@daydreamsai/supabase";

// Use the built-in OpenAI provider with custom settings
const openaiEmbedder = createOpenAIEmbeddingProvider(
  "your-openai-api-key", // or use process.env.OPENAI_API_KEY
  "text-embedding-3-small" // specify the model
);

// Or create a custom embedding provider
const customEmbedder: TextEmbeddingModel = {
  provider: "custom",
  modelId: "my-custom-model",
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    // Implement your custom embedding logic here
    // This could call a local model, another API, etc.
    return texts.map((text) => {
      // Example: generate a simple embedding (not for production use)
      return Array.from({ length: 384 }, () => Math.random() - 0.5);
    });
  },
};

// Create a vector store with your custom embedding provider
const vectorStore = createSupabaseStore(
  "https://your-project-url.supabase.co",
  "your-supabase-api-key",
  "embeddings",
  customEmbedder // or openaiEmbedder
);

// Add and query data as before
await vectorStore.upsert("context-123", [
  { text: "This is a document about artificial intelligence" },
]);

const results = await vectorStore.query("context-123", "What is AI?");
```

## SQL Setup

The package includes SQL scripts to set up the necessary database functions in
Supabase:

```sql
-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Function to enable pgvector extension
CREATE OR REPLACE FUNCTION enable_pgvector_extension()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS vector;
END;
$$;

-- Function to execute arbitrary SQL
CREATE OR REPLACE FUNCTION execute_sql(query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE query;
END;
$$;
```

You can run these scripts in the Supabase SQL editor or use the provided
setup.sql file.

## License

MIT
