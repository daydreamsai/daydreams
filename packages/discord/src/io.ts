import {
  ChannelType,
  Client,
  Events,
  GatewayIntentBits,
  Partials,
  TextChannel,
  DMChannel,
  Message,
  type Channel,
} from "discord.js";
import { Logger, LogLevel } from "@daydreamsai/core";
import { z } from "zod";

export interface DiscordCredentials {
  discord_token: string;
  discord_bot_name: string;
}

export interface AttachmentData {
  attachment: string; // URL or file path
  name?: string;      // Optional filename 
  description?: string; // Optional description
}

export interface MessageData {
  content: string;
  channelId: string;
  conversationId?: string;
  sendBy?: string;
  files?: AttachmentData[]; // New field for attachments
}

export const messageSchema = z.object({
  content: z.string().describe("The content of the message"),
  channelId: z.string().describe("The channel ID where the message is sent"),
  sendBy: z.string().optional().describe("The user ID of the sender"),
  conversationId: z
    .string()
    .optional()
    .describe("The conversation ID (if applicable)"),
  files: z.array(
    z.object({
      attachment: z.string().describe("URL or file path of the attachment"),
      name: z.string().optional().describe("Filename of the attachment"),
      description: z.string().optional().describe("Description of the attachment")
    })
  ).optional().describe("Files to attach to the message"),
});

export class DiscordClient {
  public client: Client;
  private logger: Logger;
  private messageListener?: (...args: any[]) => void;
  public credentials: DiscordCredentials;

  constructor(
    credentials: DiscordCredentials,
    logLevel: LogLevel = LogLevel.INFO
  ) {
    this.credentials = credentials;
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.DirectMessageReactions,
      ],
      partials: [Partials.Channel], // For DM support
    });

    this.logger = new Logger({
      level: logLevel,
    });

    // Handle "ready" event
    this.client.on(Events.ClientReady, () => {
      this.logger.info("DiscordClient", "Initialized successfully");
    });

    // Log in to Discord
    this.client.login(this.credentials.discord_token).catch((error) => {
      this.logger.error("DiscordClient", "Failed to login", { error });
      console.error("Login error:", error);
    });
  }

  /**
   *  Optionally start listening to Discord messages.
   *  The onData callback typically feeds data into Orchestrator or similar.
   */
  public startMessageStream(onData: (data: any | any[]) => void) {
    this.logger.info("DiscordClient", "Starting message stream...");

    this.messageListener = (message: Message) => {
      if (message.author.displayName == this.credentials.discord_bot_name) {
        console.log(
          `Skipping message from ${this.credentials.discord_bot_name}`
        );
        return;
      }

      // Extract attachments if any
      const attachments = message.attachments.map(att => ({
        url: att.url,
        filename: att.name || "unknown",
        contentType: att.contentType || "application/octet-stream",
        size: att.size
      }));

      onData({
        userId: message.author?.displayName,
        platformId: "discord",
        threadId: message.channel.id,
        isDM: message.channel.type === ChannelType.DM,
        contentId: message.id,
        data: {
          content: message.content,
          attachments: attachments.length > 0 ? attachments : undefined
        },
      });
    };

    this.client.on(Events.MessageCreate, this.messageListener);
  }

  /**
   *  Optionally remove the message listener if you want to stop the stream.
   */
  public stopMessageStream() {
    if (this.messageListener) {
      this.client.removeListener(Events.MessageCreate, this.messageListener);
      this.logger.info("DiscordClient", "Message stream stopped");
    }
  }

  /**
   *  Gracefully destroy the Discord connection
   */
  public destroy() {
    this.stopMessageStream();
    this.client.destroy();
    this.logger.info("DiscordClient", "Client destroyed");
  }

  private getIsValidTextChannel(
    channel?: Channel
  ): channel is TextChannel | DMChannel {
    return (
      channel?.type === ChannelType.GuildText ||
      channel?.type === ChannelType.DM
    );
  }

  async sendMessage(data: MessageData): Promise<{
    success: boolean;
    messageId?: string;
    content?: string;
    error?: string;
  }> {
    try {
      this.logger.info("DiscordClient.sendMessage", "Sending message", {
        data,
      });

      if (!data?.channelId || !data?.content) {
        return {
          success: false,
          error: "Channel ID and content are required",
        };
      }

      const channel = this.client.channels.cache.get(data?.channelId);
      if (!this.getIsValidTextChannel(channel)) {
        const error = new Error(
          `Invalid or unsupported channel: ${data.channelId}`
        );
        this.logger.error(
          "DiscordClient.sendMessage",
          "Error sending message",
          {
            error,
          }
        );
        throw error;
      }

      let sentMessage;
      const MAX_LENGTH = 1500; // Setting a conservative limit to avoid Discord API errors

      console.log("Sending message", data.content.length);

      // If message is longer than MAX_LENGTH, split and send multiple messages
      if (data.content.length > MAX_LENGTH) {
        // Split on newlines if possible to maintain formatting
        const chunks = [];
        let currentChunk = "";
        const lines = data.content.split("\n");

        for (const line of lines) {
          // If adding this line would exceed max length, push current chunk and start new one
          if (currentChunk.length + line.length + 1 > MAX_LENGTH) {
            if (currentChunk) {
              chunks.push(currentChunk);
              currentChunk = "";
            }

            // If single line is longer than MAX_LENGTH, split it
            if (line.length > MAX_LENGTH) {
              let remainingLine = line;
              while (remainingLine.length > 0) {
                chunks.push(remainingLine.slice(0, MAX_LENGTH));
                remainingLine = remainingLine.slice(MAX_LENGTH);
              }
            } else {
              currentChunk = line;
            }
          } else {
            // Add line to current chunk
            currentChunk = currentChunk ? currentChunk + "\n" + line : line;
          }
        }

        // Push final chunk if it exists
        if (currentChunk) {
          chunks.push(currentChunk);
        }

        // Send all chunks sequentially
        for (const chunk of chunks) {
          sentMessage = await channel.send(chunk);
        }
      } else {
        // Send normal message
        sentMessage = await channel.send(data.content);
      }

      return {
        success: true,
        messageId: sentMessage?.id,
        content: data.content,
        error: undefined,
      };
    } catch (error) {
      this.logger.error("DiscordClient.sendMessage", "Error sending message", {
        error,
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async sendMessageWithAttachments(data: MessageData): Promise<{
    success: boolean;
    messageId?: string;
    content?: string;
    error?: string;
  }> {
    try {
      this.logger.info("DiscordClient.sendMessageWithAttachments", "Sending message with attachments", {
        data,
      });

      if (!data?.channelId || !data?.content) {
        return {
          success: false,
          error: "Channel ID and content are required",
        };
      }

      const channel = this.client.channels.cache.get(data?.channelId);
      if (!this.getIsValidTextChannel(channel)) {
        const error = new Error(
          `Invalid or unsupported channel: ${data.channelId}`
        );
        this.logger.error(
          "DiscordClient.sendMessageWithAttachments",
          "Error sending message",
          {
            error,
          }
        );
        throw error;
      }

      const MAX_LENGTH = 1500;
      let sentMessage;

      // Handle content that's too long
      if (data.content.length > MAX_LENGTH) {
        // If we have attachments, send the attachments with the first chunk
        // and send additional chunks as separate messages

        // Split message into chunks as in the original sendMessage
        const chunks = [];
        let currentChunk = "";
        const lines = data.content.split("\n");

        for (const line of lines) {
          // If adding this line would exceed max length, push current chunk and start new one
          if (currentChunk.length + line.length + 1 > MAX_LENGTH) {
            if (currentChunk) {
              chunks.push(currentChunk);
              currentChunk = "";
            }

            // If single line is longer than MAX_LENGTH, split it
            if (line.length > MAX_LENGTH) {
              let remainingLine = line;
              while (remainingLine.length > 0) {
                chunks.push(remainingLine.slice(0, MAX_LENGTH));
                remainingLine = remainingLine.slice(MAX_LENGTH);
              }
            } else {
              currentChunk = line;
            }
          } else {
            // Add line to current chunk
            currentChunk = currentChunk ? currentChunk + "\n" + line : line;
          }
        }

        // Push final chunk if it exists
        if (currentChunk) {
          chunks.push(currentChunk);
        }

        // Send first chunk with attachments
        if (chunks.length > 0 && data.files && data.files.length > 0) {
          sentMessage = await channel.send({
            content: chunks[0],
            files: data.files
          });

          // Send the rest of the chunks as normal messages
          for (let i = 1; i < chunks.length; i++) {
            await channel.send(chunks[i]);
          }
        } else {
          // No attachments, or no chunks - just send the chunks sequentially
          for (const chunk of chunks) {
            sentMessage = await channel.send(chunk);
          }
        }
      } else {
        // Content within limits - send as one message with attachments if any
        if (data.files && data.files.length > 0) {
          sentMessage = await channel.send({
            content: data.content,
            files: data.files
          });
        } else {
          sentMessage = await channel.send(data.content);
        }
      }

      return {
        success: true,
        messageId: sentMessage?.id,
        content: data.content,
        error: undefined,
      };
    } catch (error) {
      this.logger.error("DiscordClient.sendMessageWithAttachments", "Error sending message with attachments", {
        error,
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}