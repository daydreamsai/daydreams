import { createContainer, createDreams, LogLevel, Logger } from "@daydreamsai/core";
import { cliExtension } from "@daydreamsai/cli";
import { deepResearch } from "./research";
import { tavily } from "@tavily/core";
import { anthropic } from "@ai-sdk/anthropic";
const container = createContainer();

container.singleton("tavily", () =>
  tavily({
    apiKey: process.env.TAVILY_API_KEY!,
  })
);

createDreams({
  logger: new Logger({ level: LogLevel.DEBUG }),
  model: anthropic("claude-3-7-sonnet-latest"),
  debugger: async (contextId, keys, data) => {
    const [type, id] = keys;
    await Bun.write(`./logs/${contextId}/${id}-${type}.md`, data);
  },
  extensions: [cliExtension, deepResearch],
  container,
}).start();
