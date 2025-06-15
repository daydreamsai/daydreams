/**
 * An agent that connects to Twitter and replies to mentions with a fun fact.
 */
import {
    createDreams,
    action,
    validateEnv,
    LogLevel,
    Logger,
    context,
} from "@daydreamsai/core";
import { twitter } from "@daydreamsai/twitter";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { z } from "zod";

// 1. Validate environment variables
validateEnv(
    z.object({
        TWITTER_USERNAME: z.string().min(1),
        TWITTER_PASSWORD: z.string().min(1),
        TWITTER_EMAIL: z.string().min(1),
        OPENAI_API_KEY: z.string().min(1),
    })
);

// 2. Define an action to generate a fun fact
const generateFunFactAction = action({
    name: "generateFunFact",
    description:
        "Generates an interesting and concise fun fact, optionally based on a topic.",
    schema: z.object({
        topic: z
            .string()
            .optional()
            .describe("A topic to generate a fun fact about."),
    }),
    async handler({ topic }) {
        const { text } = await generateText({
            model: openai("gpt-3.5-turbo"),
            prompt: `Generate a short, interesting, and surprising fun fact. ${topic ? `The fact should be about: ${topic}.` : ""
                } The fact should be a single sentence and be appropriate for Twitter.`,
        });
        return { fact: text };
    },
});

const botContext = context({
    type: "twitter-bot",
    schema: z.object({}),
    instructions: `You are a fun fact bot on Twitter.
When you receive a mention, your goal is to reply with an interesting and concise fun fact.
First, call the 'generateFunFact' tool. If the user's tweet provides a topic, use it. Otherwise, generate a random fact.
Then, reply to the mention with the fact you generated.`,
});

// 3. Create the agent
const agent = createDreams({
    model: openai("gpt-4o-mini"),
    logger: new Logger({ level: LogLevel.DEBUG }),
    extensions: [twitter],
    actions: [generateFunFactAction],
    contexts: [botContext],
});

// 4. Start the agent
agent.start();

console.log("Twitter fun fact bot started! Mention it to get a fun fact."); 