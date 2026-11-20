import { describe, expect, it } from "bun:test";
import { NullClearError, NullClearFirewall } from "./nullclear";

describe("NullClearFirewall", () => {
  it("allows transactions when recommendedAgentAction is EXECUTE_SAFE", async () => {
    const firewall = new NullClearFirewall({
      fetchImpl: (async () =>
        new Response(
          JSON.stringify({
            recommendedAgentAction: "EXECUTE_SAFE",
            safetyVerdict: "SAFE",
            riskScore: 0,
            summary: "Verified Base USDC contract; simulation succeeded.",
            riskFlags: [],
          }),
          { status: 200 },
        )) as unknown as typeof fetch,
    });

    const res = await firewall.guardTransaction({
      chain: "base",
      tokenAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    });

    expect(res.allowed).toBe(true);
    expect(res.recommendedAgentAction).toBe("EXECUTE_SAFE");
    expect(res.riskScore).toBe(0);
  });

  it("blocks honeypot traps (ABORT_CRITICAL_TRAP) and drainer approvals (ABORT_DRAINER_APPROVAL)", async () => {
    const firewall = new NullClearFirewall({
      fetchImpl: (async () =>
        new Response(
          JSON.stringify({
            recommendedAgentAction: "ABORT_DRAINER_APPROVAL",
            safetyVerdict: "CRITICAL_TRAP",
            riskScore: 98,
            summary: "Unlimited Permit2 approval to unverified EOA drainer.",
            riskFlags: ["UNLIMITED_APPROVAL_TO_EOA", "UNVERIFIED_SPENDER"],
          }),
          { status: 200 },
        )) as unknown as typeof fetch,
    });

    const res = await firewall.guardTransaction({
      chain: "base",
      to: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
      data: "0x095ea7b3",
    });

    expect(res.allowed).toBe(false);
    expect(res.recommendedAgentAction).toBe("ABORT_DRAINER_APPROVAL");
    expect(res.riskFlags).toContain("UNLIMITED_APPROVAL_TO_EOA");
  });

  it("enforces strictCaution mode on CAUTION_HIGH_RISK when enabled", async () => {
    const mockFetch = (async () =>
      new Response(
        JSON.stringify({
          recommendedAgentAction: "CAUTION_HIGH_RISK",
          safetyVerdict: "CAUTION",
          riskScore: 55,
          summary: "Elevated sell tax (12%) detected.",
          riskFlags: ["HIGH_SELL_TAX"],
        }),
        { status: 200 },
      )) as unknown as typeof fetch;

    const permissive = new NullClearFirewall({
      strictCaution: false,
      fetchImpl: mockFetch,
    });
    const strict = new NullClearFirewall({
      strictCaution: true,
      fetchImpl: mockFetch,
    });

    const d1 = await permissive.guardTransaction({
      chain: "base",
      tokenAddress: "0x1111111111111111111111111111111111111111",
    });
    const d2 = await strict.guardTransaction({
      chain: "base",
      tokenAddress: "0x1111111111111111111111111111111111111111",
    });

    expect(d1.allowed).toBe(true);
    expect(d2.allowed).toBe(false);
  });

  it("fails closed when the upstream response omits recommendedAgentAction", async () => {
    const firewall = new NullClearFirewall({
      fetchImpl: (async () =>
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
        })) as unknown as typeof fetch,
    });

    await expect(
      firewall.guardTransaction({
        chain: "solana",
        tokenAddress: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
      }),
    ).rejects.toThrow(NullClearError);
  });

  it("constructs a Drop-In Guarded JSON-RPC URL with failMode and timeoutMs", () => {
    const firewall = new NullClearFirewall({
      apiKey: "nc_live_demo_pass_123",
    });

    const rpcUrl = firewall.getGuardedRpcUrl("base", {
      failMode: "closed",
      timeoutMs: 3500,
    });

    expect(rpcUrl).toBe(
      "https://api.nullclear.dev/rpc/base/nc_live_demo_pass_123?failMode=closed&timeoutMs=3500",
    );
  });
});
