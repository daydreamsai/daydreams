/**
 * An agent that connects to Discord and summarizes the last few messages in a channel.
 */
import {
    createDreams,
    action,
    validateEnv,
    LogLevel,
    Logger,
    context,
    type ActionCallContext,
} from "@daydreamsai/core";
import { discord } from "@daydreamsai/discord";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { generateText } from "ai";

// 1. Validate environment variables
validateEnv(
    z.object({
        DISCORD_TOKEN: z.string().min(1, "DISCORD_TOKEN is required"),
        DISCORD_BOT_NAME: z.string().min(1, "DISCORD_BOT_NAME is required"),
        ANTHROPIC_API_KEY: z.string().min(1, "ANTHROPIC_API_KEY is required"),
    })
);

// Define the shape of the message history we expect in memory
interface ChatMemory {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
}

// 2. Define an action to summarize recent messages from memory
const summarizeRecentMessagesAction = action({
    name: "summarizeRecentMessages",
    description:
        "Takes recent messages from the conversation history and provides a summary.",
    schema: z.object({}), // No arguments needed, it uses memory
    async handler(_, ctx) {
        // The discord extension automatically stores message history in the context's memory.
        const memory = ctx.memory as ChatMemory;
        const messageHistory = memory.messages || [];

        if (messageHistory.length === 0) {
            return { summary: "There are no recent messages to summarize." };
        }

        const textToSummarize = messageHistory
            .map((msg: { role: string; content: string }) => `${msg.role}: ${msg.content}`)
            .join("\n");

        const { text: summary } = await generateText({
            model: anthropic("claude-3-haiku-20240307"),
            prompt: `Please provide a concise summary of the following chat conversation. Group discussion points by topic and highlight key decisions or questions.

Here is the conversation:
---
${textToSummarize}
---
`,
        });

        return { summary };
    },
});

// 3. Define the bot's context and instructions
const summarizerContext = context({
    type: "discord-summarizer",
    schema: z.object({}),
    instructions: `
SYSTEM DIRECTIVE: AGENT BEHAVIOR PROTOCOL

1.  **PRIMARY TRIGGER**: The agent's ONLY valid trigger is a message containing the exact string '!summarize'.

2.  **ACTION PROTOCOL**:
    -   IF input text is EXACTLY '!summarize', THEN you MUST execute the 'summarizeRecentMessages' action.
    -   IF input text is ANYTHING ELSE, you MUST NOT execute any action.

3.  **RESPONSE PROTOCOL**:
    -   You are FORBIDDEN from producing any output unless it is the direct result of the 'summarizeRecentMessages' action.
    -   For any input that is not exactly '!summarize', your response MUST be empty. No greetings, no explanations, no apologies.
    -   DEFAULT BEHAVIOR IS SILENCE.
  `,
});

// 4. Create the agent
const agent = createDreams({
    model: anthropic("claude-3-haiku-20240307"),
    logger: new Logger({ level: LogLevel.DEBUG }),
    extensions: [discord],
    actions: [summarizeRecentMessagesAction],
    contexts: [summarizerContext],
});

// 5. Start the agent
agent.start();

console.log("Discord summarization bot started!");
console.log("Use !summarize in a channel to get a summary of recent messages.");