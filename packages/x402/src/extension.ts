import { extension, service } from "@daydreamsai/core";
import type { X402ExtensionConfig } from "./types";
import { PaymentVerifier } from "./payment-verifier";
import { createReputationContext } from "./reputation";
import { createPaymentGatedAction } from "./payment-gate";
import { startX402Server } from "./server";

const DEFAULT_RPC = "https://api.mainnet-beta.solana.com";

/**
 * Creates a Daydreams extension that gates agent actions behind
 * x402 Solana USDC payments.
 *
 * Features:
 * - On-chain payment verification with replay protection
 * - HTTP server with x402 protocol (402 responses with Solana Pay URLs)
 * - Reputation tracking: customer tiers, quality guarantees, commitments
 * - Service discovery endpoint for clients
 *
 * Usage:
 * ```typescript
 * import { createX402Extension } from "@daydreamsai/x402";
 * import { action, createDreams } from "@daydreamsai/core";
 *
 * const myAction = action({
 *   name: "analyze",
 *   schema: z.object({ query: z.string() }),
 *   handler: async (data) => ({ result: `Analysis of ${data.query}` }),
 * });
 *
 * const x402 = createX402Extension({
 *   recipient: "YOUR_SOLANA_ADDRESS",
 *   services: [{
 *     action: myAction,
 *     priceUSDC: 0.05,
 *     qualityGuarantee: 0.85,
 *     disputeWindow: 3600,
 *   }],
 * });
 *
 * createDreams({
 *   extensions: [x402],
 *   // ...
 * }).start();
 * ```
 */
export function createX402Extension(config: X402ExtensionConfig) {
  const rpcUrl = config.rpcUrl ?? DEFAULT_RPC;

  const x402Service = service({
    register(container) {
      container.singleton(
        "x402:verifier",
        () => new PaymentVerifier(rpcUrl, config.recipient)
      );
    },

    async boot(container) {
      const verifier = container.resolve<PaymentVerifier>("x402:verifier");
      await startX402Server(config, verifier);
    },

    async stop(container) {
      const verifier = container.resolve<PaymentVerifier>("x402:verifier");
      verifier.destroy();
    },
  });

  const reputationContext = createReputationContext(
    config.services,
    config.maxCustomers,
    config.tierThresholds
  );

  // Create payment-gated versions of all configured actions
  // These require a paymentSignature field and verify on-chain before executing
  const gatedActions = config.services.map((svc) => {
    // The verifier is resolved at runtime via container,
    // but for the action wrapper we create a lazy proxy
    let verifierInstance: PaymentVerifier | null = null;

    const lazyVerifier = new Proxy({} as PaymentVerifier, {
      get(_target, prop) {
        if (!verifierInstance) {
          // Fallback: create verifier directly
          // In practice, the service boot will have already created it
          verifierInstance = new PaymentVerifier(rpcUrl, config.recipient);
        }
        return (verifierInstance as any)[prop];
      },
    });

    return createPaymentGatedAction(svc, lazyVerifier);
  });

  return extension({
    name: "x402",
    services: [x402Service],
    contexts: {
      reputation: reputationContext,
    },
    actions: gatedActions,
    inputs: {},
  });
}
