// Supabase Memory System Example
// This example shows how to use the Supabase memory system with proper embedding support

import { openai } from "@ai-sdk/openai";
import {
  createDreams,
  context,
  action,
  validateEnv,
} from "@daydreamsai/core";
import { createSupabaseMemory } from "@daydreamsai/supabase";
import { cliExtension } from "@daydreamsai/cli";
import * as z from "zod/v4";

// Validate environment variables
validateEnv(
  z.object({
    OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
    SUPABASE_URL: z.string().min(1, "SUPABASE_URL is required"),
    SUPABASE_SERVICE_KEY: z.string().min(1, "SUPABASE_SERVICE_KEY is required"),
  })
);

// Define a context for our Supabase memory demo
const supabaseContext = context({
  type: "supabase-demo",
  schema: z.object({
    userId: z.string(),
  }),
  create: () => ({
    notesCount: 0,
    lastQuery: null,
  }),
  instructions: `
    You are a note-taking assistant that uses Supabase for persistent storage.
    You can store notes and search through them semantically.
    
    Important: When indexing documents for vector search, you don't need to provide embeddings manually.
    The Supabase integration will handle embedding generation automatically.
  `,
});

// Action to store a note with both KV and vector storage
const storeNoteAction = action({
  name: "store-note",
  description: "Store a note with semantic search capability",
  schema: z.object({
    title: z.string().describe("Title of the note"),
    content: z.string().describe("Content of the note"),
    tags: z.array(z.string()).optional().describe("Optional tags for the note"),
  }),
  handler: async ({ title, content, tags }, ctx) => {
    const noteId = `note:${ctx.args.userId}:${Date.now()}`;
    
    // Store in KV for quick access
    await ctx.memory.kv.set(noteId, {
      title,
      content,
      tags: tags || [],
      userId: ctx.args.userId,
      createdAt: new Date().toISOString(),
    });

    // Index for semantic search
    // Note: No need to provide embeddings - Supabase provider handles this
    await ctx.memory.vector.index([{
      id: noteId,
      content: `${title}\n\n${content}`,
      metadata: {
        type: "note",
        userId: ctx.args.userId,
        title,
        tags: tags || [],
      },
    }]);

    // Create entities and relationships in graph
    await ctx.memory.graph.addEntity({
      id: `user:${ctx.args.userId}`,
      type: "user",
      name: `User ${ctx.args.userId}`,
      properties: {},
      contextIds: [ctx.id],
    });

    await ctx.memory.graph.addEntity({
      id: noteId,
      type: "note",
      name: title,
      properties: { content, tags: tags || [] },
      contextIds: [ctx.id],
    });

    await ctx.memory.graph.addRelationship({
      id: `rel:${noteId}`,
      from: `user:${ctx.args.userId}`,
      to: noteId,
      type: "created",
      strength: 1.0,
    });

    // Update context memory
    ctx.memory.notesCount++;

    return {
      success: true,
      noteId,
      message: `Stored note "${title}" with semantic search enabled`,
    };
  },
});

// Action to search notes semantically
const searchNotesAction = action({
  name: "search-notes",
  description: "Search through notes using semantic similarity",
  schema: z.object({
    query: z.string().describe("Search query"),
    limit: z.number().default(5).describe("Maximum number of results"),
  }),
  handler: async ({ query, limit }, ctx) => {
    // Update context memory
    ctx.memory.lastQuery = query;

    // Search using vector similarity
    const results = await ctx.memory.vector.search({
      query, // Supabase provider will generate embeddings for this query
      limit,
      filter: { userId: ctx.args.userId, type: "note" },
      minScore: 0.3,
      includeContent: true,
      includeMetadata: true,
    });

    return {
      query,
      resultsCount: results.length,
      results: results.map(r => ({
        noteId: r.id,
        title: r.metadata?.title,
        score: r.score,
        content: r.content?.slice(0, 200) + (r.content && r.content.length > 200 ? "..." : ""),
      })),
    };
  },
});

// Create agent with Supabase memory
const agent = createDreams({
  model: openai("gpt-4o"),
  memory: createSupabaseMemory({
    url: process.env.SUPABASE_URL!,
    key: process.env.SUPABASE_SERVICE_KEY!,
    kvTableName: "notes_kv",
    vectorTableName: "notes_vectors",
    nodesTableName: "notes_nodes",
    edgesTableName: "notes_edges",
    embeddingDimension: 1536,
  }),
  extensions: [cliExtension],
  contexts: [supabaseContext.setActions([storeNoteAction, searchNotesAction])],
});

console.log("📝 Supabase Memory System Example");
console.log("==================================");
console.log("This example demonstrates:");
console.log("- Storing notes in Supabase KV storage");
console.log("- Indexing notes for semantic search with automatic embedding generation");
console.log("- Creating entities and relationships in graph storage");
console.log("");
console.log("Try commands like:");
console.log("- 'Store a note about my vacation plans'");
console.log("- 'Search for notes about travel'");
console.log("- 'Find notes related to work projects'");
console.log("");

// Start the agent
await agent.start();

// Run the context
await agent.run({
  context: supabaseContext,
  args: {
    userId: "example-user",
  },
});