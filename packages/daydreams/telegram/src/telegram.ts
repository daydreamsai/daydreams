import * as z from "zod";
import { context } from "@daydreamsai/core";
import { service } from "@daydreamsai/core";
import { Telegraf } from "telegraf";
import type { Chat } from "@telegraf/types";
import {
  extension,
  input,
  output,
  splitTextIntoChunks,
} from "@daydreamsai/core";
import { formatMsg } from "@daydreamsai/core";

const telegramService = service({
  register(container) {
    container.singleton(
      "telegraf",
      () => new Telegraf(process.env.TELEGRAM_TOKEN!)
    );
  },
  async boot(container) {
    const telegraf = container.resolve<Telegraf>("telegraf");
    console.log("starting..");
    telegraf.launch({ dropPendingUpdates: true });
    const telegrafInfo = await telegraf.telegram.getMe();
    console.log(telegrafInfo);
  },
});

const telegramChat = context({
  type: "telegram:chat",
  key: ({ chatId }) => chatId.toString(),
  schema: { chatId: z.number() },
  async setup(args, settings, { container }) {
    const telegraf = container.resolve<Telegraf>("telegraf");
    const chat: Chat = await telegraf.telegram.getChat(args.chatId);
    return {
      chat,
    };
  },
  description({ options: { chat } }) {
    if (chat.type === "private") {
      return `You are in private telegram chat with ${chat.username} id: ${chat.id}`;
    }
    return "";
  },
  inputs: {
    "telegram:message": input({
      schema: {
        user: z.object({ id: z.number(), username: z.string() }),
        text: z.string(),
      },
      format({ data: { user, text } }) {
        return {
          tag: "input",
          params: {
            type: "telegram:message",
            userId: user.id.toString(),
            username: user.username,
          },
          children: text,
        };
      },
      subscribe(send, { container }) {
        const tg = container.resolve<Telegraf>("telegraf");
        tg.on("message", (ctx) => {
          const chat = ctx.chat;
          const user = ctx.msg.from;

          if ("text" in ctx.message) {
            send(
              telegramChat,
              { chatId: chat.id },
              {
                user: {
                  id: user.id,
                  username: user.username!,
                },
                text: ctx.message.text,
              }
            );
          }
        });

        return () => {};
      },
    }),
  },
  outputs: {
    "telegram:message": output({
      attributes: {
        userId: z
          .string()
          .describe("the userId to send the message to, you must include this"),
      },
      schema: z
        .string()
        .describe("the content of the message to send using markdown format"),
      description: "use this to send a telegram message to user",
      examples: [
        `<output type="telegram:message" userId="123456789">Hello! How can I assist you today?</output>`,
      ],
      handler: async (data, ctx, { container }) => {
        const tg = container.resolve<Telegraf>("telegraf").telegram;
        const chunks = splitTextIntoChunks(data, {
          maxChunkSize: 4096,
        });

        for (const chunk of chunks) {
          await tg.sendMessage(ctx.outputRef.params!.userId, chunk, {
            parse_mode: "Markdown",
          });
        }

        return {
          data,
          timestamp: Date.now(),
        };
      },
    }),
  },
});

export const telegram = extension({
  name: "telegram",
  services: [telegramService],
  contexts: {
    chat: telegramChat,
  },
});
