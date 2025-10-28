import * as z from "zod";
import {
  extension,
  input,
  output,
  validateEnv,
  context,
  service,
} from "@daydreamsai/core";
import { Events, type Message } from "discord.js";
import { DiscordClient } from "./io";

const envSchema = z.object({
  DISCORD_TOKEN: z.string(),
  DISCORD_BOT_NAME: z.string(),
  PROCESS_ATTACHMENTS: z.string().optional().default("false"),
});

const discordService = service({
  register(container) {
    const env = validateEnv(envSchema);

    container.singleton(
      "discord",
      () =>
        new DiscordClient({
          discord_token: env.DISCORD_TOKEN,
          discord_bot_name: env.DISCORD_BOT_NAME,
        })
    );
  },
});

const attachmentSchema = z.object({
  url: z.string().describe("URL of the attachment"),
  filename: z.string().describe("Filename of the attachment"),
  contentType: z.string().describe("MIME type of the attachment"),
  size: z.number().describe("Size of the attachment in bytes"),
  fetchedData: z
    .custom<Buffer>((val) => Buffer.isBuffer(val))
    .optional()
    .describe(
      "Pre-fetched attachment data as a Buffer, if processed by the extension."
    ),
});

export const discordChannelContext = context({
  type: "discord.channel",
  key: ({ channelId }) => channelId,
  schema: z.object({ channelId: z.string() }),
  async setup(args, settings, { container }) {
    const channel = await container
      .resolve<DiscordClient>("discord")
      .client.channels.fetch(args.channelId);

    if (!channel) throw new Error("Invalid channel");

    return { channel };
  },
})
  .setInputs({
    "discord:message": input({
      schema: {
        user: z.object({ id: z.string(), name: z.string() }),
        text: z.string(),
        attachments: z.array(attachmentSchema).optional(),
      },
      handler(data) {
        return {
          data: {
            text: data.text,
            attachments: data.attachments || [],
          },
          params: {
            userId: data.user.id,
            username: data.user.name,
            hasAttachments:
              data.attachments && data.attachments.length > 0
                ? "true"
                : "false",
          },
        };
      },
      subscribe(send, { container }) {
        const env = validateEnv(envSchema);
        function listener(message: Message) {
          const discordClient = container.resolve<DiscordClient>("discord");

          if (
            message.author.displayName ===
            discordClient.credentials.discord_bot_name
          ) {
            console.log(
              `Skipping message from ${discordClient.credentials.discord_bot_name}`
            );
            return;
          }

          (async () => {
            let processedAttachments: z.infer<typeof attachmentSchema>[] = [];

            if (message.attachments.size > 0) {
              if (env.PROCESS_ATTACHMENTS) {
                processedAttachments = await Promise.all(
                  message.attachments.map(async (att) => {
                    const baseAttachmentInfo = {
                      url: att.url,
                      filename: att.name || "unknown",
                      contentType:
                        att.contentType || "application/octet-stream",
                      size: att.size,
                    };
                    if (
                      att.contentType &&
                      att.contentType.startsWith("image/")
                    ) {
                      try {
                        const response = await fetch(att.url);
                        if (response.ok) {
                          const buffer = await response.arrayBuffer();
                          return {
                            ...baseAttachmentInfo,
                            fetchedData: Buffer.from(buffer),
                          };
                        } else {
                          console.error(
                            `[Discord Ext] Failed to fetch image ${att.url}: ${response.statusText}`
                          );
                        }
                      } catch (fetchError) {
                        console.error(
                          `[Discord Ext] Error fetching attachment ${att.url}:`,
                          fetchError
                        );
                      }
                    }
                    return baseAttachmentInfo;
                  })
                );
              } else {
                processedAttachments = message.attachments.map((att) => ({
                  url: att.url,
                  filename: att.name || "unknown",
                  contentType: att.contentType || "application/octet-stream",
                  size: att.size,
                }));
              }
            }

            send(
              discord.contexts!.discordChannel,
              { channelId: message.channelId },
              {
                user: {
                  id: message.author.id,
                  name: message.author.displayName,
                },
                text: message.content,
                attachments:
                  processedAttachments.length > 0
                    ? processedAttachments
                    : undefined,
              }
            );
          })();
        }

        const { client } = container.resolve<DiscordClient>("discord");

        client.on(Events.MessageCreate, listener);
        return () => {
          client.off(Events.MessageCreate, listener);
        };
      },
    }),
  })
  .setOutputs({
    "discord:message": output({
      schema: z.string(),
      examples: [`<output type="discord:message">Hi!</output>`],
      handler: async (data, ctx, { container }) => {
        const channel = ctx.options.channel;
        if (channel && (channel.isTextBased() || channel.isDMBased())) {
          await container.resolve<DiscordClient>("discord").sendMessage({
            channelId: ctx.args.channelId,
            content: data,
          });

          return {
            data,
            timestamp: Date.now(),
          };
        }
        throw new Error("Invalid channel id");
      },
    }),
    "discord:message-with-attachments": output({
      schema: z.object({
        content: z.string().describe("Text content of the message"),
        attachments: z.array(
          z.object({
            url: z.string().describe("URL of the attachment to send"),
            filename: z
              .string()
              .optional()
              .describe("Optional filename for the attachment"),
            description: z
              .string()
              .optional()
              .describe("Optional description of the attachment"),
          })
        ),
      }),
      examples: [
        `<output type="discord:message-with-attachments">
           {
             "content": "Here's the image you requested!",
             "attachments": [
               {
                 "url": "https://example.com/image.jpg",
                 "filename": "result.jpg",
                 "description": "Generated image"
               }
             ]
           }
         </output>`,
      ],
      handler: async (data, ctx, { container }) => {
        const channel = ctx.options.channel;
        if (channel && (channel.isTextBased() || channel.isDMBased())) {
          const env = validateEnv(envSchema);

          const discordClient = container.resolve<DiscordClient>("discord");

          const files = data.attachments.map((att) => ({
            attachment: att.url,
            name: att.filename || undefined,
            description: att.description || undefined,
          }));

          const result = await discordClient.sendMessageWithAttachments({
            channelId: ctx.args.channelId,
            content: data.content,
            files: files,
          });

          return {
            data,
            timestamp: Date.now(),
          };
        }
        throw new Error("Invalid channel id");
      },
      enabled: () => {
        const env = validateEnv(envSchema);
        return env.PROCESS_ATTACHMENTS === "true";
      },
    }),
  });

export const discord = extension({
  name: "discord",
  services: [discordService],
  contexts: {
    discordChannel: discordChannelContext,
  },
});
