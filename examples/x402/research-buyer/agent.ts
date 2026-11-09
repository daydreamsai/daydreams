import { config } from "dotenv";
import { action, context, createDreams, LogLevel } from "@daydreamsai/core";
import { cliExtension } from "@daydreamsai/cli";
import { openai } from "@ai-sdk/openai";
import * as z from "zod";

import { StallRowBuyer, StallRowError, unitsToUsdc } from "./stallrow";

/**
 * x402 research buyer — the buyer-side companion to the nanoservice
 * example in this directory.
 *
 * The nanoservice shows a Daydreams agent *charging* for requests.
 * This agent *pays*: mid-task, its research context buys two generic
 * web utilities from StallRow over x402 — page metadata ($0.005) to
 * judge a page before fetching it, and a video transcript ($0.01) to
 * learn what a video says — with no API key or account. Payment is
 * the auth, and a hard per-task spend cap (default $0.05) bounds the
 * total cost by construction.
 *
 * With no STALLROW_WALLET_PRIVATE_KEY configured the agent still
 * runs; its actions fail closed with an explanation instead of
 * paying. See stallrow.ts for the full spend contract.
 */

config();

const buyer = StallRowBuyer.fromEnv();

interface ResearchMemory {
  pagesChecked: Array<{ url: string; title: string | null }>;
  videosChecked: Array<{ video: string; title: string | null }>;
  findings: string[];
}

const researchContext = context({
  type: "web-research",

  schema: z.object({
    taskId: z.string().describe("Research task identifier"),
  }),

  create: (): ResearchMemory => ({
    pagesChecked: [],
    videosChecked: [],
    findings: [],
  }),

  render: (state) => {
    const { pagesChecked, videosChecked, findings } = state.memory;
    return `
Research Task: ${state.args.taskId}
Budget spent: $${unitsToUsdc(buyer.tracker.spentUnits)} USDC of the task cap
Pages checked: ${pagesChecked.map((p) => p.url).join(", ") || "None"}
Videos checked: ${videosChecked.map((v) => v.video).join(", ") || "None"}
Findings: ${findings.slice(-5).join(" | ") || "None"}
    `.trim();
  },

  instructions: `You are a web research agent. Before reading a page in
full, check its metadata to judge whether it is worth fetching. When a
source is a YouTube video, get its transcript to learn what it says.
Each check costs real USDC ($0.005-$0.01) from a capped task budget, so
check deliberately and summarize what each check taught you.`,
});

researchContext.setActions([
  action({
    name: "check-page-metadata",
    description:
      "Fetch a web page's declared metadata (title, description, " +
      "canonical URL, OpenGraph/Twitter fields, heading outline, word " +
      "count) for $0.005 USDC, paid automatically over x402.",
    schema: z.object({
      url: z.string().describe("The page URL to check"),
    }),
    handler: async ({ url }, ctx) => {
      try {
        const result = await buyer.pageMetadata(url);
        ctx.memory.pagesChecked.push({
          url,
          title: (result.title as string | null) ?? null,
        });
        ctx.memory.findings.push(
          `${url}: ${result.title ?? "untitled"} ` +
            `(${result.word_count ?? "?"} words)`
        );
        return result;
      } catch (error) {
        if (error instanceof StallRowError) {
          return { error: error.message };
        }
        throw error;
      }
    },
  }),

  action({
    name: "get-video-transcript",
    description:
      "Fetch a YouTube video's caption text with timed segments for " +
      "$0.01 USDC, paid automatically over x402. Use it to learn what " +
      "a video says before citing or summarizing it.",
    schema: z.object({
      video: z
        .string()
        .describe("YouTube video id or youtube.com / youtu.be URL"),
      lang: z
        .string()
        .optional()
        .describe("Optional caption language code, e.g. 'en'"),
    }),
    handler: async ({ video, lang }, ctx) => {
      try {
        const result = await buyer.videoTranscript(video, lang);
        ctx.memory.videosChecked.push({
          video,
          title: (result.title as string | null) ?? null,
        });
        ctx.memory.findings.push(
          `${video}: transcript, ${result.segment_count ?? "?"} segments`
        );
        return result;
      } catch (error) {
        if (error instanceof StallRowError) {
          return { error: error.message };
        }
        throw error;
      }
    },
  }),
]);

const agent = createDreams({
  logLevel: LogLevel.INFO,
  model: openai("gpt-4o-mini"),
  extensions: [cliExtension],
  contexts: [researchContext],
});

async function main() {
  await agent.start();

  console.log("\n🔬 x402 Research Buyer Started!");
  if (buyer.configured) {
    console.log(`💳 Paying from ${buyer.address} (address only; key is`);
    console.log("   read from the environment and never logged)");
    console.log(
      `💰 Task spend cap: $${unitsToUsdc(buyer.tracker.maxTaskUnits)} USDC`
    );
  } else {
    console.log("💳 No payer wallet configured — research actions will");
    console.log("   fail closed and pay nothing. Set");
    console.log("   STALLROW_WALLET_PRIVATE_KEY to enable payments.");
  }

  const taskId = process.argv[2] || "demo-task";
  await agent.run({
    context: researchContext,
    args: { taskId },
  });
}

main().catch(console.error);
