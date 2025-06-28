// Comprehensive Memory System Example
// This demonstrates how to use all memory features in a Daydreams agent

import { openai } from "@ai-sdk/openai";
import {
  createDreams,
  context,
  action,
  Logger,
  LogLevel,
  validateEnv,
  extension,
} from "@daydreamsai/core";
import {
  MemorySystem,
  InMemoryKeyValueProvider,
  InMemoryVectorProvider,
  InMemoryGraphProvider,
} from "@daydreamsai/core";
import { cliExtension } from "@daydreamsai/cli";
import * as z from "zod/v4";

// Validate environment variables
validateEnv(
  z.object({
    OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
  })
);

// Define a context that will use memory
const chatContext = context({
  type: "memory-chat",
  schema: z.object({
    userId: z.string(),
    sessionId: z.string().optional(),
  }),
  create: () => ({
    preferences: {},
    conversationHistory: [],
    facts: [],
  }),
  instructions: `
    You are a helpful assistant with persistent memory. You can:
    1. Remember user preferences and facts
    2. Search through past conversations
    3. Learn about relationships between concepts
    4. Store and retrieve structured data

    Always use your memory capabilities to provide personalized responses.
  `,
});

// Define actions that interact with memory
const rememberFactAction = action({
  name: "remember-fact",
  description: "Store an important fact about the user",
  schema: z.object({
    fact: z.string().describe("The fact to remember"),
    category: z
      .string()
      .describe("Category of the fact (e.g. 'preference', 'personal', 'work')"),
  }),
  handler: async ({ fact, category }, ctx, agent) => {
    // Store in KV memory for quick access
    await agent.memory.kv.set(`fact:${ctx.args.userId}:${Date.now()}`, {
      fact,
      category,
      timestamp: new Date().toISOString(),
    });

    // Store in vector memory for semantic search
    await agent.memory.vector.index([
      {
        id: `fact:${ctx.args.userId}:${Date.now()}`,
        content: `${category}: ${fact}`,
        metadata: {
          userId: ctx.args.userId,
          category,
          type: "fact",
        },
      },
    ]);

    // Store in graph memory as entity and relationship
    await agent.memory.graph.addEntity({
      id: `user:${ctx.args.userId}`,
      type: "user",
      name: `User ${ctx.args.userId}`,
      properties: {},
      contextIds: [ctx.id],
    });

    const factEntity = {
      id: `fact:${category}:${Date.now()}`,
      type: "fact",
      name: fact.slice(0, 50),
      properties: { category, fullText: fact },
      contextIds: [ctx.id],
    };
    await agent.memory.graph.addEntity(factEntity);

    await agent.memory.graph.addRelationship({
      id: `rel:${ctx.args.userId}:${Date.now()}`,
      from: `user:${ctx.args.userId}`,
      to: factEntity.id,
      type: "knows",
      strength: 0.9,
    });

    return `Remembered: ${fact} (Category: ${category})`;
  },
});

const searchMemoryAction = action({
  name: "search-memory",
  description: "Search through past conversations and facts",
  schema: z.object({
    query: z.string().describe("What to search for"),
    limit: z.number().default(5).describe("Maximum number of results"),
  }),
  handler: async ({ query, limit }, ctx, agent) => {
    // Search vector memory for semantic matches
    const results = await agent.memory.vector.search({
      query,
      limit,
      filter: { userId: ctx.args.userId },
      minScore: 0.7,
      includeContent: true,
      includeMetadata: true,
    });

    return {
      query,
      resultsCount: results.length,
      results: results.map((r: any) => ({
        content: r.content,
        score: r.score,
        metadata: r.metadata,
      })),
    };
  },
});

const getRelatedFactsAction = action({
  name: "get-related-facts",
  description:
    "Find facts related to a specific topic using graph relationships",
  schema: z.object({
    topic: z.string().describe("The topic to find related facts for"),
  }),
  handler: async ({ topic }, ctx, agent) => {
    // Use graph memory to find related facts
    const related = await agent.memory.graph.findRelated(
      `user:${ctx.args.userId}`,
      "knows"
    );

    return {
      topic,
      relatedFacts: related,
    };
  },
});

const memoryExtension = extension({
  name: "memory",
  contexts: { chatContext },
  actions: [rememberFactAction, searchMemoryAction, getRelatedFactsAction],
});

// Create agent with comprehensive memory
const agent = createDreams({
  model: openai("gpt-4o"),
  memory: new MemorySystem({
    providers: {
      kv: new InMemoryKeyValueProvider(),
      vector: new InMemoryVectorProvider(),
      graph: new InMemoryGraphProvider(),
    },
  }),
  extensions: [cliExtension, memoryExtension],
});

console.log("🧠 Memory System Example Started!");
console.log("Try commands like:");
console.log("- 'Remember that I like pizza'");
console.log("- 'What do you know about my food preferences?'");
console.log("- 'Search for what we talked about yesterday'");

// Start the agent
await agent.start();

// Run the context
await agent.run({
  context: chatContext,
  args: {
    userId: "example-user",
    sessionId: "memory-demo",
  },
});
