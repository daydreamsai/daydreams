import { describe, expect, it } from "bun:test";

import {
  assertTimeoutWithinCeiling,
  StallRowBuyer,
  StallRowNotConfiguredError,
  stallRowPolicy,
  unitsToUsdc,
  usdcToUnits,
} from "./stallrow";

/**
 * Offline tests for the guarded StallRow buyer. The HTTP/payment
 * layer is faked at the fetch seam: the fake answers the first
 * request with a real-shaped x402 v2 challenge and the paid retry
 * with a success body. Signing happens locally against Hardhat's
 * well-known development account #0 — a public test vector. No
 * network, no real funds.
 */

const TEST_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const TEST_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const PAY_TO = "0x097f9685D1e0752bF8B02d61E5Ce9be7eA0FBA7F";
const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const WETH_BASE = "0x4200000000000000000000000000000000000006";

function challengeResponse(overrides: Record<string, unknown> = {}): Response {
  const challenge = {
    x402Version: 2,
    error: "Payment required",
    resource: {
      url: "https://stall-row-production.up.railway.app/v1/page-metadata",
      description: "One web page's declared metadata in one call.",
      mimeType: "application/json",
    },
    accepts: [
      {
        scheme: "exact",
        network: "eip155:8453",
        asset: USDC_BASE,
        amount: "5000",
        payTo: PAY_TO,
        maxTimeoutSeconds: 300,
        extra: { name: "USD Coin", version: "2" },
        ...overrides,
      },
    ],
  };
  const header = Buffer.from(JSON.stringify(challenge)).toString("base64");
  return new Response(JSON.stringify(challenge), {
    status: 402,
    headers: {
      "payment-required": header,
      "content-type": "application/json",
    },
  });
}

function okResponse(): Response {
  const paymentResponse = Buffer.from(
    JSON.stringify({
      success: true,
      transaction: `0x${"ab".repeat(32)}`,
      network: "eip155:8453",
      payer: TEST_ADDRESS,
    })
  ).toString("base64");
  return new Response(
    JSON.stringify({
      url: "https://example.com/",
      title: "Example Domain",
      word_count: 29,
    }),
    {
      status: 200,
      headers: {
        "payment-response": paymentResponse,
        "content-type": "application/json",
      },
    }
  );
}

function fakeFetch(responses: Response[]) {
  const calls: Array<{ input: unknown; init?: RequestInit }> = [];
  const fn = async (input: unknown, init?: RequestInit) => {
    calls.push({ input, init });
    const response = responses[calls.length - 1];
    if (!response) throw new Error("fake fetch ran out of responses");
    return response;
  };
  return { fn: fn as unknown as typeof fetch, calls };
}

function paidAuthorization(
  calls: Array<{ input: unknown; init?: RequestInit }>
) {
  const call = calls[1];
  // The v2 wrapper may carry the header on the init object or on a
  // Request it built from it — check both shapes.
  let header: string | null | undefined;
  const initHeaders = call?.init?.headers;
  if (initHeaders instanceof Headers) {
    header = initHeaders.get("payment-signature");
  } else if (initHeaders) {
    const record = initHeaders as Record<string, string>;
    header = record["PAYMENT-SIGNATURE"] ?? record["payment-signature"];
  }
  if (!header) {
    const input = call?.input as { headers?: Headers } | undefined;
    header = input?.headers?.get?.("payment-signature");
  }
  if (!header) throw new Error("paid retry carried no payment header");
  const payload = JSON.parse(Buffer.from(header, "base64").toString());
  return payload.payload.authorization;
}

describe("unit conversions", () => {
  it("converts USDC decimals to base units and back", () => {
    expect(usdcToUnits("0.005")).toBe(5_000n);
    expect(usdcToUnits("0.05")).toBe(50_000n);
    expect(unitsToUsdc(15_000n)).toBe("0.015");
    expect(unitsToUsdc(50_000n)).toBe("0.05");
  });
});

describe("validity-window ceiling", () => {
  it("accepts the window StallRow actually offers", () => {
    expect(() => assertTimeoutWithinCeiling(300)).not.toThrow();
  });

  it("refuses windows beyond the ceiling", () => {
    expect(() => assertTimeoutWithinCeiling(301)).toThrow("validity window");
    expect(() => assertTimeoutWithinCeiling(63_072_000)).toThrow(
      "validity window"
    );
    expect(() => assertTimeoutWithinCeiling(0)).toThrow("validity window");
  });
});

describe("requirement policy", () => {
  it("keeps only exact Base USDC at or under the cap", () => {
    const req = (overrides: Record<string, unknown> = {}) =>
      ({
        scheme: "exact",
        network: "eip155:8453",
        asset: USDC_BASE,
        amount: "5000",
        payTo: PAY_TO,
        maxTimeoutSeconds: 300,
        ...overrides,
      }) as never;
    const policy = stallRowPolicy(5_000n);
    expect(policy(2, [req()])).toHaveLength(1);
    expect(policy(2, [req({ asset: WETH_BASE })])).toHaveLength(0);
    expect(policy(2, [req({ amount: "5001" })])).toHaveLength(0);
    expect(policy(2, [req({ network: "eip155:1" })])).toHaveLength(0);
  });
});

describe("buyer", () => {
  it("fails closed with no wallet configured and makes no request", async () => {
    const fake = fakeFetch([]);
    const buyer = new StallRowBuyer({ fetchFn: fake.fn });

    await expect(
      buyer.pageMetadata("https://example.com/")
    ).rejects.toBeInstanceOf(StallRowNotConfiguredError);
    expect(fake.calls).toHaveLength(0);
  });

  it("pays a well-formed challenge and returns the metadata", async () => {
    const fake = fakeFetch([challengeResponse(), okResponse()]);
    const buyer = new StallRowBuyer({
      privateKey: TEST_PRIVATE_KEY,
      fetchFn: fake.fn,
    });

    const result = await buyer.pageMetadata("https://example.com/");

    expect(result.title).toBe("Example Domain");
    expect(fake.calls).toHaveLength(2);
    const authorization = paidAuthorization(fake.calls);
    expect(authorization.from).toBe(TEST_ADDRESS);
    expect(authorization.to).toBe(PAY_TO);
    expect(authorization.value).toBe("5000");
    const now = Math.floor(Date.now() / 1000);
    expect(Number(authorization.validBefore)).toBeGreaterThan(now);
    expect(Number(authorization.validBefore) - now).toBeLessThanOrEqual(300);
    expect(buyer.tracker.spentUnits).toBe(5_000n);
    expect(buyer.lastPayment?.transaction).toStartWith("0x");
  });

  it("refuses an over-price challenge before signing", async () => {
    const fake = fakeFetch([challengeResponse({ amount: "6000" })]);
    const buyer = new StallRowBuyer({
      privateKey: TEST_PRIVATE_KEY,
      fetchFn: fake.fn,
    });

    await expect(buyer.pageMetadata("https://example.com/")).rejects.toThrow();
    // Only the unpaid probe happened — the paid retry never did.
    expect(fake.calls).toHaveLength(1);
    expect(buyer.tracker.spentUnits).toBe(0n);
  });

  it("refuses a non-USDC asset before signing", async () => {
    const fake = fakeFetch([challengeResponse({ asset: WETH_BASE })]);
    const buyer = new StallRowBuyer({
      privateKey: TEST_PRIVATE_KEY,
      fetchFn: fake.fn,
    });

    await expect(buyer.pageMetadata("https://example.com/")).rejects.toThrow();
    expect(fake.calls).toHaveLength(1);
    expect(buyer.tracker.spentUnits).toBe(0n);
  });

  it("refuses an excessive validity window before signing", async () => {
    const fake = fakeFetch([
      challengeResponse({ maxTimeoutSeconds: 63_072_000 }),
    ]);
    const buyer = new StallRowBuyer({
      privateKey: TEST_PRIVATE_KEY,
      fetchFn: fake.fn,
    });

    await expect(buyer.pageMetadata("https://example.com/")).rejects.toThrow(
      /validity window/
    );
    expect(fake.calls).toHaveLength(1);
    expect(buyer.tracker.spentUnits).toBe(0n);
  });

  it("enforces the per-task spend cap across calls", async () => {
    const fake = fakeFetch([challengeResponse(), okResponse()]);
    const buyer = new StallRowBuyer({
      privateKey: TEST_PRIVATE_KEY,
      fetchFn: fake.fn,
      maxTaskUsdc: "0.012",
    });

    await buyer.pageMetadata("https://example.com/");
    // $0.005 spent; the $0.01 transcript would take the task to
    // $0.015, over its $0.012 cap — refused before any request.
    await expect(buyer.videoTranscript("dQw4w9WgXcQ")).rejects.toThrow(
      /task spend cap/
    );
    expect(fake.calls).toHaveLength(2);
    expect(buyer.tracker.spentUnits).toBe(5_000n);
  });
});
