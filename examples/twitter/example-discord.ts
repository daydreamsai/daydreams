import {
  createContainer,
  createDreams,
  createMemoryStore,
  LogLevel,
  validateEnv,
  Logger,
} from "@daydreamsai/core";
import { createChromaVectorStore } from "@daydreamsai/chromadb";
import { deepResearch } from "../deep-research/research";
import * as z from "zod/v4";
import { tavily } from "@tavily/core";
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { discord } from "@daydreamsai/discord";
// Validate environment before proceeding
const env = validateEnv(
  z.object({
    GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY is required"),
    DISCORD_TOKEN: z.string().min(1, "DISCORD_TOKEN is required"),
    DISCORD_BOT_NAME: z.string().min(1, "DISCORD_BOT_NAME is required"),
    TAVILY_API_KEY: z.string().min(1, "TAVILY_API_KEY is required"),
    OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
  })
);

const container = createContainer();

container.singleton("tavily", () =>
  tavily({
    apiKey: process.env.TAVILY_API_KEY!,
  })
);

const agent = createDreams({
  logger: new Logger({ level: LogLevel.DEBUG }),
  model: anthropic("claude-3-7-sonnet-latest"),
  extensions: [discord, deepResearch],
  container,
  memory: {
    store: createMemoryStore(),
    vector: createChromaVectorStore("agent", "http://localhost:8000"),
    vectorModel: openai("gpt-4-turbo"),
  },
});

console.log("Starting Daydreams Discord Bot...");
await agent.start();
console.log("Daydreams Discord Bot started");
