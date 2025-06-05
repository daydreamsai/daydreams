/**
 * Debug Synthetic Data Example
 *
 * This version manually calls synthetic data actions to debug the issue.
 */

import { createDreams, context, action } from "@daydreamsai/core";
import { createSyntheticData } from "@daydreamsai/synthetic";
import { cliExtension } from "@daydreamsai/cli";
import { z } from "zod";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export const openrouter = createOpenRouter({
  apiKey: import.meta.env.OPENROUTER_API_KEY,
});

// Math tutor context
const mathContext = context({
  type: "math",
  schema: z.object({ id: z.string() }),
  key: ({ id }) => id,
  create: () => ({ problems: 0 }),
  render: () => "You are a helpful math tutor. Solve problems step by step.",
});

// Math problem action
const solveMath = action({
  name: "solve",
  description: "Solve a math problem",
  schema: z.object({
    problem: z.string(),
    answer: z.string(),
  }),
  handler: (data) => {
    console.log(`📝 Solved: ${data.problem} = ${data.answer}`);
    return { success: true };
  },
});

// Test action that manually adds data to synthetic collector
const testSynthetic = action({
  name: "testSynthetic",
  description: "Test synthetic data generation by manually adding data",
  schema: z.object({}),
  async handler() {
    console.log("🧪 Testing synthetic data collection...");

    // Just return a simple message since direct action calls aren't available
    console.log("📊 Check the buffer status with !synthetic.status");
    console.log("📊 Process data with !synthetic.process");

    return {
      message:
        "Test complete. Use !synthetic.status and !synthetic.process to check data collection.",
    };
  },
});

// Agent with synthetic data generation (trying REALTIME mode with more debug)
const agent = createDreams({
  model: openrouter("google/gemini-2.5-flash-preview-05-20"),
  contexts: [mathContext],
  extensions: [
    cliExtension,
    createSyntheticData({
      enabled: true,
      outputDir: "./training-data",
      formats: ["instruction-tuning", "reasoning-chains"],
      capture: {
        conversations: true,
        reasoning: true,
        actions: true,
        episodes: true,
        preferences: false,
      },
      mode: "realtime", // Back to realtime with proper config
      batchSize: 1,
      filters: {
        minConversationLength: 1, // Capture single interactions
        successfulOnly: false,
        // Remove context filter to capture ALL contexts
      },
    }),
  ],
  actions: [solveMath, testSynthetic],
});

console.log("🧪 Debug Synthetic Data Example");
console.log("Commands to try:");
console.log("  !testSynthetic      - Test synthetic data manually");
console.log("  !synthetic.status   - Check status");
console.log("  Ask math questions and then !synthetic.process");
console.log("");
console.log(
  "🔍 Root issue hypothesis: Extension ordering or context subscription timing"
);
console.log("");

// Start the agent
agent.start({ id: "debug-session" });
