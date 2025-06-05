/**
 * Synthetic Data Generation Example
 *
 * This example demonstrates how to use Daydreams agents to automatically
 * generate high-quality training datasets from agent reasoning and interactions.
 */
import { groq } from "@ai-sdk/groq";
import {
  createDreams,
  context,
  action,
  validateEnv,
  type AnyAction,
  type AnyAgent,
  type AgentContext,
  type AnyContext,
} from "@daydreamsai/core";
import { createSyntheticData } from "@daydreamsai/synthetic";
import { cliExtension } from "@daydreamsai/cli";
import { z } from "zod";

// Validate required environment variables
validateEnv(
  z.object({
    GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY is required"),
  })
);

// Simple math tutor context for generating educational training data
const mathTutorContext = context({
  type: "math-tutor",
  schema: z.object({
    sessionId: z.string(),
  }),

  key({ sessionId }: { sessionId: string }) {
    return sessionId;
  },

  create() {
    return {
      problemsSolved: 0,
      currentDifficulty: "easy",
    };
  },

  render() {
    return `You are a helpful math tutor. You help students solve math problems step by step.

Always explain your reasoning step by step so students can learn.
When you solve problems, use the solveMathProblem action to show your work.`;
  },
});

// Action to solve math problems with step-by-step reasoning
const solveProblem = action({
  name: "solveMathProblem",
  description: "Solve a math problem with detailed step-by-step explanation",
  schema: z.object({
    problem: z.string().describe("The math problem to solve"),
    steps: z.array(z.string()).describe("Step-by-step solution process"),
    answer: z.string().describe("The final answer"),
  }),
  handler(
    data: { problem: string; steps: string[]; answer: string },
    ctx: AgentContext<AnyContext>,
    _agent: AnyAgent
  ) {
    const memory = ctx.agentMemory as {
      problemsSolved: number;
      currentDifficulty: string;
    };
    memory.problemsSolved = (memory.problemsSolved || 0) + 1;

    console.log("\n🧮 Math Problem Solved:");
    console.log("Problem:", data.problem);
    console.log("Steps:", data.steps.join(" → "));
    console.log("Answer:", data.answer);

    return {
      success: true,
      problemsSolved: memory.problemsSolved,
    };
  },
});

// Create the agent with synthetic data generation enabled
const mathAgent = createDreams({
  model: groq("deepseek-r1-distill-llama-70b"),
  context: mathTutorContext,
  extensions: [
    cliExtension,
    // Enable synthetic data generation
    createSyntheticData({
      enabled: true,
      outputDir: "./synthetic-data",
      formats: ["instruction-tuning", "reasoning-chains"],
      capture: {
        conversations: true,
        reasoning: true,
        actions: true,
        episodes: true,
        preferences: false,
      },
      mode: "batch",
      batchSize: 5,
      filters: {
        minConversationLength: 2,
        successfulOnly: false,
      },
    }),
  ],
  actions: [solveProblem],
});

// This example will use the CLI interface to demonstrate synthetic data generation
// To run:
// 1. Set your GROQ_API_KEY environment variable
// 2. Run: bun run example-synthetic.ts
// 3. Interact with the math tutor by asking math questions
// 4. The agent will automatically capture and process synthetic training data
//
// Example interactions to try:
// - "What is 15 + 27?"
// - "Calculate the area of a rectangle with length 8 and width 6"
// - "Solve for x: 2x + 5 = 15"
// - Then type "!synthetic.process" to generate training data
// - Type "!synthetic.status" to see current settings

console.log("🚀 Synthetic Data Generation Example");
console.log("=" + "=".repeat(49));
console.log("");
console.log("This example demonstrates automatic training data generation.");
console.log("Ask the math tutor some questions, then use these commands:");
console.log("");
console.log("📊 Commands:");
console.log("  !synthetic.process   - Process and export training data");
console.log("  !synthetic.status    - Show synthetic data settings");
console.log("  !synthetic.analyze   - Analyze data quality");
console.log("  exit                 - Quit the example");
console.log("");
console.log("🤖 Try asking math questions like:");
console.log("  - What is 25 + 17?");
console.log("  - Calculate 15% of 80");
console.log("  - Solve for x: 3x - 7 = 14");
console.log("");
console.log("The agent will capture its reasoning process and generate");
console.log("training datasets automatically!");
console.log("");

// Start the agent with CLI interface
mathAgent.start({ sessionId: "demo-session-001" });
