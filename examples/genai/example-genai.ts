import {
    createDreams,
    Logger,
    LogLevel,
    validateEnv,
} from "@daydreamsai/core";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { discord } from "@daydreamsai/discord";
import { genai } from "@daydreamsai/genai";
import { z } from "zod";

const env = validateEnv(
    z.object({
        GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
        DISCORD_TOKEN: z.string().min(1, "DISCORD_TOKEN is required"),
        DISCORD_BOT_NAME: z.string().min(1, "DISCORD_BOT_NAME is required"),
        PROCESS_ATTACHMENTS: z.boolean().optional().default(true),
    })
);

const agent = createDreams({
    model: createGoogleGenerativeAI({
        apiKey: env.GEMINI_API_KEY,
    })("gemini-2.5-flash-preview-04-17"),
    logger: new Logger({ level: LogLevel.DEBUG }),
    extensions: [discord, genai],
});

await agent.start();