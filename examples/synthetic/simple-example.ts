/**
 * Simple Synthetic Data Example
 *
 * A minimal example showing how synthetic data generation works in Daydreams.
 * This creates a basic math tutor that automatically generates training data.
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

// Agent with synthetic data generation
const agent = createDreams({
  model: openrouter("google/gemini-2.5-flash-preview-05-20"),
  contexts: [mathContext],
  extensions: [
    // Put synthetic data extension FIRST to ensure it hooks into logs before CLI
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
      mode: "realtime",
      batchSize: 1, // Process immediately
      filters: {
        minConversationLength: 1,
        successfulOnly: false,
        // Don't filter by context - capture everything
      },
    }),
    cliExtension,
  ],
  actions: [solveMath],
});

console.log("🧮 Math Tutor with Synthetic Data Generation");
console.log(
  "Ask math questions, then use !synthetic.process to generate training data"
);
console.log("Example: 'What is 25 + 17?' then '!synthetic.process'");
console.log("");
console.log("🔍 Debug commands:");
console.log("  !synthetic.status    - Check if synthetic data is enabled");
console.log("  !synthetic.process   - Process captured data");
console.log("");
console.log("📝 Note: The agent runs in CLI context, so synthetic data");
console.log("should capture from ALL contexts, not just 'math' context.");
console.log("");

// Start the agent
agent.start({ id: "math-session" });
