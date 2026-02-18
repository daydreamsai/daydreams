import { createDreams, context, action } from "@daydreamsai/core";
import { cliExtension } from "@daydreamsai/cli";
import { openai } from "@ai-sdk/openai";
import * as z from "zod";

// Create a context - this is where the magic happens!
const assistantContext = context({
  type: "personal-assistant",

  // Each user gets their own context instance
  schema: z.object({
    userId: z.string().describe("Unique identifier for the user"),
  }),

  // Initialize memory for new users
  create: () => ({
    userName: "",
    lastTopic: "",
    preferences: {},
    conversationCount: 0,
  }),

  // Define what the LLM sees about this context
  render: (state) => {
    const { userName, conversationCount, lastTopic, preferences } =
      state.memory;

    return `
Personal Assistant for User: ${state.args.userId}
${userName ? `Name: ${userName}` : "Name: Unknown (ask for their name!)"}
Conversations: ${conversationCount}
${lastTopic ? `Last topic: ${lastTopic}` : ""}
${
  Object.keys(preferences).length > 0
    ? `Preferences: ${JSON.stringify(preferences, null, 2)}`
    : "No preferences saved yet"
}
    `.trim();
  },

  // Instructions that guide the assistant's behavior
  instructions: `You are a personal assistant with memory. You should:
- Remember information about the user across conversations
- Ask for their name if you don't know it
- Learn their preferences over time
- Reference previous conversations when relevant
- Be helpful and personalized based on what you know`,

  // Track conversation count
  onRun: async (ctx) => {
    ctx.memory.conversationCount++;
  },
});

// Add actions the assistant can perform
assistantContext.setActions([
  action({
    name: "remember-name",
    description: "Remember the user's name",
    schema: z.object({
      name: z.string().describe("The user's name"),
    }),
    handler: async ({ name }, ctx) => {
      ctx.memory.userName = name;
      return {
        remembered: true,
        message: `I'll remember your name is ${name}`,
      };
    },
  }),

  action({
    name: "update-topic",
    description: "Remember what we're discussing",
    schema: z.object({
      topic: z.string().describe("Current conversation topic"),
    }),
    handler: async ({ topic }, ctx) => {
      ctx.memory.lastTopic = topic;
      return { updated: true };
    },
  }),
]);

// Create the agent
const agent = createDreams({
  model: openai("gpt-4o-mini"),
  extensions: [cliExtension],
  contexts: [assistantContext],
});

// Start the interactive CLI
async function main() {
  await agent.start();

  console.log("\n🤖 Personal Assistant Started!");
  console.log("💡 Try telling me your name or preferences.");
  console.log("💡 Exit and restart - I'll still remember you!\n");

  // Simulate different users with different context instances
  const userId = process.argv[2] || "default-user";
  console.log(`Starting session for user: ${userId}\n`);

  // Run the assistant for this specific user
  await agent.run({
    context: assistantContext,
    args: { userId }, // This creates/loads a unique context instance
  });

  console.log("\n👋 See you next time!");
}

main().catch(console.error);
