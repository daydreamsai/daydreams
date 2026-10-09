import * as z from "zod";
import { action, extension, Logger } from "@daydreamsai/core";
import {
  capabilitiesToJson,
  cashErrorToJson,
  cashoutResultToJson,
  createCashClient,
  estimateToJson,
  fillStatsToJson,
  isCashError,
  orderToJson,
  topUpResultToJson,
  usdc,
  withdrawResultToJson,
} from "@zkp2p/cash";
import type {
  CashClient,
  CashOrder,
  CurrencyType,
  RuntimeEnv,
} from "@zkp2p/cash";
import { createWalletClient, http } from "viem";
import type { WalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";

const ENVIRONMENTS = ["production", "preproduction", "staging"] as const;
const REFERRAL_CODE_PATTERN = /^[A-Za-z0-9]{6}$/;
const PRIVATE_KEY_PATTERN = /^0x[0-9a-fA-F]{64}$/;
const ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;

/**
 * All Peer Cash transactions run through one task queue so the agent never
 * signs two Base transactions concurrently from the same wallet.
 */
const TRANSACTION_QUEUE = "peer-cash:transactions";

export interface PeerCashConfig {
  /**
   * Peer protocol environment. Defaults to `PEER_CASH_ENVIRONMENT` or
   * `"production"`.
   */
  environment?: RuntimeEnv;
  /**
   * Your six-character referral code from the Peer mobile or web app.
   * Deposits created by this extension carry the `peer-ref-XXXXXX` ERC-8021
   * marker; when they fill, the protocol pays the code owner a 50 bps
   * integration share. The code-to-wallet mapping is permanent.
   */
  referralCode?: string;
  /**
   * Analytics-only ERC-8021 attribution code(s), e.g. `"acme-app"`. Carries
   * no payout; use `referralCode` for the integration share.
   */
  referrer?: string | string[];
  /**
   * Private key of the agent wallet that holds Base USDC and signs cash-out,
   * withdraw, and top-up transactions. Defaults to `PEER_CASH_PRIVATE_KEY`.
   * When absent, read actions still work and mutating actions return a
   * `WALLET_NOT_CONFIGURED` error.
   */
  privateKey?: `0x${string}`;
  /**
   * Base RPC URL. Defaults to `PEER_CASH_RPC_URL` or the public Base RPC.
   */
  rpcUrl?: string;
  /** Preconstructed client, used by tests and advanced hosts. */
  client?: CashClient;
}

interface PeerCashActionError {
  code: string;
  message: string;
  retryable: boolean;
  remediation?: string;
  recovery?: unknown;
}

interface ResolvedPeerCashConfig {
  environment: RuntimeEnv;
  referralCode?: string;
  referrer?: string | string[];
  rpcUrl?: string;
  wallet?: WalletClient;
  walletAddress?: string;
}

function resolveConfig(config: PeerCashConfig): ResolvedPeerCashConfig {
  const environment = (config.environment ??
    process.env.PEER_CASH_ENVIRONMENT ??
    "production") as RuntimeEnv;
  if (!ENVIRONMENTS.includes(environment)) {
    throw new Error(
      `@daydreamsai/peer-cash: invalid environment "${environment}". ` +
        `Expected one of: ${ENVIRONMENTS.join(", ")}.`
    );
  }

  if (
    config.referralCode !== undefined &&
    !REFERRAL_CODE_PATTERN.test(config.referralCode)
  ) {
    throw new Error(
      `@daydreamsai/peer-cash: invalid referralCode "${config.referralCode}". ` +
        `Expected the six-character code shown in your Peer app.`
    );
  }

  const privateKey =
    config.privateKey ??
    (process.env.PEER_CASH_PRIVATE_KEY as `0x${string}` | undefined);
  if (privateKey !== undefined && !PRIVATE_KEY_PATTERN.test(privateKey)) {
    throw new Error(
      "@daydreamsai/peer-cash: invalid privateKey. Expected a 0x-prefixed " +
        "32-byte hex string."
    );
  }

  const rpcUrl = config.rpcUrl ?? process.env.PEER_CASH_RPC_URL;

  let wallet: WalletClient | undefined;
  let walletAddress: string | undefined;
  if (privateKey) {
    const account = privateKeyToAccount(privateKey);
    wallet = createWalletClient({
      account,
      chain: base,
      transport: http(rpcUrl),
    });
    walletAddress = account.address;
  }

  return {
    environment,
    referralCode: config.referralCode,
    referrer: config.referrer,
    rpcUrl,
    wallet,
    walletAddress,
  };
}

function toActionError(error: unknown): { error: PeerCashActionError } {
  if (isCashError(error)) {
    return { error: cashErrorToJson(error) };
  }
  return {
    error: {
      code: "UNEXPECTED_ERROR",
      message: error instanceof Error ? error.message : String(error),
      retryable: false,
    },
  };
}

function walletNotConfigured(): { error: PeerCashActionError } {
  return {
    error: {
      code: "WALLET_NOT_CONFIGURED",
      message:
        "No agent wallet is configured, so signing transactions is not possible.",
      retryable: false,
      remediation:
        "Configure the extension with privateKey or set PEER_CASH_PRIVATE_KEY, " +
        "then restart the agent. Read actions work without a wallet.",
    },
  };
}

function serializeOrder(order: CashOrder) {
  return { ...orderToJson(order), explain: order.explain() };
}

const usdcAmountSchema = z
  .string()
  .regex(/^\d+(\.\d{1,6})?$/)
  .describe(
    "USDC amount as a decimal string with up to 6 decimals, e.g. '25.50'"
  );

const currencySchema = z
  .string()
  .regex(/^[A-Za-z]{3}$/)
  .describe("ISO 4217 fiat currency code, e.g. 'USD', 'EUR', 'GBP'");

const depositIdSchema = z
  .string()
  .min(1)
  .describe(
    "Composite deposit id returned by peer-cash.cashout, e.g. '0xabc..._12'"
  );

/**
 * Creates an extension that exposes Peer Cash to the agent: cash out Base
 * USDC to fiat in payment apps (Venmo, Revolut, Wise, Zelle, and more) via
 * the Peer P2P protocol.
 *
 * The extension is non-custodial. Funds move from the agent wallet into the
 * Peer escrow contract, only that wallet can withdraw an unmatched deposit,
 * and there are no API keys. Pricing is the live Chainlink oracle rate at
 * fill time with zero spread; estimates are approximate, never locked.
 *
 * @param config Environment, referral attribution, and agent wallet settings
 * @returns An extension for the agent's extensions list
 */
export function createPeerCashExtension(config: PeerCashConfig = {}) {
  const resolved = resolveConfig(config);

  const client =
    config.client ??
    createCashClient({
      environment: resolved.environment,
      rpcUrl: resolved.rpcUrl,
      referralCode: resolved.referralCode,
      referrer: resolved.referrer,
    });

  return extension({
    name: "peer-cash",

    install(agent) {
      const logger = agent.container.resolve<Logger>("logger");
      logger.info("peer-cash:extension", "Peer Cash extension installed", {
        environment: resolved.environment,
        wallet: resolved.walletAddress ?? "not configured (read-only)",
        referralCode: resolved.referralCode !== undefined,
      });
    },

    actions: [
      action({
        name: "peer-cash.capabilities",
        description:
          "List what Peer Cash can do right now: supported payout platforms, " +
          "their fiat currencies, payee handle format hints, and min/max " +
          "cash-out bounds. Call this before the first cashout.",
        handler() {
          try {
            return { capabilities: capabilitiesToJson(client.capabilities()) };
          } catch (error) {
            return toActionError(error);
          }
        },
      }),

      action({
        name: "peer-cash.fillStats",
        description:
          "Raw 30-day demand evidence per 'platform:currency' pair: completed " +
          "fill counts and median time to first fill. Use it to pick a " +
          "corridor. A reasonable gate is fills >= 10 and median <= 48h; if " +
          "stats are unavailable or the gate would empty the catalog, fall " +
          "back to the full capabilities list.",
        async handler() {
          try {
            return { fillStats: fillStatsToJson(await client.fillStats()) };
          } catch (error) {
            return toActionError(error);
          }
        },
      }),

      action({
        name: "peer-cash.estimate",
        description:
          "Estimate a cash-out at the current Chainlink oracle rate: rate, " +
          "fiat receive amount, and a historical fill-time ETA. This is an " +
          "approximation for planning. It is NOT a locked quote; the binding " +
          "rate resolves at the oracle when a buyer fills, always with zero " +
          "spread. No side effects.",
        schema: {
          amountUsdc: usdcAmountSchema,
          currency: currencySchema,
          platform: z
            .string()
            .optional()
            .describe(
              "Optional payout platform id for platform-specific ETA sampling"
            ),
          includeEta: z
            .boolean()
            .optional()
            .describe("Set false to skip the historical ETA lookup"),
        },
        async handler({ amountUsdc, currency, platform, includeEta }) {
          try {
            const estimate = await client.estimate(
              {
                amount: usdc(amountUsdc),
                currency: currency.toUpperCase() as CurrencyType,
                platform,
              },
              { includeEta: includeEta !== false }
            );
            return { estimate: estimateToJson(estimate) };
          } catch (error) {
            return toActionError(error);
          }
        },
      }),

      action({
        name: "peer-cash.cashout",
        description:
          "Cash out USDC from the agent wallet to fiat in a payment app. " +
          "This SIGNS AND SUBMITS Base transactions: USDC moves from the " +
          "agent wallet into the Peer escrow contract as a deposit priced at " +
          "the live oracle rate, a buyer pays the payee fiat and proves it, " +
          "and the protocol releases the USDC to the buyer. Only the agent " +
          "wallet can withdraw an unmatched deposit. The payee must be a " +
          "real account on the platform. Returns a depositId; track it with " +
          "peer-cash.order and unwind it with peer-cash.withdraw.",
        schema: {
          amountUsdc: usdcAmountSchema,
          platform: z
            .string()
            .describe("Payout platform id from capabilities, e.g. 'venmo'"),
          currency: currencySchema,
          payee: z
            .string()
            .min(1)
            .describe(
              "Payee handle on the platform, e.g. '@user' for Venmo. Follow " +
                "the payeeHint from capabilities."
            ),
        },
        queueKey: TRANSACTION_QUEUE,
        async handler({ amountUsdc, platform, currency, payee }) {
          const signer = resolved.wallet;
          if (!signer) return walletNotConfigured();
          try {
            const result = await client.cashout(
              {
                amount: usdc(amountUsdc),
                receive: {
                  platform,
                  currency: currency.toUpperCase() as CurrencyType,
                  payee,
                },
              },
              { signer }
            );
            return {
              result: cashoutResultToJson(result),
              explain: result.order.explain(),
            };
          } catch (error) {
            return toActionError(error);
          }
        },
      }),

      action({
        name: "peer-cash.order",
        description:
          "Fetch the live state of a cash-out order by depositId: state " +
          "(awaiting-buyer, matched, delivering, delivered, returned), fill " +
          "receipts, amounts, a plain-language explanation, and nextActions " +
          "('wait' or 'withdraw'). Orders are resumable from the depositId " +
          "alone.",
        schema: { depositId: depositIdSchema },
        async handler({ depositId }) {
          try {
            return { order: serializeOrder(await client.order(depositId)) };
          } catch (error) {
            return toActionError(error);
          }
        },
      }),

      action({
        name: "peer-cash.orders",
        description:
          "List cash-out orders for a wallet address. Defaults to the agent " +
          "wallet. Set inFlight true to only list orders that still need " +
          "attention.",
        schema: {
          owner: z
            .string()
            .regex(ADDRESS_PATTERN)
            .optional()
            .describe("Wallet address; defaults to the agent wallet"),
          inFlight: z
            .boolean()
            .optional()
            .describe("Only orders still awaiting a buyer or a fill"),
          limit: z
            .number()
            .int()
            .positive()
            .optional()
            .describe("Max deposits to scan (default 100)"),
        },
        async handler({ owner, inFlight, limit }) {
          const target = owner ?? resolved.walletAddress;
          if (!target) return walletNotConfigured();
          try {
            const orders = await client.orders(target, { inFlight, limit });
            return {
              owner: target,
              count: orders.length,
              orders: orders.map(serializeOrder),
            };
          } catch (error) {
            return toActionError(error);
          }
        },
      }),

      action({
        name: "peer-cash.withdraw",
        description:
          "The one unwind verb. SIGNS AND SUBMITS Base transactions. With " +
          "amountUsdc, withdraws that much of the unlocked balance (a live " +
          "buyer intent does not block a partial withdrawal). Without it, " +
          "closes the order fully, pruning expired intents first when " +
          "needed, and returns the USDC to the agent wallet. Use when a " +
          "buyer never pays or the agent wants its funds back.",
        schema: {
          depositId: depositIdSchema,
          amountUsdc: usdcAmountSchema.optional(),
        },
        queueKey: TRANSACTION_QUEUE,
        async handler({ depositId, amountUsdc }) {
          const signer = resolved.wallet;
          if (!signer) return walletNotConfigured();
          try {
            const result = await client.withdraw(depositId, {
              signer,
              amount: amountUsdc !== undefined ? usdc(amountUsdc) : undefined,
            });
            return { result: withdrawResultToJson(result) };
          } catch (error) {
            return toActionError(error);
          }
        },
      }),

      action({
        name: "peer-cash.topUp",
        description:
          "Add USDC to a live cash-out order. SIGNS AND SUBMITS Base " +
          "transactions. Same payee, same live oracle market rate; the " +
          "order keeps its depositId.",
        schema: {
          depositId: depositIdSchema,
          amountUsdc: usdcAmountSchema,
        },
        queueKey: TRANSACTION_QUEUE,
        async handler({ depositId, amountUsdc }) {
          const signer = resolved.wallet;
          if (!signer) return walletNotConfigured();
          try {
            const result = await client.topUp(depositId, usdc(amountUsdc), {
              signer,
            });
            return { result: topUpResultToJson(result) };
          } catch (error) {
            return toActionError(error);
          }
        },
      }),
    ],
  });
}
