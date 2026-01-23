import type { Action } from "@daydreamsai/core";

/** Persistent replay protection. Must survive restarts. */
export interface SignatureStore {
  /** Check if a signature has been used. */
  has(signature: string): Promise<boolean>;
  /** Mark a signature as used. Returns false if already existed. */
  add(signature: string, timestamp: number): Promise<boolean>;
  /** Remove signatures older than cutoffMs. */
  cleanup(cutoffMs: number): Promise<void>;
}

export type SolanaNetwork = "mainnet-beta" | "devnet" | "testnet";

/** Known USDC mint addresses per network. */
export const USDC_MINTS: Record<SolanaNetwork, string> = {
  "mainnet-beta": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  devnet: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  testnet: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
};

/** Default RPC URLs per network. */
export const DEFAULT_RPC_URLS: Record<SolanaNetwork, string> = {
  "mainnet-beta": "https://api.mainnet-beta.solana.com",
  devnet: "https://api.devnet.solana.com",
  testnet: "https://api.testnet.solana.com",
};

export interface X402ServiceConfig {
  /** The Daydreams action to gate behind payment. */
  action: Action<any, any, any, any, any, any>;
  /** Price in USDC to execute this action. */
  priceUSDC: number;
  /** Quality guarantee threshold (0-1). Clients can dispute below this. */
  qualityGuarantee: number;
  /** Dispute window in seconds. */
  disputeWindow: number;
  /** Human-readable service description. */
  description?: string;
  /** Request timeout in ms. Default: 30000. */
  timeout?: number;
}

export interface X402ExtensionConfig {
  /** Solana recipient address for payments. */
  recipient: string;
  /** Solana network. Default: mainnet-beta. */
  network?: SolanaNetwork;
  /** Solana RPC URL. Overrides network default if provided. */
  rpcUrl?: string;
  /** USDC mint address. Overrides network default if provided. */
  usdcMint?: string;
  /** Services to gate behind x402 payments. */
  services: X402ServiceConfig[];
  /** HTTP server port. Default: 4020. */
  port?: number;
  /** CORS allowed origins. Required for production - no wildcard default. */
  cors?: string[];
  /** Max tracked customers before LRU eviction. Default: 500. */
  maxCustomers?: number;
  /** Tier thresholds based on total USDC spend. */
  tierThresholds?: TierThresholds;
  /** Rate limits (requests per minute). */
  rateLimits?: {
    general?: number;
    perService?: number;
  };
  /** Custom signature store for persistent replay protection. */
  signatureStore?: SignatureStore;
  /** Max payment age in seconds. Default: 300. */
  maxPaymentAge?: number;
}

export interface TierThresholds {
  regular: number;
  trusted: number;
  premium: number;
}

export interface PaymentProof {
  /** Solana transaction signature. */
  signature: string;
  /** Payer's public key. */
  payer: string;
  /** Verified USDC amount (in raw token units, not float). */
  amount: bigint;
  /** Verified USDC amount as human-readable number. */
  amountUSDC: number;
  /** Block timestamp. */
  timestamp: number;
}

export interface PaymentValidation {
  valid: boolean;
  error?: string;
  proof?: PaymentProof;
}

export type ReputationTier = "new" | "regular" | "trusted" | "premium";

export interface CustomerRecord {
  userId: string;
  username: string;
  totalSpent: number;
  requestCount: number;
  lastRequest: number;
  disputeCount: number;
  tier: ReputationTier;
}

export interface ServiceStats {
  name: string;
  priceUSDC: number;
  qualityGuarantee: number;
  disputeWindow: number;
  description: string;
  requestCount: number;
  revenue: number;
}

/** Aggregate proof of service quality without revealing customer data. */
export interface ReputationCommitment {
  /** SHA-256 hash of service record. */
  commitment: string;
  /** Timestamp of generation. */
  timestamp: number;
  /** Number of services in commitment. */
  serviceCount: number;
  /** Weighted quality score across services (0-1). */
  aggregateQuality: number;
  /** Total fulfilled requests backing this proof. */
  totalFulfilled: number;
}

export interface ReputationMemory {
  services: ServiceStats[];
  customers: CustomerRecord[];
  revenue: {
    today: number;
    total: number;
    lastReset: string;
  };
  commitments: ReputationCommitment[];
}
