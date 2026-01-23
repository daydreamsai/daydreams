import type { Action } from "@daydreamsai/core";

/**
 * Configuration for a payment-gated service.
 */
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
}

/**
 * Top-level extension configuration.
 */
export interface X402ExtensionConfig {
  /** Solana recipient address for payments. */
  recipient: string;
  /** Solana RPC URL. Defaults to mainnet-beta. */
  rpcUrl?: string;
  /** Services to gate behind x402 payments. */
  services: X402ServiceConfig[];
  /** HTTP server port. Default: 4020. */
  port?: number;
  /** CORS allowed origins. */
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
}

export interface TierThresholds {
  regular: number;
  trusted: number;
  premium: number;
}

/**
 * Proof of a verified on-chain payment.
 */
export interface PaymentProof {
  /** Solana transaction signature. */
  signature: string;
  /** Payer's public key. */
  payer: string;
  /** Verified USDC amount. */
  amount: number;
  /** Block timestamp. */
  timestamp: number;
}

/**
 * Result of payment validation.
 */
export interface PaymentValidation {
  valid: boolean;
  error?: string;
  proof?: PaymentProof;
}

/**
 * Customer reputation tier.
 */
export type ReputationTier = "new" | "regular" | "trusted" | "premium";

/**
 * Customer record for reputation tracking.
 */
export interface CustomerRecord {
  userId: string;
  username: string;
  totalSpent: number;
  requestCount: number;
  lastRequest: number;
  disputeCount: number;
  tier: ReputationTier;
}

/**
 * Service runtime stats.
 */
export interface ServiceStats {
  name: string;
  priceUSDC: number;
  qualityGuarantee: number;
  disputeWindow: number;
  description: string;
  requestCount: number;
  revenue: number;
}

/**
 * Hash-based proof of service quality.
 * Proves aggregate track record without revealing customer data.
 */
export interface ReputationCommitment {
  /** Deterministic hash of service record. */
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

/**
 * Persistent reputation state.
 */
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

/**
 * x402 response headers per the protocol spec.
 */
export interface X402Headers {
  "x-payment-amount": string;
  "x-payment-address": string;
  "x-payment-network": string;
  "x-quality-guarantee": string;
  "x-dispute-window": string;
  "x-service-description": string;
  "x-solana-pay-url": string;
}
