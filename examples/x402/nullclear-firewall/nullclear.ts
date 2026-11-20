export const NULLCLEAR_CHAINS = [
  "base",
  "eth",
  "arbitrum",
  "optimism",
  "polygon",
  "bsc",
  "solana",
] as const;

export type NullClearChain = (typeof NULLCLEAR_CHAINS)[number];

export type NullClearRecommendedAction =
  | "EXECUTE_SAFE"
  | "CAUTION_HIGH_RISK"
  | "ABORT_CRITICAL_TRAP"
  | "ABORT_DRAINER_APPROVAL"
  | "ABORT_WILL_REVERT";

export interface NullClearGuardInput {
  chain: NullClearChain;
  from?: string;
  to?: string;
  tokenAddress?: string;
  data?: string;
  value?: string;
  rawTransactionBase64?: string;
  eip712TypedData?: Record<string, unknown>;
}

export interface NullClearTokenScanResult {
  chain: NullClearChain;
  address: string;
  name?: string | null;
  symbol?: string | null;
  isSafe: boolean;
  riskScore: number;
  safetyVerdict: string;
  recommendedAgentAction: NullClearRecommendedAction;
  buyTaxPercent?: number | null;
  sellTaxPercent?: number | null;
  liquidityUsd?: number | null;
  riskFlags: string[];
  summary?: string;
  [key: string]: unknown;
}

export interface NullClearGuardDecision {
  allowed: boolean;
  chain: NullClearChain;
  recommendedAgentAction: NullClearRecommendedAction;
  safetyVerdict: string;
  riskScore: number;
  summary: string;
  riskFlags: string[];
  raw: Record<string, unknown>;
}

export interface NullClearFirewallOptions {
  baseUrl?: string;
  apiKey?: string;
  /** If true, blocks CAUTION_HIGH_RISK in addition to all ABORT_* verdicts. Default: false (only blocks ABORT_*) */
  strictCaution?: boolean;
  fetchImpl?: typeof fetch;
}

export class NullClearError extends Error {
  public readonly status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "NullClearError";
    this.status = status;
  }
}

const VALID_ACTIONS = new Set<NullClearRecommendedAction>([
  "EXECUTE_SAFE",
  "CAUTION_HIGH_RISK",
  "ABORT_CRITICAL_TRAP",
  "ABORT_DRAINER_APPROVAL",
  "ABORT_WILL_REVERT",
]);

export class NullClearFirewall {
  public readonly baseUrl: string;
  public readonly apiKey?: string;
  public readonly strictCaution: boolean;
  private readonly fetchImpl: typeof fetch;

  constructor(options: NullClearFirewallOptions = {}) {
    this.baseUrl = (options.baseUrl || "https://api.nullclear.dev").replace(
      /\/+$/,
      "",
    );
    this.apiKey = options.apiKey?.trim() || undefined;
    this.strictCaution = Boolean(options.strictCaution);
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  public static fromEnv(
    env: Record<string, string | undefined> = process.env,
  ): NullClearFirewall {
    return new NullClearFirewall({
      baseUrl: env.NULLCLEAR_API_BASE_URL || "https://api.nullclear.dev",
      apiKey: env.NULLCLEAR_API_KEY,
      strictCaution: env.NULLCLEAR_STRICT_CAUTION === "true",
    });
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      accept: "application/json",
      "content-type": "application/json",
    };
    if (this.apiKey) {
      headers.authorization = `Bearer ${this.apiKey}`;
    }
    return headers;
  }

  /**
   * Build a Drop-In Guarded JSON-RPC URL (`https://api.nullclear.dev/rpc/:chain/:apiKey`)
   * for viem / ethers / Solana web3.js transports.
   * Reads pass through at 0 credits; broadcasts are screened via NullClear preflight.
   */
  public getGuardedRpcUrl(
    chain: NullClearChain = "base",
    options: { failMode?: "closed" | "open"; timeoutMs?: number } = {},
  ): string {
    if (!this.apiKey) {
      throw new NullClearError(
        "NULLCLEAR_API_KEY (nc_live_...) is required to construct a Guarded JSON-RPC URL. Mint one via POST https://api.nullclear.dev/v1/pass/buy.",
      );
    }
    const url = new URL(
      `${this.baseUrl}/rpc/${encodeURIComponent(chain)}/${encodeURIComponent(this.apiKey)}`,
    );
    if (options.failMode) {
      url.searchParams.set("failMode", options.failMode);
    }
    if (typeof options.timeoutMs === "number" && options.timeoutMs > 0) {
      url.searchParams.set("timeoutMs", String(options.timeoutMs));
    }
    return url.toString();
  }

  /**
   * Audit an on-chain token across Base, Ethereum, Arbitrum, Optimism, Polygon, BSC, or Solana.
   */
  public async scanToken(
    chain: NullClearChain,
    address: string,
  ): Promise<NullClearTokenScanResult> {
    const trimmed = address.trim();
    if (!trimmed) {
      throw new NullClearError("Token address is required.");
    }

    const res = await this.fetchImpl(
      `${this.baseUrl}/v1/scan/${encodeURIComponent(chain)}/${encodeURIComponent(trimmed)}`,
      {
        method: "GET",
        headers: this.buildHeaders(),
      },
    );

    if (res.status === 402) {
      throw new NullClearError(
        "NullClear free quota reached (HTTP 402). Provide NULLCLEAR_API_KEY (nc_live_...) or settle $0.005 USDC on Base via x402.",
        402,
      );
    }
    if (!res.ok) {
      throw new NullClearError(`NullClear scan failed with HTTP ${res.status}`, res.status);
    }

    return (await res.json()) as NullClearTokenScanResult;
  }

  /**
   * Execute a 1-call Pre-Sign Firewall check (`POST /v1/guard`) on calldata, EIP-712 typed data,
   * Solana wire transactions, or token addresses. Fails closed on malformed responses or ABORT_* verdicts.
   */
  public async guardTransaction(
    input: NullClearGuardInput,
  ): Promise<NullClearGuardDecision> {
    if (
      !input.tokenAddress &&
      !input.data &&
      !input.to &&
      !input.rawTransactionBase64 &&
      !input.eip712TypedData
    ) {
      throw new NullClearError(
        "guardTransaction requires at least one of tokenAddress, to, data, rawTransactionBase64, or eip712TypedData.",
      );
    }

    const res = await this.fetchImpl(`${this.baseUrl}/v1/guard`, {
      method: "POST",
      headers: this.buildHeaders(),
      body: JSON.stringify(input),
    });

    if (res.status === 402) {
      throw new NullClearError(
        "NullClear free quota reached (HTTP 402). Provide NULLCLEAR_API_KEY (nc_live_...) or settle via x402 at POST /v1/bazaar/guard.",
        402,
      );
    }
    if (!res.ok) {
      throw new NullClearError(
        `NullClear preflight guard failed with HTTP ${res.status}`,
        res.status,
      );
    }

    const body = (await res.json()) as Record<string, unknown>;
    const action = body.recommendedAgentAction as NullClearRecommendedAction;
    if (!VALID_ACTIONS.has(action)) {
      throw new NullClearError(
        "NullClear returned an unrecognized or missing recommendedAgentAction; failing closed.",
      );
    }

    const allowed =
      action === "EXECUTE_SAFE" ||
      (action === "CAUTION_HIGH_RISK" && !this.strictCaution);

    return {
      allowed,
      chain: input.chain,
      recommendedAgentAction: action,
      safetyVerdict:
        typeof body.safetyVerdict === "string" ? body.safetyVerdict : action,
      riskScore: typeof body.riskScore === "number" ? body.riskScore : 0,
      summary:
        typeof body.summary === "string"
          ? body.summary
          : `NullClear verdict: ${action}`,
      riskFlags: Array.isArray(body.riskFlags)
        ? body.riskFlags.map(String)
        : [],
      raw: body,
    };
  }
}
