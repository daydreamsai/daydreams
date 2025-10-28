import {
  createDreams,
  context,
  action,
  LogLevel,
  input,
  output,
  type EpisodeHooks,
} from "@daydreamsai/core";

import * as z from "zod";
import * as readline from "readline";
import * as dotenv from "dotenv";

import { dreamsrouter } from "@daydreamsai/ai-sdk-provider";

import { walletContext } from "../server-wallet/wallet-context";

dotenv.config();

if (!process.env.CDP_API_KEY_ID || !process.env.CDP_API_KEY_SECRET) {
  console.warn(
    "⚠️  Warning: CDP_API_KEY_ID and CDP_API_KEY_SECRET not found in environment variables"
  );
  console.warn(
    "⚠️  Wallet functionality will not work without these credentials"
  );
  console.warn("⚠️  Get your API keys from: https://portal.cdp.coinbase.com/");
}

const personalAssistantHooks: EpisodeHooks = {
  shouldStartEpisode: (ref) => {
    return ref.ref === "input" && ref.type === "text";
  },

  shouldEndEpisode: (ref) => {
    if (ref.ref !== "output") {
      return false;
    }

    const content = (ref.content || ref.data || "").toString().toLowerCase();

    const isGoodbye =
      content.includes("goodbye") ||
      content.includes("see you") ||
      content.includes("bye");
    const isTaskComplete =
      content.includes("anything else") ||
      content.includes("help you with") ||
      content.includes("thank you");

    return isGoodbye || isTaskComplete;
  },

  createEpisode: (logs, ctx) => {
    const userInputs = logs.filter((l) => l.ref === "input");
    const assistantOutputs = logs.filter((l) => l.ref === "output");
    const actions = logs.filter((l) => l.ref === "action_call");

    const walletActions = actions.filter((a) =>
      [
        "create-wallet",
        "check-balance",
        "send-transaction",
        "request-faucet",
      ].includes(a.name)
    );

    return {
      type: "personal_assistant_session",
      user: {
        id: ctx.args?.userId,
        messageCount: userInputs.length,
        firstMessage: userInputs[0]?.content,
        lastMessage: userInputs[userInputs.length - 1]?.content,
      },
      assistant: {
        messageCount: assistantOutputs.length,
        actionsUsed: actions.map((a) => a.name),
        walletActionsCount: walletActions.length,
      },
      session: {
        startTime: logs[0]?.timestamp,
        endTime: logs[logs.length - 1]?.timestamp,
        totalExchanges: Math.min(userInputs.length, assistantOutputs.length),
        duration: logs[logs.length - 1]?.timestamp - logs[0]?.timestamp,
      },
      summary: `Session: ${userInputs.length} messages, ${
        actions.length
      } actions (${walletActions.length} wallet), ${Math.round(
        (logs[logs.length - 1]?.timestamp - logs[0]?.timestamp) / 1000
      )}s duration`,
    };
  },

  classifyEpisode: (episodeData) => {
    if (episodeData.assistant?.walletActionsCount > 0) return "financial";
    if (episodeData.session?.totalExchanges > 5) return "extended";
    if (episodeData.assistant?.personalizedResponses > 0) return "personalized";
    return "standard";
  },

  extractMetadata: (episodeData, _logs, ctx) => ({
    userId: ctx.args?.userId,
    sessionType:
      episodeData.assistant?.walletActionsCount > 0 ? "wallet" : "regular",
    interactionCount: episodeData.session?.totalExchanges || 0,
    walletActions: episodeData.assistant?.walletActionsCount || 0,
    duration: episodeData.session?.duration || 0,
    engagement: episodeData.session?.totalExchanges > 3 ? "high" : "low",
  }),
};

interface AnalyticsMemory {
  events: Array<{
    type: string;
    timestamp: number;
    data?: any;
  }>;
  totalInteractions: number;
  lastActive: number;
}

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

interface AssistantMemory {
  conversationCount: number;
  lastTopic?: string;
  mood?: string;
  hasWallet: boolean;
}

const assistantContext = context({
  type: "personal-assistant",
  episodeHooks: personalAssistantHooks,
  schema: z.object({
    userId: z.string().describe("Unique identifier for the user"),
    network: z
      .enum(["base-sepolia", "base", "ethereum", "polygon"])
      .optional()
      .default("base-sepolia")
      .describe("Network for wallet operations"),
  }),
  create: (): AssistantMemory => ({
    conversationCount: 0,
    lastTopic: "No topic",
    mood: "No mood",
    hasWallet: false,
  }),
  render: (state) => {
    const { conversationCount, lastTopic, mood, hasWallet } = state.memory;
    return `
Personal Assistant for User: ${state.args.userId}
Conversations: ${conversationCount}
${lastTopic ? `Last topic: ${lastTopic}` : ""}
${mood ? `Current mood: ${mood}` : ""}
Wallet Status: ${hasWallet ? "Created ✓" : "Not created"}
Network: ${state.args.network || "base-sepolia"}
    `.trim();
  },
  instructions: `You are a personal assistant with memory and wallet capabilities. You should:
- Track events when users share important information using track-event
- Update user profiles when they share personal details
- Help users create and manage their Coinbase wallets
- Be careful with financial transactions and always confirm details
- Reference previous conversations and analytics when relevant
- Be helpful and personalized based on what you know

For wallet operations:
- First create a wallet if the user doesn't have one
- On testnet (base-sepolia), freely use the faucet to get test funds
- Always show transaction hashes and explorer links when sending transactions
- Check balances before attempting to send funds
- Explain what you're doing with clear, simple language

Always end the conversation with a goodbye when the user is done.`,
  onRun: async (ctx) => {
    ctx.memory.conversationCount++;
  },
})
  .use((state) => [
    { context: analyticsContext, args: { userId: state.args.userId } },
    { context: profileContext, args: { userId: state.args.userId } },
    {
      context: walletContext,
      args: {
        userId: state.args.userId,
        network: state.args.network || "base-sepolia",
      },
    },
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

const textInput = input({
  description: "Text input from the user",
  schema: z.string(),
});

const textOutput = output({
  description: "Text response to the user",
  schema: z.string(),
});

const agent = createDreams({
  logLevel: LogLevel.INFO,
  model: dreamsrouter("openai/gpt-4o"),
  contexts: [assistantContext],
  inputs: {
    text: textInput,
  },
  outputs: {
    text: textOutput,
  },
});

async function main() {
  await agent.start();

  console.log("\n🤖 Personal Assistant with Wallet Integration Started!");

  const userId = process.argv[2] || "default-user";
  const network = (process.argv[3] || "base-sepolia") as any;
  console.log(`Starting session for user: ${userId} on network: ${network}\n`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "> ",
  });

  async function handleInput(input: string) {
    if (input.toLowerCase() === "exit") {
      console.log("\n👋 See you next time!");
      rl.close();
      process.exit(0);
    }

    if (input.toLowerCase() === "analytics") {
      const analytics = agent.tracker.getAnalytics();
      console.log(`\n📊 Total cost: $${analytics.totalCost.toFixed(4)}`);
      console.log(`🔤 Total tokens: ${analytics.totalTokens.toLocaleString()}`);
      console.log(
        `✅ Success rate: ${(analytics.successRate * 100).toFixed(1)}%`
      );
      console.log(
        `⏱️  Avg response time: ${analytics.averageResponseTime.toFixed(0)}ms`
      );

      const userActivity = agent.tracker.getUserActivity(userId);
      console.log(`\n👤 User ${userId} Activity:`);
      console.log(`📝 Total requests: ${userActivity.totalRequests}`);
      console.log(`💰 Total cost: $${userActivity.totalCost.toFixed(4)}`);

      rl.prompt();
      return;
    }

    if (input.toLowerCase() === "profile") {
      input = "Show me my profile information";
    }

    if (input.toLowerCase() === "wallet") {
      input = "Show me my wallet status and balance";
    }

    try {
      const result = await agent.send({
        context: assistantContext,
        args: { userId, network },
        input: { type: "text", data: input },
      });

      const output = result.find((r) => r.ref === "output");
      if (output && "data" in output) {
        console.log("\n🤖:", output.data);
      }
    } catch (error) {
      console.error("Error:", error);
    }

    rl.prompt();
  }

  rl.on("line", handleInput);

  rl.prompt();
}

main().catch(console.error);
