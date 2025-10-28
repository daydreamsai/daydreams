import { createGroq } from "@ai-sdk/groq";
import { twitter } from "@daydreamsai/twitter";
import { createDreams, LogLevel, validateEnv } from "@daydreamsai/core";
import * as z from "zod";

const env = validateEnv(
  z.object({
    GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY is required"),
    TWITTER_USERNAME: z.string().min(1, "TWITTER_USERNAME is required"),
    TWITTER_PASSWORD: z.string().min(1, "TWITTER_PASSWORD is required"),
    TWITTER_EMAIL: z.string().min(1, "TWITTER_EMAIL is required"),
    OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
  })
);

const groq = createGroq({
  apiKey: env.GROQ_API_KEY!,
});

const agent = createDreams({
  logLevel: LogLevel.DEBUG,
  model: groq("deepseek-r1-distill-llama-70b"),
  extensions: [twitter],
});

// Start the agent
await agent.start();
