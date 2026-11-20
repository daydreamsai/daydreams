import { config } from "dotenv";
import { action, context, createDreams, LogLevel } from "@daydreamsai/core";
import { cliExtension } from "@daydreamsai/cli";
import { openai } from "@ai-sdk/openai";
import * as z from "zod";

import {
  NULLCLEAR_CHAINS,
  NullClearError,
  NullClearFirewall,
  type NullClearGuardDecision,
} from "./nullclear";

config();

const firewall = NullClearFirewall.fromEnv();

interface FirewallMemory {
  checksRun: number;
  blockedCount: number;
  recentDecisions: Array<{
    target: string;
    chain: string;
    verdict: string;
    allowed: boolean;
  }>;
}

const firewallContext = context({
  type: "nullclear-firewall",

  schema: z.object({
    sessionId: z.string().describe("On-chain execution session ID"),
  }),

  create: (): FirewallMemory => ({
    checksRun: 0,
    blockedCount: 0,
    recentDecisions: [],
  }),

  render: (state) => {
    const { checksRun, blockedCount, recentDecisions } = state.memory;
    return `
NullClear Pre-Execution Firewall Session: ${state.args.sessionId}
Mode: ${firewall.apiKey ? "Prepaid Pass (nc_live_...)" : "Zero-Key Free Tier (10 req/day + x402 fallback)"}
Total Preflight Checks: ${checksRun} (Blocked: ${blockedCount})
Recent Decisions: ${
      recentDecisions
        .slice(-5)
        .map((d) => `[${d.chain}] ${d.target} -> ${d.verdict} (allowed=${d.allowed})`)
        .join(" | ") || "None"
    }
    `.trim();
  },

  instructions: `You are an autonomous on-chain execution agent protected by the NullClear Pre-Execution Firewall.
Before signing or broadcasting any swap, token approval, or contract call on Base, Ethereum, Arbitrum, Optimism, Polygon, BSC, or Solana:
1. Run guard-transaction or scan-token first.
2. Never proceed if recommendedAgentAction starts with ABORT_ (ABORT_CRITICAL_TRAP, ABORT_DRAINER_APPROVAL, ABORT_WILL_REVERT).
3. Explain the forensic risk flags clearly when blocking a transaction.`,
});

firewallContext.setActions([
  action({
    name: "guard-transaction",
    description:
      "Run NullClear's 1-call Pre-Sign Firewall (POST /v1/guard) to decode calldata/EIP-712/Solana wire instructions, simulate state changes, and audit touched tokens before signing.",
    schema: z.object({
      chain: z.enum(NULLCLEAR_CHAINS).default("base"),
      from: z.string().optional().describe("Sender wallet address"),
      to: z.string().optional().describe("Target contract or router address"),
      tokenAddress: z
        .string()
        .optional()
        .describe("Target ERC-20 or SPL/Token-2022 mint address"),
      data: z.string().optional().describe("Hex calldata (0x...)"),
      value: z.string().optional().describe("Wei value being sent"),
      rawTransactionBase64: z
        .string()
        .optional()
        .describe("Base64-encoded Solana wire transaction"),
    }),
    handler: async (input, ctx) => {
      try {
        const decision: NullClearGuardDecision =
          await firewall.guardTransaction(input);
        ctx.memory.checksRun += 1;
        if (!decision.allowed) {
          ctx.memory.blockedCount += 1;
        }
        ctx.memory.recentDecisions.push({
          target: input.tokenAddress || input.to || "wire-tx",
          chain: input.chain,
          verdict: decision.recommendedAgentAction,
          allowed: decision.allowed,
        });
        return decision;
      } catch (error) {
        if (error instanceof NullClearError) {
          return { allowed: false, error: error.message, status: error.status };
        }
        throw error;
      }
    },
  }),

  action({
    name: "scan-token",
    description:
      "Audit an ERC-20 or Solana SPL / Token-2022 token for honeypots, buy/sell taxes, proxy upgrade traps, and mint/freeze/transfer-hook authorities.",
    schema: z.object({
      chain: z.enum(NULLCLEAR_CHAINS).default("base"),
      address: z.string().describe("Token contract or Solana mint address"),
    }),
    handler: async ({ chain, address }, ctx) => {
      try {
        const report = await firewall.scanToken(chain, address);
        ctx.memory.checksRun += 1;
        const allowed = report.recommendedAgentAction === "EXECUTE_SAFE";
        if (!allowed) {
          ctx.memory.blockedCount += 1;
        }
        ctx.memory.recentDecisions.push({
          target: address,
          chain,
          verdict: report.recommendedAgentAction,
          allowed,
        });
        return report;
      } catch (error) {
        if (error instanceof NullClearError) {
          return { error: error.message, status: error.status };
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
  contexts: [firewallContext],
});

async function main() {
  await agent.start();
  console.log("\n🛡️ NullClear Pre-Execution Firewall Agent Started!");
  const sessionId = process.argv[2] || "default-session";
  await agent.run({
    context: firewallContext,
    args: { sessionId },
  });
}

main().catch(console.error);
