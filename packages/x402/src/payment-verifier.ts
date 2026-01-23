import { Connection, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { randomBytes } from "crypto";
import type { PaymentProof, PaymentValidation } from "./types";

/** Solana mainnet USDC mint. */
const USDC_MINT = new PublicKey(
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
);

const USDC_DECIMALS = 6;

/**
 * Manages Solana USDC payment verification with replay protection.
 */
export class PaymentVerifier {
  private connection: Connection;
  private recipient: PublicKey;
  private usedSignatures = new Map<string, number>();
  private cleanupTimer: ReturnType<typeof setInterval>;

  constructor(rpcUrl: string, recipient: string) {
    this.connection = new Connection(rpcUrl, "confirmed");
    this.recipient = new PublicKey(recipient);

    // Clean expired signatures every 60s
    this.cleanupTimer = setInterval(() => {
      const cutoff = Date.now() - 10 * 60 * 1000;
      for (const [sig, ts] of this.usedSignatures) {
        if (ts < cutoff) this.usedSignatures.delete(sig);
      }
    }, 60_000);
    this.cleanupTimer.unref();
  }

  /**
   * Verify a Solana USDC payment on-chain.
   *
   * Checks:
   * - Transaction exists and succeeded
   * - Not a replay (signature not already used)
   * - Recipient received >= expected amount
   * - Transaction is recent (within maxAgeSeconds)
   */
  async verify(
    signature: string,
    expectedAmountUSDC: number,
    maxAgeSeconds = 300
  ): Promise<PaymentValidation> {
    // Replay check
    if (this.usedSignatures.has(signature)) {
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

      // Age check
      const blockTime = tx.blockTime;
      if (blockTime) {
        const age = Date.now() / 1000 - blockTime;
        if (age > maxAgeSeconds) {
          return { valid: false, error: "transaction_too_old" };
        }
      }

      // Find USDC transfer to recipient
      const recipientAta = await getAssociatedTokenAddress(
        USDC_MINT,
        this.recipient
      );
      const recipientAtaStr = recipientAta.toBase58();

      const preBalances = tx.meta?.preTokenBalances ?? [];
      const postBalances = tx.meta?.postTokenBalances ?? [];

      // Find recipient's token account balance change
      const preBal = preBalances.find(
        (b) =>
          b.mint === USDC_MINT.toBase58() &&
          b.owner === this.recipient.toBase58()
      );
      const postBal = postBalances.find(
        (b) =>
          b.mint === USDC_MINT.toBase58() &&
          b.owner === this.recipient.toBase58()
      );

      const preAmount = preBal?.uiTokenAmount?.uiAmount ?? 0;
      const postAmount = postBal?.uiTokenAmount?.uiAmount ?? 0;
      const received = postAmount - preAmount;

      if (received < expectedAmountUSDC) {
        return {
          valid: false,
          error: `insufficient_amount: received ${received} USDC, expected ${expectedAmountUSDC}`,
        };
      }

      // Find payer from account keys
      const payer =
        tx.transaction.message.accountKeys[0]?.pubkey?.toBase58() ?? "unknown";

      // Mark as used
      this.usedSignatures.set(signature, Date.now());

      const proof: PaymentProof = {
        signature,
        payer,
        amount: received,
        timestamp: blockTime ?? Math.floor(Date.now() / 1000),
      };

      return { valid: true, proof };
    } catch (err) {
      return {
        valid: false,
        error: `verification_error: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  /**
   * Generate a cryptographically random payment reference.
   * Used to link a Solana Pay request to a specific service call.
   */
  static generateReference(): string {
    return randomBytes(32).toString("base64url");
  }

  /**
   * Build a Solana Pay URL for client-side payment.
   */
  static buildSolanaPayUrl(
    recipient: string,
    amountUSDC: number,
    reference?: string,
    label?: string,
    message?: string
  ): string {
    const params = new URLSearchParams();
    params.set("amount", amountUSDC.toString());
    params.set("spl-token", USDC_MINT.toBase58());
    if (reference) params.set("reference", reference);
    if (label) params.set("label", label);
    if (message) params.set("message", message);
    return `solana:${recipient}?${params.toString()}`;
  }

  /** Cleanup resources. */
  destroy() {
    clearInterval(this.cleanupTimer);
    this.usedSignatures.clear();
  }
}
