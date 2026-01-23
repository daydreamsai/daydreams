import { Connection, PublicKey } from "@solana/web3.js";
import { randomBytes } from "crypto";
import type {
  PaymentProof,
  PaymentValidation,
  SignatureStore,
  SolanaNetwork,
} from "./types";
import { USDC_MINTS, DEFAULT_RPC_URLS } from "./types";

const USDC_DECIMALS = 6;

const BASE58_CHARS = /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/;

/** In-memory signature store. Use Redis/SQLite for multi-instance deployments. */
export class InMemorySignatureStore implements SignatureStore {
  private signatures = new Map<string, number>();

  async has(signature: string): Promise<boolean> {
    return this.signatures.has(signature);
  }

  async add(signature: string, timestamp: number): Promise<boolean> {
    if (this.signatures.has(signature)) return false;
    this.signatures.set(signature, timestamp);
    return true;
  }

  async cleanup(cutoffMs: number): Promise<void> {
    const cutoff = Date.now() - cutoffMs;
    for (const [sig, ts] of this.signatures) {
      if (ts < cutoff) this.signatures.delete(sig);
    }
  }
}

/** Solana signatures are 64 bytes, 86-88 base58 chars. */
function isValidSignature(signature: string): boolean {
  return (
    signature.length >= 86 &&
    signature.length <= 88 &&
    BASE58_CHARS.test(signature)
  );
}

/** Validates a Solana public key. */
function isValidPublicKey(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/** Solana USDC payment verification with replay protection. */
export class PaymentVerifier {
  private connection: Connection;
  private recipient: PublicKey;
  private usdcMint: PublicKey;
  private store: SignatureStore;
  private maxAgeSeconds: number;
  private cleanupTimer: ReturnType<typeof setInterval>;

  constructor(config: {
    rpcUrl?: string;
    network?: SolanaNetwork;
    recipient: string;
    usdcMint?: string;
    signatureStore?: SignatureStore;
    maxAgeSeconds?: number;
  }) {
    const network = config.network ?? "mainnet-beta";
    const rpcUrl = config.rpcUrl ?? DEFAULT_RPC_URLS[network];
    const mintAddress = config.usdcMint ?? USDC_MINTS[network];

    if (!isValidPublicKey(config.recipient)) {
      throw new Error(`Invalid recipient address: ${config.recipient}`);
    }
    if (!isValidPublicKey(mintAddress)) {
      throw new Error(`Invalid USDC mint address: ${mintAddress}`);
    }

    this.connection = new Connection(rpcUrl, "confirmed");
    this.recipient = new PublicKey(config.recipient);
    this.usdcMint = new PublicKey(mintAddress);
    this.store = config.signatureStore ?? new InMemorySignatureStore();
    this.maxAgeSeconds = config.maxAgeSeconds ?? 300;

    // Periodic cleanup of expired signatures (10-minute TTL)
    this.cleanupTimer = setInterval(() => {
      this.store.cleanup(10 * 60 * 1000).catch(() => {});
    }, 60_000);
    this.cleanupTimer.unref();
  }

  /** Verify payment on-chain. Checks format, replay, success, age, and amount. */
  async verify(
    signature: string,
    expectedAmountUSDC: number
  ): Promise<PaymentValidation> {
    if (!isValidSignature(signature)) {
      return { valid: false, error: "invalid_signature_format" };
    }

    // Check for replay before hitting RPC
    const alreadyUsed = await this.store.has(signature);
    if (alreadyUsed) {
      return { valid: false, error: "signature_already_used" };
    }

    try {
      const tx = await this.connection.getParsedTransaction(signature, {
        maxSupportedTransactionVersion: 0,
      });

      if (!tx) {
        return { valid: false, error: "transaction_not_found" };
      }

      if (tx.meta?.err) {
        return { valid: false, error: "transaction_failed" };
      }

      const blockTime = tx.blockTime;
      if (!blockTime) {
        return { valid: false, error: "transaction_not_finalized" };
      }

      const age = Math.floor(Date.now() / 1000) - blockTime;
      if (age > this.maxAgeSeconds) {
        return { valid: false, error: "transaction_too_old" };
      }

      // Compare in raw token units to avoid float precision issues
      const expectedRaw = BigInt(Math.round(expectedAmountUSDC * 10 ** USDC_DECIMALS));

      const preBalances = tx.meta?.preTokenBalances ?? [];
      const postBalances = tx.meta?.postTokenBalances ?? [];

      const mintStr = this.usdcMint.toBase58();
      const recipientStr = this.recipient.toBase58();

      const preBal = preBalances.find(
        (b) => b.mint === mintStr && b.owner === recipientStr
      );
      const postBal = postBalances.find(
        (b) => b.mint === mintStr && b.owner === recipientStr
      );

      const preRaw = BigInt(preBal?.uiTokenAmount?.amount ?? "0");
      const postRaw = BigInt(postBal?.uiTokenAmount?.amount ?? "0");
      const receivedRaw = postRaw - preRaw;

      if (receivedRaw < expectedRaw) {
        const receivedUSDC = Number(receivedRaw) / 10 ** USDC_DECIMALS;
        return {
          valid: false,
          error: `insufficient_amount: received ${receivedUSDC} USDC, expected ${expectedAmountUSDC}`,
        };
      }

      // Claim after all checks pass — no phantom claims on RPC failures
      const claimed = await this.store.add(signature, Date.now());
      if (!claimed) {
        return { valid: false, error: "signature_already_used" };
      }

      const payer =
        tx.transaction.message.accountKeys[0]?.pubkey?.toBase58() ?? "unknown";

      const proof: PaymentProof = {
        signature,
        payer,
        amount: receivedRaw,
        amountUSDC: Number(receivedRaw) / 10 ** USDC_DECIMALS,
        timestamp: blockTime,
      };

      return { valid: true, proof };
    } catch (err) {
      return {
        valid: false,
        error: `verification_error: ${err instanceof Error ? err.message : "unknown"}`,
      };
    }
  }

  /** Random payment reference for Solana Pay. */
  static generateReference(): string {
    return randomBytes(32).toString("base64url");
  }

  /** Build a Solana Pay URL. */
  static buildSolanaPayUrl(
    recipient: string,
    amountUSDC: number,
    usdcMint: string,
    reference?: string,
    label?: string,
    message?: string
  ): string {
    const params = new URLSearchParams();
    params.set("amount", amountUSDC.toString());
    params.set("spl-token", usdcMint);
    if (reference) params.set("reference", reference);
    if (label) params.set("label", label);
    if (message) params.set("message", message);
    return `solana:${recipient}?${params.toString()}`;
  }

  /** Cleanup resources. */
  destroy() {
    clearInterval(this.cleanupTimer);
  }
}
