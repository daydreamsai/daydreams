// Memory-Powered CLI Agent
// Demonstrates the full memory suite with conversations, recall, and episodes

import { openai } from "@ai-sdk/openai";
import {
  createDreams,
  context,
  action,
  validateEnv,
  MemorySystem,
  InMemoryKeyValueProvider,
  InMemoryVectorProvider,
  InMemoryGraphProvider,
} from "@daydreamsai/core";
import { cliExtension } from "@daydreamsai/cli";
import * as z from "zod/v4";

validateEnv(
  z.object({
    OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
  })
);

// Types for our memory system
interface UserSession {
  id: string;
  name: string;
  startTime: string;
  conversationCount: number;
  topics: string[];
  preferences: Record<string, any>;
}

interface ConversationMemory {
  id: string;
  userMessage: string;
  agentResponse: string;
  timestamp: string;
  topic?: string;
  sentiment?: "positive" | "neutral" | "negative";
  entities?: string[];
}

// Memory storage action
const storeMemoryAction = action({
  name: "store-memory",
  description: "Store important information in memory for later recall",
  schema: z.object({
    type: z.enum(["fact", "preference", "context", "relationship"]),
    content: z.string().describe("The information to store"),
    tags: z
      .record(z.string(), z.string())
      .optional()
      .describe("Tags for categorization"),
    entities: z.array(z.string()).optional().describe("Related entities"),
  }),
  handler: async ({ type, content, tags, entities }, ctx) => {
    const memoryId = `memory:${Date.now()}:${Math.random()
      .toString(36)
      .substring(2, 11)}`;

    // Store in KV for quick access
    await ctx.memory.kv.set(memoryId, {
      type,
      content,
      tags: tags || {},
      entities: entities || [],
      timestamp: new Date().toISOString(),
      sessionId: ctx.args.sessionId,
    });

    // Index in vector memory for semantic search
    await ctx.memory.vector.index([
      {
        id: memoryId,
        content: `${type}: ${content}`,
        metadata: {
          type: "stored_memory",
          memoryType: type,
          sessionId: ctx.args.sessionId,
          ...(tags || {}),
        },
      },
    ]);

    // Create entities and relationships in graph if provided
    if (entities && entities.length > 0) {
      for (const entity of entities) {
        const entityId = `entity:${entity.toLowerCase().replace(/\s+/g, "_")}`;

        try {
          await ctx.memory.graph.addEntity({
            id: entityId,
            type: "concept",
            name: entity,
            properties: { source: "user_mention" },
            contextIds: [ctx.args.sessionId],
          });

          await ctx.memory.graph.addRelationship({
            id: `rel:${memoryId}:${entityId}`,
            from: memoryId,
            to: entityId,
            type: "mentions",
            strength: 0.8,
          });
        } catch (error) {
          // Entity might already exist, continue
        }
      }
    }

    console.log(`🧠 Stored ${type} memory: ${content.substring(0, 50)}...`);
    return {
      success: true,
      memoryId,
      message: `Stored ${type} information in memory`,
    };
  },
});

// Memory recall action
const recallMemoryAction = action({
  name: "recall-memory",
  description: "Search and recall relevant memories based on a query",
  schema: z.object({
    query: z.string().describe("What to search for in memory"),
    type: z
      .enum(["fact", "preference", "context", "relationship", "any"])
      .optional(),
    limit: z.number().min(1).max(10).default(5),
  }),
  handler: async ({ query, type, limit }, ctx) => {
    const results = [];

    // Search vector memory for semantic matches
    const vectorResults = await ctx.memory.vector.search({
      query,
      filter: type ? { memoryType: type } : {},
      limit,
      includeContent: true,
      includeMetadata: true,
    });

    // Get detailed memory from KV store
    for (const result of vectorResults) {
      const memoryDetails = await ctx.memory.kv.get(result.id);
      if (memoryDetails) {
        results.push({
          ...memoryDetails,
          relevanceScore: result.score,
          id: result.id,
        });
      }
    }

    console.log(`🔍 Found ${results.length} relevant memories for: "${query}"`);
    results.forEach((memory: any, i: number) => {
      console.log(
        `  ${i + 1}. [${memory.type}] ${
          memory.content
        } (score: ${memory.relevanceScore?.toFixed(2)})`
      );
    });

    return {
      success: true,
      results,
      count: results.length,
      query,
    };
  },
});

// Conversation summary action
const summarizeConversationAction = action({
  name: "summarize-conversation",
  description:
    "Create a summary of the current conversation for episodic memory",
  schema: z.object({
    conversationId: z.string(),
    keyPoints: z.array(z.string()).describe("Key points from the conversation"),
    topics: z.array(z.string()).describe("Main topics discussed"),
    sentiment: z.enum(["positive", "neutral", "negative"]).default("neutral"),
  }),
  handler: async ({ conversationId, keyPoints, topics, sentiment }, ctx) => {
    const episodeId = `episode:${conversationId}:${Date.now()}`;

    const episodeData = {
      id: episodeId,
      conversationId,
      keyPoints,
      topics,
      sentiment,
      timestamp: new Date().toISOString(),
      sessionId: ctx.args.sessionId,
    };

    // Store episode in KV
    await ctx.memory.kv.set(episodeId, episodeData);

    // Index episode for semantic search
    await ctx.memory.vector.index([
      {
        id: episodeId,
        content: `Conversation about ${topics.join(", ")}: ${keyPoints.join(
          ". "
        )}`,
        metadata: {
          type: "episode",
          conversationId,
          sentiment,
          sessionId: ctx.args.sessionId,
          topics,
        },
      },
    ]);

    // Create topic entities and relationships
    for (const topic of topics) {
      const topicId = `topic:${topic.toLowerCase().replace(/\s+/g, "_")}`;

      try {
        await ctx.memory.graph.addEntity({
          id: topicId,
          type: "topic",
          name: topic,
          properties: { category: "conversation_topic" },
          contextIds: [ctx.args.sessionId],
        });

        await ctx.memory.graph.addRelationship({
          id: `rel:${episodeId}:${topicId}`,
          from: episodeId,
          to: topicId,
          type: "discussed",
          strength: 0.9,
        });
      } catch (error) {
        // Topic might already exist
      }
    }

    console.log(
      `📚 Created episode summary for conversation ${conversationId}`
    );
    console.log(`   Topics: ${topics.join(", ")}`);
    console.log(`   Sentiment: ${sentiment}`);
    console.log(`   Key Points: ${keyPoints.length}`);

    return {
      success: true,
      episodeId,
      summary: episodeData,
    };
  },
});

// Memory stats action
const memoryStatsAction = action({
  name: "memory-stats",
  description: "Show memory system statistics and recent memories",
  schema: z.object({}),
  handler: async ({}, ctx) => {
    console.log("\n🧠 Memory System Statistics:");
    console.log("=" + "=".repeat(30));

    try {
      // Count memories by type
      const allKeys = await ctx.memory.kv.keys("memory:*");
      const episodeKeys = await ctx.memory.kv.keys("episode:*");

      console.log(`📊 Stored Memories: ${allKeys.length}`);
      console.log(`📚 Episodes: ${episodeKeys.length}`);

      // Show recent memories
      if (allKeys.length > 0) {
        console.log("\n🔍 Recent Memories:");
        const recentKeys = allKeys.slice(-3);
        for (const key of recentKeys) {
          const memory = await ctx.memory.kv.get(key);
          if (memory) {
            console.log(
              `  • [${memory.type}] ${memory.content?.substring(0, 60)}...`
            );
          }
        }
      }
    } catch (error) {
      console.log("Error retrieving memory stats:", error);
    }

    return {
      success: true,
      message: "Memory statistics displayed",
    };
  },
});

// Show episodes action
const showEpisodesAction = action({
  name: "show-episodes",
  description: "Display all conversation episodes",
  schema: z.object({}),
  handler: async ({}, ctx) => {
    console.log("\n📚 Conversation Episodes:");
    console.log("=" + "=".repeat(25));

    try {
      const episodeKeys = await ctx.memory.kv.keys("episode:*");

      if (episodeKeys.length === 0) {
        console.log("No episodes found yet. Keep chatting to create some!");
      } else {
        for (const key of episodeKeys) {
          const episode = await ctx.memory.kv.get(key);
          if (episode) {
            console.log(`\n📝 Episode: ${episode.conversationId}`);
            console.log(
              `   Time: ${new Date(episode.timestamp).toLocaleString()}`
            );
            console.log(
              `   Topics: ${episode.topics?.join(", ") || "General"}`
            );
            console.log(`   Sentiment: ${episode.sentiment || "neutral"}`);
            console.log(`   Key Points: ${episode.keyPoints?.length || 0}`);
          }
        }
      }
    } catch (error) {
      console.log("Error retrieving episodes:", error);
    }

    return {
      success: true,
      message: "Episodes displayed",
    };
  },
});

// Main conversation context
const conversationContext = context({
  type: "memory-conversation",
  schema: z.object({
    sessionId: z.string(),
    userName: z.string().optional(),
  }),
  create: (args) => ({
    sessionId: args.args.sessionId,
    userName: args.args.userName || "User",
    conversationHistory: [] as ConversationMemory[],
    currentConversationId: `conv_${Date.now()}`,
    messageCount: 0,
    startTime: new Date().toISOString(),
  }),
  instructions: `You are a helpful AI assistant with a powerful memory system. You can:

1. **Remember Information**: Store facts, preferences, and context for future conversations
2. **Recall Memories**: Search through previous conversations and stored information
3. **Learn from Interactions**: Build up knowledge about the user over time
4. **Track Episodes**: Summarize conversations into memorable episodes

Key behaviors:
- When the user shares important information, use store-memory to save it
- When answering questions, use recall-memory to find relevant past information
- Periodically create episode summaries of meaningful conversations
- Be conversational and refer to past interactions when relevant
- Ask follow-up questions to build richer memories

Always explain what you're doing with memory so the user can see the system in action.

Available memory actions:
- store-memory: Store important facts, preferences, or context
- recall-memory: Search for relevant memories
- summarize-conversation: Create episode summaries
- memory-stats: Show memory system statistics
- show-episodes: Display conversation episodes`,
});

// Set up the agent with full memory system and CLI extension
async function main() {
  console.log("🧠 Initializing Memory-Powered AI Assistant...");

  const memory = new MemorySystem({
    providers: {
      kv: new InMemoryKeyValueProvider(),
      vector: new InMemoryVectorProvider(),
      graph: new InMemoryGraphProvider(),
    },
  });

  const sessionId = `session_${Date.now()}`;

  console.log(`Session ID: ${sessionId}`);
  console.log("\nThe assistant has a full memory system including:");
  console.log("• 🗄️  Key-Value storage for quick facts");
  console.log("• 🔍 Vector search for semantic memory");
  console.log("• 🕸️  Graph relationships between concepts");
  console.log("• 📚 Episodic memory for conversation summaries");
  console.log("\nChat naturally and the agent will use memory automatically!");
  console.log(
    "Available commands: store-memory, recall-memory, memory-stats, show-episodes\n"
  );

  const agent = createDreams({
    model: openai("gpt-4o"),
    memory,
    contexts: [
      conversationContext.setActions([
        storeMemoryAction,
        recallMemoryAction,
        summarizeConversationAction,
        memoryStatsAction,
        showEpisodesAction,
      ]),
    ],
    extensions: [cliExtension],
  });

  await agent.start();

  // Run the CLI with memory context
  await agent.run({
    context: conversationContext,
    args: { sessionId, userName: "User" },
  });
}

// Start the agent
if (require.main === module) {
  main().catch((error) => {
    console.error("💥 Failed to start memory agent:", error);
    process.exit(1);
  });
}
