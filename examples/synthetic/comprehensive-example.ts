/**
 * Comprehensive Synthetic Data Example
 *
 * This example demonstrates ALL synthetic data formats:
 * - instruction-tuning: Input/output pairs for fine-tuning
 * - conversation: Multi-turn dialogue sequences
 * - reasoning-chains: Step-by-step thinking processes
 * - action-sequences: Function calls and results
 * - episodes: Complete interaction episodes
 * - grpo: Preference data for reinforcement learning
 */

import { createDreams, context, action } from "@daydreamsai/core";
import { createSyntheticData } from "@daydreamsai/synthetic";
import { cliExtension } from "@daydreamsai/cli";
import { z } from "zod";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Multi-purpose context for comprehensive testing
const assistantContext = context({
  type: "assistant",
  schema: z.object({ sessionId: z.string() }),
  key: ({ sessionId }) => sessionId,
  create: () => ({
    tasks: [],
    calculations: [],
    conversations: 0,
    preferences: { helpfulnessScore: 0.8 },
  }),
  render: (state) => `
Assistant Session: ${state.args.sessionId}
Tasks completed: ${state.memory.tasks.length}
Calculations done: ${state.memory.calculations.length}
Conversations: ${state.memory.conversations}
You are a helpful AI assistant that can:
- Perform calculations and explain reasoning
- Search for information 
- Manage tasks and to-dos
- Provide explanations with step-by-step thinking
  `,
});

// Action 1: Calculator with reasoning (demonstrates reasoning-chains)
const calculate = action({
  name: "calculate",
  description: "Perform mathematical calculations with step-by-step reasoning",
  schema: z.object({
    expression: z.string().describe("Mathematical expression to calculate"),
    explanation: z
      .string()
      .describe("Step-by-step explanation of the calculation"),
  }),
  handler: (data, ctx) => {
    console.log(`🧮 Calculating: ${data.expression}`);
    console.log(`📝 Reasoning: ${data.explanation}`);

    // Simulate calculation
    const result = eval(data.expression.replace(/[^0-9+\-*/().]/g, ""));

    // Initialize calculations array if it doesn't exist
    if (!ctx.memory.calculations) {
      ctx.memory.calculations = [];
    }

    // Update context memory
    ctx.memory.calculations.push({
      expression: data.expression,
      result,
      explanation: data.explanation,
      timestamp: Date.now(),
    });

    return {
      result,
      expression: data.expression,
      success: true,
    };
  },
});

// Action 2: Web search simulation (demonstrates action-sequences)
const webSearch = action({
  name: "webSearch",
  description: "Search for information on the web",
  schema: z.object({
    query: z.string().describe("Search query"),
    maxResults: z.number().optional().default(3),
  }),
  handler: async (data, ctx) => {
    console.log(`🔍 Searching for: ${data.query}`);

    // Simulate web search with realistic delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Mock search results
    const results = [
      {
        title: `Information about ${data.query}`,
        url: "https://example.com/1",
        snippet: `Detailed information about ${data.query}...`,
      },
      {
        title: `Guide to ${data.query}`,
        url: "https://example.com/2",
        snippet: `Complete guide covering ${data.query}...`,
      },
      {
        title: `Latest updates on ${data.query}`,
        url: "https://example.com/3",
        snippet: `Recent developments in ${data.query}...`,
      },
    ].slice(0, data.maxResults);

    return {
      results,
      query: data.query,
      totalFound: results.length,
      success: true,
    };
  },
});

// Action 3: Task management (demonstrates episodes)
const addTask = action({
  name: "addTask",
  description: "Add a task to the user's task list",
  schema: z.object({
    task: z.string().describe("Task description"),
    priority: z.enum(["low", "medium", "high"]).default("medium"),
  }),
  handler: (data, ctx) => {
    console.log(`✅ Adding task: ${data.task} (Priority: ${data.priority})`);

    const newTask = {
      id: Math.random().toString(36).substr(2, 9),
      description: data.task,
      priority: data.priority,
      completed: false,
      createdAt: Date.now(),
    };

    // Initialize tasks array if it doesn't exist
    if (!ctx.memory.tasks) {
      ctx.memory.tasks = [];
    }

    ctx.memory.tasks.push(newTask);

    return {
      taskId: newTask.id,
      task: data.task,
      totalTasks: ctx.memory.tasks.length,
      success: true,
    };
  },
});

// Action 4: Generate multiple responses (demonstrates GRPO preference data)
const generateAlternatives = action({
  name: "generateAlternatives",
  description:
    "Generate multiple response alternatives for preference learning",
  schema: z.object({
    prompt: z.string().describe("The prompt to generate alternatives for"),
    count: z.number().optional().default(3).describe("Number of alternatives"),
  }),
  handler: async (data, ctx) => {
    console.log(`🎯 Generating ${data.count} alternatives for: ${data.prompt}`);

    // Simulate generating multiple responses with different qualities
    const alternatives = [];
    const baseResponses = [
      "Here's a detailed and helpful response...",
      "Let me provide a brief answer...",
      "I'm not entirely sure, but...",
      "This is a comprehensive explanation...",
      "A quick response would be...",
    ];

    for (let i = 0; i < data.count; i++) {
      const response =
        baseResponses[i % baseResponses.length] +
        ` Response ${i + 1} to: ${data.prompt}`;
      const score = Math.random() * 0.4 + 0.6; // Random score between 0.6-1.0

      alternatives.push({
        text: response,
        score,
        rank: i + 1,
        model: "test-model",
        responseId: `alt_${i + 1}`,
      });
    }

    // Sort by score (best first)
    alternatives.sort((a, b) => b.score - a.score);
    alternatives.forEach((alt, idx) => (alt.rank = idx + 1));

    return {
      alternatives,
      prompt: data.prompt,
      bestScore: alternatives[0].score,
      success: true,
    };
  },
});

// Agent with ALL synthetic data formats enabled
const agent = createDreams({
  model: openrouter("google/gemini-2.5-flash-preview-05-20"),
  contexts: [assistantContext],
  extensions: [
    createSyntheticData({
      enabled: true,
      outputDir: "./training-data",
      // Enable ALL formats
      formats: [
        "instruction-tuning",
        "conversation",
        "reasoning-chains",
        "action-sequences",
        "episodes",
        "grpo",
      ],
      capture: {
        conversations: true, // For instruction-tuning and conversation formats
        reasoning: true, // For reasoning-chains format
        actions: true, // For action-sequences format
        episodes: true, // For episodes format
        preferences: true, // For GRPO format
      },
      mode: "realtime",
      batchSize: 1,
      filters: {
        minConversationLength: 1,
        successfulOnly: false,
      },
    }),
    cliExtension,
  ],
  actions: [calculate, webSearch, addTask, generateAlternatives],
});

console.log("🚀 Comprehensive Synthetic Data Example");
console.log("");
console.log("This example demonstrates ALL synthetic data formats:");
console.log("📚 instruction-tuning  - Input/output pairs for fine-tuning");
console.log("💬 conversation       - Multi-turn dialogue sequences");
console.log("🧠 reasoning-chains   - Step-by-step thinking processes");
console.log("⚡ action-sequences   - Function calls and results");
console.log("🎬 episodes          - Complete interaction episodes");
console.log(
  "🏆 grpo              - Preference data for reinforcement learning"
);
console.log("");
console.log("Example commands to try:");
console.log("• 'Calculate 25 * 8 and show your work'");
console.log("• 'Search for information about machine learning'");
console.log("• 'Add a task: Review quarterly reports'");
console.log("• 'Generate 3 different explanations of photosynthesis'");
console.log("• 'What is the capital of France?' (simple instruction)");
console.log("• Have a back-and-forth conversation");
console.log("");
console.log("Commands:");
console.log("  !synthetic.status    - Check capture status");
console.log("  !synthetic.process   - Generate training data files");
console.log("  !synthetic.analyze   - Analyze data quality");
console.log("");

// Start the agent
agent.start({ sessionId: "comprehensive-demo" });
