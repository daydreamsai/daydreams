/**
 * Basic example demonstrating a simple chat interface using Dreams
 * with a command line interface and Groq's LLM.
 */
import { createAnthropic } from "@ai-sdk/anthropic";
import {
  createDreams,
  context,
  validateEnv,
  LogLevel,
} from "@daydreamsai/core";
import { cliExtension } from "@daydreamsai/cli";
import * as z from "zod";

const env = validateEnv(
  z.object({
    ANTHROPIC_API_KEY: z.string().min(1, "ANTHROPIC_API_KEY is required"),
    OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
  })
);

const anthropic = createAnthropic({
  apiKey: env.ANTHROPIC_API_KEY!,
});

const thread = context({
  type: "thread",
  schema: { threadId: z.string(), user: z.string() },
  key: ({ threadId }) => threadId,
  render({ args }) {
    const date = new Date();
    return `\
User: ${args.user}
Current ISO time is: ${date.toISOString()}, timestamp: ${date.getTime()}`;
  },
  inputs: {
    message: {
      schema: z.string(),
    },
  },
  outputs: {
    message: {
      required: true,
      schema: z.string(),
    },
    "screen:widget:weather": {
      description: "use this to display the latest weather report",
      instructions:
        "always show some weather report if you havent set one yet, try to keep it updated every 5 mins, if no location the user has set use: Lisbon",
      schema: z.string(),
      attributes: { lastUpdated: z.number() },
    },
  },
});

const agent = await createDreams({
  logLevel: LogLevel.DEBUG,
  debugger: async (contextId, keys, data) => {
    const [type, id] = keys;
    await Bun.write(`./logs/chat/${contextId}/${id}-${type}.md`, data);
  },
  model: anthropic("claude-sonnet-4-20250514"),
  contexts: [thread],
  extensions: [cliExtension],
}).start();
