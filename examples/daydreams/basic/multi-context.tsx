/**
 * 🌟 Multi-Context Example with Context Composition using .use()
 *
 * This example demonstrates Daydreams' powerful context composition pattern where
 * contexts can include other contexts to create rich, modular experiences.
 *
 * Updated for the new output system with JSON structured data and 'name' attributes.
 *
 * What's included:
 * 1. Analytics Context - Tracks user interactions and events
 * 2. Profile Context - Manages user profile data and settings
 * 3. Assistant Context - Main context that composes the above contexts
 *
 * Key Features Demonstrated:
 * - Context composition with .use() method
 * - Shared actions across composed contexts
 * - Separate memory spaces for each context
 * - Dynamic behavior based on composed context state
 * - Built-in SimpleTracker for analytics
 * - New JSON-structured outputs with schema validation
 *
 * The assistant context has access to ALL actions from composed contexts:
 * - track-event (from analytics)
 * - get-interaction-stats (from analytics)
 * - update-profile (from profile)
 * - upgrade-tier (from profile)
 * - Plus its own actions: update-topic, set-mood
 *
 * Try these commands:
 * - "My name is Alice" - Updates profile via composed context
 * - "I prefer dark mode" - Tracks preference and event
 * - "upgrade" - Upgrades to premium tier
 * - "profile" - Shows profile information
 * - "analytics" - Shows usage statistics
 */

import {
  createDreams,
  context,
  action,
  LogLevel,
  input,
  type EpisodeHooks,
} from "@daydreamsai/core";
import { createChromaMemory } from "@daydreamsai/chroma";

import * as z from "zod";
import * as readline from "readline";

import { dreamsrouter } from "@daydreamsai/ai-sdk-provider";

const personalAssistantHooks: EpisodeHooks = {
  // Start episode when user begins a new conversation
  shouldStartEpisode: (ref) => {
    return ref.ref === "input" && ref.type === "text";
  },

  // End episode when conversation naturally concludes or user says goodbye
  shouldEndEpisode: (ref) => {
    if (ref.ref !== "output") {
      console.log("Early return: not output or not processed");
      return false;
    }

    // Handle new JSON structure - check both content field and data.content
    let content = "";
    if (typeof ref.data === "object" && ref.data?.content) {
      content = ref.data.content.toString().toLowerCase();
    } else if (ref.content) {
      content = ref.content.toString().toLowerCase();
    } else if (ref.data) {
      content = ref.data.toString().toLowerCase();
    }

    const isGoodbye =
      content.includes("Goodbye") ||
      content.includes("goodbye") ||
      content.includes("Goodbye!") ||
      content.includes("see you") ||
      content.includes("bye");
    const isTaskComplete =
      content.includes("anything else") ||
      content.includes("help you with") ||
      content.includes("thank you");

    return isGoodbye || isTaskComplete;
  },

  // Create structured episode data for personal assistant interactions
  createEpisode: (logs, ctx) => {
    const userInputs = logs.filter((l) => l.ref === "input");
    const assistantOutputs = logs.filter((l) => l.ref === "output");
    const actions = logs.filter((l) => l.ref === "action_call");

    const nameActions = actions.filter((a) => a.name === "remember-name");
    const preferenceActions = actions.filter(
      (a) => a.name === "save-preference"
    );
    const topicActions = actions.filter((a) => a.name === "update-topic");

    return {
      type: "personal_assistant_session",
      user: {
        id: ctx.args?.userId,
        messageCount: userInputs.length,
        firstMessage: userInputs[0]?.content,
        lastMessage: userInputs[userInputs.length - 1]?.content,
        learnedName: nameActions.length > 0,
        savedPreferences: preferenceActions.length,
      },
      assistant: {
        messageCount: assistantOutputs.length,
        actionsUsed: actions.map((a) => a.name),
        personalizedResponses: nameActions.length + preferenceActions.length,
      },
      session: {
        startTime: logs[0]?.timestamp,
        endTime: logs[logs.length - 1]?.timestamp,
        totalExchanges: Math.min(userInputs.length, assistantOutputs.length),
        memoryUpdates:
          nameActions.length + preferenceActions.length + topicActions.length,
        duration: logs[logs.length - 1]?.timestamp - logs[0]?.timestamp,
      },
      summary: `Personal assistant session: ${
        userInputs.length
      } user messages, ${actions.length} memory actions, ${Math.round(
        (logs[logs.length - 1]?.timestamp - logs[0]?.timestamp) / 1000
      )}s duration`,
      logs,
    };
  },

  // Classify episodes based on personal assistant interactions
  classifyEpisode: (episodeData) => {
    if (episodeData.user?.learnedName || episodeData.user?.savedPreferences > 0)
      return "learning";
    if (episodeData.session?.totalExchanges > 5) return "extended";
    if (episodeData.assistant?.personalizedResponses > 0) return "personalized";
    return "standard";
  },

  // Extract metadata for personal assistant analytics
  extractMetadata: (episodeData, logs, ctx) => ({
    userId: ctx.args?.userId,
    sessionType: episodeData.user?.learnedName ? "onboarding" : "regular",
    interactionCount: episodeData.session?.totalExchanges || 0,
    memoryActions: episodeData.session?.memoryUpdates || 0,
    duration: episodeData.session?.duration || 0,
    engagement: episodeData.session?.totalExchanges > 3 ? "high" : "low",
    personalization:
      episodeData.assistant?.personalizedResponses > 0 ? "yes" : "no",
  }),
};

const memory = createChromaMemory({
  path: "http://localhost:8000",
  collectionName: "daydreams_vectors",
});

// Define what our analytics context tracks
interface AnalyticsMemory {
  events: Array<{
    type: string;
    timestamp: number;
    data?: any;
  }>;
  totalInteractions: number;
  lastActive: number;
}

// Analytics context for tracking user behavior
const analyticsContext = context({
  type: "analytics",
  schema: z.object({
    userId: z.string().describe("User to track analytics for"),
  }),
  create: (): AnalyticsMemory => ({
    events: [],
    totalInteractions: 0,
    lastActive: Date.now(),
  }),
  render: (state) =>
    `
Analytics for user: ${state.args.userId}
Total interactions: ${state.memory.totalInteractions}
Last active: ${new Date(state.memory.lastActive).toLocaleString()}
Recent events: ${state.memory.events
      .slice(-3)
      .map((e) => e.type)
      .join(", ")}
  `.trim(),
}).setActions([
  action({
    name: "track-event",
    description: "Track a user interaction event",
    schema: z.object({
      eventType: z.string().describe("Type of event"),
      data: z.any().optional().describe("Additional event data"),
    }),
    handler: async ({ eventType, data }, ctx) => {
      ctx.memory.events.push({
        type: eventType,
        timestamp: Date.now(),
        data,
      });
      ctx.memory.totalInteractions++;
      ctx.memory.lastActive = Date.now();
      return { tracked: true, eventId: ctx.memory.events.length };
    },
  }),
  action({
    name: "get-interaction-stats",
    description: "Get user interaction statistics",
    schema: z.object({}),
    handler: async (_, ctx) => {
      const last24h = Date.now() - 24 * 60 * 60 * 1000;
      const recentEvents = ctx.memory.events.filter(
        (e) => e.timestamp > last24h
      );
      return {
        totalInteractions: ctx.memory.totalInteractions,
        recentInteractions: recentEvents.length,
        eventTypes: [...new Set(ctx.memory.events.map((e) => e.type))],
      };
    },
  }),
]);

// Define what our profile context stores
interface ProfileMemory {
  name?: string;
  tier: "free" | "premium";
  joinedAt: number;
  settings: {
    language?: string;
    timezone?: string;
    notifications?: boolean;
  };
}

// Profile context for user profile management
const profileContext = context({
  type: "profile",
  schema: z.object({
    userId: z.string().describe("User profile to manage"),
  }),
  create: (): ProfileMemory => ({
    tier: "free",
    joinedAt: Date.now(),
    settings: {},
  }),
  render: (state) =>
    `
User Profile: ${state.args.userId}
Name: ${state.memory.name || "Not set"}
Tier: ${state.memory.tier}
Member since: ${new Date(state.memory.joinedAt).toLocaleDateString()}
Settings: ${JSON.stringify(state.memory.settings)}
  `.trim(),
}).setActions([
  action({
    name: "update-profile",
    description: "Update user profile information",
    schema: z.object({
      name: z.string().optional(),
      language: z.string().optional(),
      timezone: z.string().optional(),
    }),
    handler: async ({ name, language, timezone }, ctx) => {
      if (name) ctx.memory.name = name;
      if (language) ctx.memory.settings.language = language;
      if (timezone) ctx.memory.settings.timezone = timezone;
      return { updated: true, profile: ctx.memory };
    },
  }),
  action({
    name: "upgrade-tier",
    description: "Upgrade user to premium tier",
    schema: z.object({}),
    handler: async (_, ctx) => {
      ctx.memory.tier = "premium";
      return { upgraded: true, message: "Welcome to premium!" };
    },
  }),
]);

// Define what our assistant remembers about each user
interface AssistantMemory {
  conversationCount: number;
  lastTopic?: string;
  mood?: string;
}

// Create a composed context - this is where the magic happens!
const assistantContext = context({
  type: "personal-assistant",
  episodeHooks: personalAssistantHooks,
  schema: z.object({
    userId: z.string().describe("Unique identifier for the user"),
  }),
  create: (): AssistantMemory => ({
    conversationCount: 0,
    lastTopic: "No topic",
    mood: "No mood",
  }),
  render: (state) => {
    const { conversationCount, lastTopic, mood } = state.memory;
    return `
Personal Assistant for User: ${state.args.userId}
Conversations: ${conversationCount}
${lastTopic ? `Last topic: ${lastTopic}` : ""}
${mood ? `Current mood: ${mood}` : ""}
    `.trim();
  },
  instructions: (state) => {
    // Dynamic instructions based on user tier (accessed via composed profile context)
    const baseInstructions = `You are a personal assistant with memory. You should:
- Track events when users share important information using track-event
- Update user profiles when they share personal details
- Reference previous conversations and analytics when relevant
- Be helpful and personalized based on what you know

Always end the conversation with a goodbye.`;

    // We can access composed context data in instructions
    return baseInstructions;
  },
  onRun: async (ctx) => {
    ctx.memory.conversationCount++;
  },
})
  // 🌟 Compose other contexts - the power pattern!
  .use((state) => [
    // Always include analytics for tracking
    { context: analyticsContext, args: { userId: state.args.userId } },

    // Always include profile management
    { context: profileContext, args: { userId: state.args.userId } },
  ])
  .setActions([
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
    action({
      name: "set-mood",
      description: "Track the user's current mood",
      schema: z.object({
        mood: z.string().describe("User's current mood"),
      }),
      handler: async ({ mood }, ctx) => {
        ctx.memory.mood = mood;
        return { updated: true, message: `Noted your mood as ${mood}` };
      },
    }),
  ]);

// IMPORTANT: setActions() must be called BEFORE creating the agent
// Otherwise, the agent will register the context without actions

// Define text input handler
const textInput = input({
  description: "Text input from the user",
  schema: z.string(),
});

// Create the agent
const agent = createDreams({
  logLevel: LogLevel.TRACE,
  model: dreamsrouter("google-vertex/gemini-2.5-flash"),
  memory,
  contexts: [assistantContext],
  inputs: {
    text: textInput,
  },
  outputs: {
    text: {
      description: "Text response to the user",
      schema: z.object({
        content: z.string().describe("The text content to send to the user"),
      }),
      handler: async (data, ctx, agent) => {
        // Process the structured output data
        return { content: data.content, processed: true };
      },
    },
  },
});

// 📊 SimpleTracker is now built into every agent by default!
// No setup required - analytics are automatically available via agent.tracker

// Start the interactive CLI
async function main() {
  await agent.start();

  console.log("\n🤖 Personal Assistant with Composed Contexts Started!");
  console.log("💡 This example demonstrates context composition using .use()");
  console.log("💡 The assistant context composes analytics + profile contexts");
  console.log("💡 Try: 'My name is Alice' or 'I prefer dark mode'");
  console.log("💡 Type 'analytics' to see usage statistics");
  console.log("💡 Type 'profile' to see your profile data");
  console.log("💡 Type 'upgrade' to simulate premium upgrade");
  console.log("💡 Type 'exit' to quit\n");

  // Simulate different users with different context instances
  const userId = process.argv[2] || "default-user";
  console.log(`Starting session for user: ${userId}\n`);

  // Create readline interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "> ",
  });

  // Function to handle user input
  async function handleInput(input: string) {
    if (input.toLowerCase() === "exit") {
      console.log("\n👋 See you next time!");
      rl.close();
      process.exit(0);
    }

    // 📊 Show analytics with SimpleTracker
    if (input.toLowerCase() === "analytics") {
      console.log("\n📊 === USAGE ANALYTICS ===");

      // Get overall analytics (automatically extracted from events!)
      const analytics = agent.tracker.getAnalytics();
      console.log(`💰 Total cost: $${analytics.totalCost.toFixed(4)}`);
      console.log(`🔤 Total tokens: ${analytics.totalTokens.toLocaleString()}`);
      console.log(
        `✅ Success rate: ${(analytics.successRate * 100).toFixed(1)}%`
      );
      console.log(
        `⏱️  Average response time: ${analytics.averageResponseTime.toFixed(
          0
        )}ms`
      );

      // Show user-specific analytics
      const userActivity = agent.tracker.getUserActivity(userId);
      console.log(`\n👤 User ${userId} Activity:`);
      console.log(`📝 Total requests: ${userActivity.totalRequests}`);
      console.log(`💰 Total cost: $${userActivity.totalCost.toFixed(4)}`);
      console.log(
        `⏱️  Average response time: ${userActivity.averageResponseTime.toFixed(
          0
        )}ms`
      );

      console.log(`\n🌟 Context Composition Benefits:`);
      console.log(
        `• Assistant context automatically includes analytics + profile`
      );
      console.log(`• All actions from composed contexts are available`);
      console.log(`• Each context maintains separate memory`);
      console.log(`• Contexts work together seamlessly`);

      rl.prompt();
      return;
    }

    // 👤 Show profile data - demonstrates composed context access
    if (input.toLowerCase() === "profile") {
      console.log("\n👤 === USER PROFILE (from composed context) ===");
      console.log(
        "This data comes from the profile context composed into the assistant!"
      );
      console.log(
        "The assistant can access all composed context actions and memory.\n"
      );

      // Note: In a real app, you'd query the context memory directly
      // For demo purposes, we'll ask the assistant to show profile data
      input = "Show me my profile information using get-interaction-stats";
    }

    // ⬆️ Simulate premium upgrade - demonstrates composed context interaction
    if (input.toLowerCase() === "upgrade") {
      console.log("\n⬆️ === UPGRADING TO PREMIUM ===");
      console.log(
        "This will use the 'upgrade-tier' action from the composed profile context!\n"
      );
      input = "Please upgrade me to premium tier";
    }

    try {
      // Send the message with the proper context
      const result = await agent.send({
        context: assistantContext,
        args: { userId },
        input: { type: "text", data: input },
      });

      // Extract and display the assistant's response
      const output = result.find((r) => r.ref === "output");
      if (output && "data" in output) {
        // Handle the new JSON structure - extract content from the structured data
        const content =
          typeof output.data === "object" && output.data?.content
            ? output.data.content
            : output.data;
        console.log("\n🤖:", content);
      }
    } catch (error) {
      console.error("Error:", error);
    }

    // Show prompt again
    rl.prompt();
  }

  // Handle line input
  rl.on("line", handleInput);

  // Show initial prompt
  rl.prompt();
}

main().catch(console.error);

/**
 * 🎯 Key Takeaways from this Example:
 *
 * 1. Context Composition with .use():
 *    - The assistant context includes analytics and profile contexts
 *    - All actions from composed contexts become available
 *    - Each context maintains its own memory space
 *
 * 2. Benefits of Composition:
 *    - Modular design - contexts can be reused across different agents
 *    - Clean separation of concerns (analytics vs profile vs assistant)
 *    - Easy to add/remove features by composing different contexts
 *    - Conditional composition based on user tier or preferences
 *
 * 3. How it Works:
 *    - When the assistant context is active, it automatically activates composed contexts
 *    - The LLM can see and use actions from all composed contexts
 *    - Each context's render() output is included in the prompt
 *    - Memory is kept separate but accessible through actions
 *
 * 4. Real-World Use Cases:
 *    - E-commerce: Compose catalog + cart + payment + loyalty contexts
 *    - Gaming: Compose character + inventory + achievements + social contexts
 *    - Enterprise: Compose auth + permissions + audit + workflow contexts
 *    - Support: Compose ticket + knowledge + escalation + satisfaction contexts
 *
 * This pattern enables building sophisticated agents with clean, maintainable code!
 */
