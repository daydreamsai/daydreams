import {
  decodePaymentResponseHeader,
  wrapFetchWithPayment,
  x402Client,
  type Network,
  type PaymentPolicy,
  type PaymentRequirements,
} from "@x402/fetch";
import { ExactEvmScheme, toClientEvmSigner } from "@x402/evm";
import type { Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

/**
 * A guarded x402 buyer for StallRow's pay-per-call web utilities.
 *
 * The nanoservice example in this directory shows the seller side of
 * x402 (an agent *charging* per request). This client is the missing
 * buyer side: it pays a live x402 v2 endpoint mid-task, under a hard
 * spend contract enforced *before* anything is signed:
 *
 * - The asset must be USDC on Base and the amount must be at or under
 *   the route's known price — a `PaymentPolicy` filters every other
 *   challenge out before selection, and the SDK's own spend controls
 *   cap the payment a second time.
 * - The EIP-3009 validity window must be at most
 *   `MAX_TIMEOUT_SECONDS`. The EVM scheme builds `validBefore` from
 *   the challenge's `maxTimeoutSeconds` internally, so the ceiling is
 *   enforced by an `onBeforePaymentCreation` hook that aborts before
 *   the payload (and its signature) is created.
 * - A per-task cap tracks settled spend across calls; once the next
 *   call would exceed it, the call is refused before any request.
 * - With no wallet key configured the buyer fails closed: every call
 *   throws `StallRowNotConfiguredError` naming the price it *would*
 *   have paid, and no request is made.
 *
 * The key is read from the environment only and is never logged.
 */

export const STALLROW_BASE_URL = "https://stall-row-production.up.railway.app";
export const BASE_NETWORK = "eip155:8453";
export const BASE_USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
export const MAX_TIMEOUT_SECONDS = 300;
export const PRIVATE_KEY_ENV_VAR = "STALLROW_WALLET_PRIVATE_KEY";
export const MAX_TASK_ENV_VAR = "STALLROW_MAX_TASK_USDC";
export const DEFAULT_MAX_TASK_USDC = "0.05";

export interface StallRowRoute {
  path: string;
  /** Price in USDC base units (6 decimals). */
  priceUnits: bigint;
  /** Price as a decimal USDC string, e.g. "0.005". */
  priceUsdc: string;
}

export const PAGE_METADATA_ROUTE: StallRowRoute = {
  path: "/v1/page-metadata",
  priceUnits: 5_000n,
  priceUsdc: "0.005",
};

export const VIDEO_TRANSCRIPT_ROUTE: StallRowRoute = {
  path: "/v1/video-transcript",
  priceUnits: 10_000n,
  priceUsdc: "0.01",
};

export class StallRowError extends Error {}

export class StallRowNotConfiguredError extends StallRowError {}

export class StallRowPaymentError extends StallRowError {}

/** Parse a decimal USDC string ("0.05") into base units (50000n). */
export function usdcToUnits(value: string): bigint {
  const [whole, fraction = ""] = value.trim().split(".");
  const units =
    BigInt(whole || "0") * 1_000_000n +
    BigInt((fraction + "000000").slice(0, 6) || "0");
  return units;
}

/** Format USDC base units back to a decimal string ("0.015"). */
export function unitsToUsdc(units: bigint): string {
  const whole = units / 1_000_000n;
  const fraction = (units % 1_000_000n)
    .toString()
    .padStart(6, "0")
    .replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : `${whole}`;
}

/**
 * Keep only the challenges this buyer will ever sign for: the `exact`
 * scheme on Base, paid in Base USDC, at or under the route's price.
 * Returning an empty list makes the SDK refuse before signing.
 */
export function stallRowPolicy(maxAmountUnits: bigint): PaymentPolicy {
  return (_x402Version, requirements: PaymentRequirements[]) =>
    requirements.filter(
      (r) =>
        r.scheme === "exact" &&
        r.network === BASE_NETWORK &&
        r.asset.toLowerCase() === BASE_USDC_ADDRESS.toLowerCase() &&
        BigInt(r.amount) <= maxAmountUnits
    );
}

/**
 * The validity-window ceiling: refuse a challenge whose
 * `maxTimeoutSeconds` would keep a signed authorization settleable
 * for longer than `MAX_TIMEOUT_SECONDS`.
 */
export function assertTimeoutWithinCeiling(maxTimeoutSeconds: number): void {
  if (
    !Number.isFinite(maxTimeoutSeconds) ||
    maxTimeoutSeconds <= 0 ||
    maxTimeoutSeconds > MAX_TIMEOUT_SECONDS
  ) {
    throw new StallRowPaymentError(
      `endpoint requires a payment validity window of ` +
        `${maxTimeoutSeconds} seconds, outside the 1-` +
        `${MAX_TIMEOUT_SECONDS} second window this client will sign`
    );
  }
}

/** Tracks settled spend for one research task against a hard cap. */
export class SpendTracker {
  spentUnits = 0n;
  readonly charges: Array<{ path: string; units: bigint }> = [];

  constructor(readonly maxTaskUnits: bigint) {}

  assertCanSpend(route: StallRowRoute): void {
    if (this.spentUnits + route.priceUnits > this.maxTaskUnits) {
      throw new StallRowPaymentError(
        `task spend cap reached: ${route.path} costs ` +
          `$${route.priceUsdc} USDC, task has spent ` +
          `$${unitsToUsdc(this.spentUnits)} of its ` +
          `$${unitsToUsdc(this.maxTaskUnits)} cap`
      );
    }
  }

  record(route: StallRowRoute): void {
    this.spentUnits += route.priceUnits;
    this.charges.push({ path: route.path, units: route.priceUnits });
  }
}

export interface StallRowBuyerOptions {
  privateKey?: string;
  maxTaskUsdc?: string;
  baseUrl?: string;
  /** Injectable for tests; defaults to the global fetch. */
  fetchFn?: typeof fetch;
}

export class StallRowBuyer {
  readonly tracker: SpendTracker;
  readonly address?: string;
  private readonly signer?: ReturnType<typeof toClientEvmSigner>;
  private readonly baseUrl: string;
  private readonly fetchFn: typeof fetch;
  lastPayment?: {
    transaction: string;
    network: string;
    payer: string;
  };

  constructor(options: StallRowBuyerOptions = {}) {
    this.baseUrl = (options.baseUrl ?? STALLROW_BASE_URL).replace(/\/$/, "");
    this.fetchFn = options.fetchFn ?? fetch;
    this.tracker = new SpendTracker(
      usdcToUnits(options.maxTaskUsdc ?? DEFAULT_MAX_TASK_USDC)
    );
    const key = options.privateKey?.trim();
    if (key) {
      const account = privateKeyToAccount(
        (key.startsWith("0x") ? key : `0x${key}`) as Hex
      );
      this.address = account.address;
      this.signer = toClientEvmSigner(account);
    }
  }

  static fromEnv(): StallRowBuyer {
    return new StallRowBuyer({
      privateKey: process.env[PRIVATE_KEY_ENV_VAR] || undefined,
      maxTaskUsdc: process.env[MAX_TASK_ENV_VAR] || undefined,
      baseUrl: process.env.STALLROW_BASE_URL || undefined,
    });
  }

  get configured(): boolean {
    return this.signer !== undefined;
  }

  /** POST /v1/page-metadata — one page's declared metadata, $0.005. */
  async pageMetadata(url: string): Promise<Record<string, unknown>> {
    return this.postPaid(PAGE_METADATA_ROUTE, { url });
  }

  /**
   * POST /v1/video-transcript — one YouTube video's caption text with
   * timed segments, $0.01. Takes a video id or a youtube.com /
   * youtu.be URL, plus an optional caption language code.
   */
  async videoTranscript(
    video: string,
    lang?: string
  ): Promise<Record<string, unknown>> {
    return this.postPaid(VIDEO_TRANSCRIPT_ROUTE, {
      video,
      ...(lang ? { lang } : {}),
    });
  }

  private async postPaid(
    route: StallRowRoute,
    body: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    if (!this.signer) {
      throw new StallRowNotConfiguredError(
        `${route.path} requires a payment of $${route.priceUsdc} USDC ` +
          `but no payer wallet is configured; set ${PRIVATE_KEY_ENV_VAR} ` +
          `to a funded Base wallet's private key to pay x402 endpoints`
      );
    }
    this.tracker.assertCanSpend(route);

    const client = new x402Client();
    client.register(BASE_NETWORK as Network, new ExactEvmScheme(this.signer));
    // SDK-level cap as a second belt: default assets only, and never
    // more than this route's price in a single payment.
    client.setSpendControls({ maxAmountPerPayment: `$${route.priceUsdc}` });
    client.registerPolicy(stallRowPolicy(route.priceUnits));
    // The scheme signs validBefore = now + maxTimeoutSeconds with no
    // parameter of its own; abort here, before the payload exists.
    client.onBeforePaymentCreation(async ({ selectedRequirements }) => {
      try {
        assertTimeoutWithinCeiling(selectedRequirements.maxTimeoutSeconds);
      } catch (error) {
        return {
          abort: true as const,
          reason: (error as Error).message,
        };
      }
    });

    const fetchWithPayment = wrapFetchWithPayment(this.fetchFn, client);
    let response: Response;
    try {
      response = await fetchWithPayment(`${this.baseUrl}${route.path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (error) {
      throw new StallRowPaymentError(
        `payment for ${route.path} was refused or failed: ` +
          `${(error as Error).message ?? error}`
      );
    }
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new StallRowPaymentError(
        `paid request to ${route.path} failed: HTTP ` +
          `${response.status}: ${text.slice(0, 300)}`
      );
    }

    const paymentHeader = response.headers.get("payment-response");
    if (paymentHeader) {
      const payment = decodePaymentResponseHeader(paymentHeader);
      this.lastPayment = {
        transaction: payment.transaction,
        network: String(payment.network ?? ""),
        payer: String(payment.payer ?? ""),
      };
      this.tracker.record(route);
    }
    return (await response.json()) as Record<string, unknown>;
  }
}
