import { z } from "zod";
import {
  extension,
  input,
  output,
  validateEnv /* action, type LanguageModelV1 */,
} from "@daydreamsai/core";
import { Events, type Message } from "discord.js";
import { DiscordClient } from "./io";
import { context } from "@daydreamsai/core";
import { service } from "@daydreamsai/core";

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
                    let fetchedData: Buffer | undefined = undefined;
                    if (
                      att.contentType &&
                      att.contentType.startsWith("image/")
                    ) {
                      try {
                        const response = await fetch(att.url);
                        if (response.ok) {
                          const buffer = await response.arrayBuffer();
                          fetchedData = Buffer.from(buffer);
                          return {
                            ...baseAttachmentInfo,
                            fetchedData: fetchedData,
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

            const attachmentsForAgent = processedAttachments.map(
              ({ fetchedData, ...rest }) => rest
            );

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
                  attachmentsForAgent.length > 0
                    ? attachmentsForAgent
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
      schema: z.string().describe(
        "The text content for the Discord message. This string will be sent directly to the user. " +
        "If you need to include information from previous action calls (e.g., a URL from an image generation task like 'calls[0].images[0].url'), " +
        "you MUST directly embed the actual resolved value (e.g., 'https://example.com/image.png') into this string. " +
        "DO NOT use template placeholders like '{{calls[0].images[0].url}}' or any other '{{...}}' syntax in this output string. " +
        "Always replace such placeholders with their concrete values before outputting."
      ),
      examples: [
        `<output type="discord:message">Okay, I've completed that task.</output>`,
        `<output type="discord:message">Here is the image you requested: https://files.catbox.moe/someimage.png</output>`,
        `<output type="discord:message">The result of the calculation is 42.</output>`
      ],
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
  });

export const discord = extension({
  name: "discord",
  services: [discordService],
  contexts: {
    discordChannel: discordChannelContext,
  },
});
