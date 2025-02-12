import { z } from "zod";
import { createDreams } from "../../packages/core/src/core/v1/dreams";
import { action, input, output } from "../../packages/core/src/core/v1/utils";
import { DiscordClient } from "../../packages/core/src/core/v0/io/discord";
import { createGroq } from "@ai-sdk/groq";
import {
  InferMemoryFromHandler,
  LogLevel,
} from "../../packages/core/src/core/v1/types";
import {
  createContextHandler,
  createMemoryStore,
  defaultContextMemory,
  defaultContextRender,
} from "@daydreamsai/core/src/core/v1/memory";

import { Research, researchDeepActions } from "./deep-research/research";
import { formatXml } from "@daydreamsai/core/src/core/v1/xml";
import { tavily } from "@tavily/core";
import { Events, Message } from "discord.js";
import createContainer from "@daydreamsai/core/src/core/v1/container";
import { context } from "@daydreamsai/core/src/core/v1/context";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY!,
});

const model = groq("deepseek-r1-distill-llama-70b");
const memory = createMemoryStore();

const container = createContainer()
  .instance("groq", groq)
  .instance("model", model)
  .instance("memory", memory)
  .singleton(tavily, () =>
    tavily({
      apiKey: process.env.TAVILY_API_KEY!,
    })
  )
  .alias("tavily", tavily)
  .singleton(
    "discord",
    () =>
      new DiscordClient(
        {
          discord_token: process.env.DISCORD_TOKEN!,
          discord_bot_name: process.env.DISCORD_BOT_NAME!,
        },
        LogLevel.DEBUG
      )
  );

console.log(container.resolve("tavily"));
console.log(container.resolve(tavily));

const contextHandler = createContextHandler(
  () => ({
    ...defaultContextMemory(),
    researches: [] as Research[],
  }),
  (memory) => {
    return [
      ...defaultContextRender(memory),
      ...memory.researches.map((r) =>
        formatXml({
          tag: "research",
          params: { id: r.id },
          content: JSON.stringify(r),
        })
      ),
    ];
  }
);

type Handler = typeof contextHandler;
type Memory = InferMemoryFromHandler<Handler>;

const discordChannelContext = context({
  type: "discord:channel",
  key: ({ channelId }) => channelId,
  schema: z.object({ channelId: z.string() }),
  async setup(args, agent) {
    const channel = await container
      .resolve<DiscordClient>("discord")
      .client.channels.fetch(args.channelId);

    if (!channel) throw new Error("Invalid channel");

    return { channel };
  },
});

const agent = createDreams<Memory, Handler>({
  logger: LogLevel.DEBUG,
  memory,
  context: contextHandler,
  container,
  model,
  debugger: async (contextId, keys, data) => {
    const [type, id] = keys;
    await Bun.write(`./logs/${contextId}/${id}-${type}.md`, data);
  },
  inputs: {
    "discord:message": input({
      schema: z.object({
        chat: z.object({ id: z.string() }),
        user: z.object({ id: z.string(), name: z.string() }),
        text: z.string(),
      }),
      handler: (message, { memory }) => {
        memory.inputs.push({
          ref: "input",
          type: "discord:message",
          params: {
            channelId: message.chat.id,
            user: message.user.id,
            name: message.user.name,
          },
          data: message.text,
          timestamp: Date.now(),
        });
        return true;
      },
      subscribe(send, agent) {
        function listener(message: Message) {
          if (
            message.author.displayName ==
            container.resolve<DiscordClient>("discord").credentials
              .discord_bot_name
          ) {
            console.log(
              `Skipping message from ${container.resolve<DiscordClient>("discord").credentials.discord_bot_name}`
            );
            return;
          }
          send(
            discordChannelContext,
            { channelId: message.channelId },
            {
              chat: {
                id: message.channelId,
              },
              user: {
                id: message.member!.id,
                name: message.member!.displayName,
              },
              text: message.content,
            }
          );
        }

        const discord = agent.container.resolve<DiscordClient>("discord");

        discord.client.on(Events.MessageCreate, listener);
        return () => {
          discord.client.off(Events.MessageCreate, listener);
        };
      },
    }),
  },

  events: {
    "agent:thought": z.object({}),
    "agent:output": z.object({}),
  },

  outputs: {
    "discord:message": output({
      schema: z.object({
        channelId: z
          .string()
          .describe("The Discord channel ID to send the message to"),
        content: z.string().describe("The content of the message to send"),
      }),
      description: "Send a message to a Discord channel",
      handler: async (data, ctx) => {
        try {
          const channel = await container
            .resolve<DiscordClient>("discord")
            .client.channels.fetch(data.channelId);
          if (channel && channel.isSendable()) {
            await container.resolve<DiscordClient>("discord").sendMessage(data);
            return true;
          }
        } catch (error) {
          console.error(error);
        }

        return false;
      },
    }),
  },

  actions: [...researchDeepActions],
});

agent.start();

console.log("Starting Daydreams Discord Bot...");
