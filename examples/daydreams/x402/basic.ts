import { createDreamsRouterAuth } from "@daydreamsai/ai-sdk-provider";
import { context, createDreams, LogLevel } from "@daydreamsai/core";
import { cliExtension } from "@daydreamsai/cli";
import { privateKeyToAccount } from "viem/accounts";

const { dreamsRouter, user } = await createDreamsRouterAuth(
  privateKeyToAccount(Bun.env.PRIVATE_KEY as `0x${string}`),
  {
    payments: {
      amount: "100000", // $0.10 USDC
      network: "base-sepolia",
    },
  }
);

export const chatContext = context({
  type: "chat",
  maxSteps: 100,
  // schema: z.object({ chatId: z.string() }),
  key: (args) => args.chatId,
  render() {
    const date = new Date();
    return `\
Current ISO time is: ${date.toISOString()}, timestamp: ${date.getTime()}`;
  },
});

console.log("user", user.balance);

createDreams({
  logLevel: LogLevel.DEBUG,
  model: dreamsRouter("google-vertex/gemini-2.5-flash"),
  extensions: [cliExtension],
}).start();
