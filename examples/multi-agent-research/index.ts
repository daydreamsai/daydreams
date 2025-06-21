import {
  createContainer,
  createDreams,
  Logger,
  LogLevel,
} from "@daydreamsai/core";
import { cliExtension } from "@daydreamsai/cli";
import { multiAgentResearch } from "./multi-agent-research.js";
import { tavily } from "@tavily/core";
import { openrouter } from "@openrouter/ai-sdk-provider";

const container = createContainer();

// Register external services
container.singleton("tavily", () =>
  tavily({
    apiKey: process.env.TAVILY_API_KEY!,
  })
);

// Create the multi-agent research system
const agent = createDreams({
  logLevel: LogLevel.DEBUG,
  logger: new Logger({
    style: "enhanced", // Better for seeing cost information
    enableColors: true,
    enableStructuredData: true, // Ensure structured data is shown
  }),
  model: openrouter("google/gemini-2.5-pro"),
  modelSettings: {
    temperature: 0.4,
    providerOptions: {
      openrouter: {
        reasoning: {
          max_tokens: 16384,
        },
      },
    },
  },
  requestTrackingConfig: {
    enabled: true,
    trackTokenUsage: true,
    trackCosts: true,
    costEstimation: {
      "openrouter.chat/google/gemini-2.5-pro": {
        inputTokenCost: 1.25,
        outputTokenCost: 10.0,
      },
    },
  },
  debugger: async (contextId, keys, data) => {
    const [type, id] = keys;
    // Create logs directory structure
    await Bun.write(`./logs/${contextId}/${id}-${type}.md`, data);
  },
  extensions: [cliExtension, multiAgentResearch],
  container,
});

// Start the system
agent.start().then(() => {
  console.log("🔬 Multi-Agent Research System started!");
  console.log("Try asking: 'Research the current state of AI agents in 2025'");
  console.log(
    "Or: 'what are all the companies in the united states working on AI agents in 2025? make a list of at least 100.'"
  );
});
