import { anthropic, createAnthropic } from "@ai-sdk/anthropic";
import { createDreams, context } from "@daydreamsai/core";
import type { EpisodeHooks } from "@daydreamsai/core";

/**
 * Simple example demonstrating episode hooks for a customer support chatbot
 *
 * This example shows:
 * - How to define custom episode boundaries (customer issue resolution)
 * - How to structure episode data for later analysis
 * - How to extract meaningful metadata
 */

// Define episode hooks for customer support conversations
const supportHooks: EpisodeHooks = {
  // Start episode when customer sends their first message
  shouldStartEpisode: (ref) => {
    return ref.ref === "input" && ref.type === "customer_message";
  },

  // End episode when issue is resolved or customer says goodbye
  shouldEndEpisode: (ref) => {
    if (ref.ref !== "output" || !ref.processed) return false;

    const content = ref.content?.toLowerCase() || "";
    const isResolved = ref.data?.issueResolved === true;
    const isGoodbye =
      content.includes("goodbye") || content.includes("have a great day");

    return isResolved || isGoodbye;
  },

  // Create structured episode data for analytics
  createEpisode: (logs, ctx) => {
    const customerMessages = logs.filter((l) => l.ref === "input");
    const agentMessages = logs.filter((l) => l.ref === "output");
    const actions = logs.filter((l) => l.ref === "action_call");

    return {
      type: "support_conversation",
      customer: {
        id: ctx.args?.customerId,
        messageCount: customerMessages.length,
        firstMessage: customerMessages[0]?.content,
        lastMessage: customerMessages[customerMessages.length - 1]?.content,
      },
      agent: {
        messageCount: agentMessages.length,
        actionsUsed: actions.map((a) => a.name),
        resolution:
          agentMessages[agentMessages.length - 1]?.data?.issueResolved || false,
      },
      conversation: {
        startTime: logs[0]?.timestamp,
        endTime: logs[logs.length - 1]?.timestamp,
        totalMessages: customerMessages.length + agentMessages.length,
        actionCount: actions.length,
      },
      summary: `Support conversation with ${customerMessages.length} customer messages and ${agentMessages.length} agent responses`,
    };
  },

  // Classify episodes for reporting
  classifyEpisode: (episodeData) => {
    if (episodeData.agent?.resolution) return "resolved";
    if (episodeData.conversation?.totalMessages > 10) return "complex";
    return "standard";
  },

  // Extract metadata for analytics dashboard
  extractMetadata: (episodeData, logs, ctx) => ({
    customerId: ctx.args?.customerId,
    department: ctx.args?.department || "general",
    issueType: episodeData.customer?.firstMessage?.includes("billing")
      ? "billing"
      : "general",
    responseTime:
      episodeData.conversation?.endTime - episodeData.conversation?.startTime,
    satisfaction: episodeData.agent?.resolution ? "resolved" : "unresolved",
    complexity: episodeData.conversation?.actionCount > 2 ? "high" : "low",
  }),
};

// Create the support context with episode hooks
const supportContext = context({
  type: "customer_support",
  episodeHooks: supportHooks,

  // Define how to identify unique conversations
  key: (args: { customerId: string; sessionId: string }) =>
    `${args.customerId}:${args.sessionId}`,
});

// Example usage
async function runSupportExample() {
  const agent = createDreams({
    model: anthropic("claude-sonnet-4-20250514"),
  });

  await agent.start({});

  // Start a customer support session
  const session = await agent.getContext({
    context: supportContext,
    args: {
      customerId: "cust_123",
      sessionId: "session_456",
      department: "billing",
    },
  });

  console.log("✅ Customer support context created with episode hooks");
  console.log("Episode hooks configured:");
  console.log("- Start: Customer message");
  console.log("- End: Issue resolved or goodbye");
  console.log("- Data: Structured support conversation analytics");

  // The episode hooks will automatically:
  // 1. Detect when a customer conversation starts
  // 2. Track all messages and actions during the conversation
  // 3. Create structured episode data when the issue is resolved
  // 4. Store metadata for analytics and reporting

  return session;
}

// Alternative: Simpler hooks for basic chat episodes
const simpleChatHooks: EpisodeHooks = {
  // Start on any user input
  shouldStartEpisode: (ref) => ref.ref === "input",

  // End on any agent output
  shouldEndEpisode: (ref) => ref.ref === "output" && ref.processed,

  // Create simple episode with just the messages
  createEpisode: (logs) => ({
    type: "chat_turn",
    userMessage: logs.find((l) => l.ref === "input")?.content,
    agentResponse: logs.find((l) => l.ref === "output")?.content,
    timestamp: logs[0]?.timestamp,
  }),
};

const simpleChatContext = context({
  type: "simple_chat",
  episodeHooks: simpleChatHooks,
});

// Export examples for use
export {
  supportContext,
  simpleChatContext,
  supportHooks,
  simpleChatHooks,
  runSupportExample,
};
