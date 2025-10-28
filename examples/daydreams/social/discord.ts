import {
  createContainer,
  createDreams,
  LogLevel,
  Logger,
} from "@daydreamsai/core";

import { anthropic } from "@ai-sdk/anthropic";

import { discord } from "@daydreamsai/discord";

const container = createContainer();

const agent = createDreams({
  logger: new Logger({ level: LogLevel.DEBUG }),
  model: anthropic("claude-3-7-sonnet-latest"),
  extensions: [discord],
  container,
});

console.log("Starting Daydreams Discord Bot...");
await agent.start();
console.log("Daydreams Discord Bot started");
