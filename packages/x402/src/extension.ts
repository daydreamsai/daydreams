import { extension, service } from "@daydreamsai/core";
import type { Server } from "http";
import type { X402ExtensionConfig } from "./types";
import { PaymentVerifier, InMemorySignatureStore } from "./payment-verifier";
import { createReputationContext } from "./reputation";
import { createPaymentGatedAction } from "./payment-gate";
import { startX402Server } from "./server";

/**
 * Gate agent actions behind Solana USDC payments via HTTP 402.
 *
 * ```typescript
 * const x402 = createX402Extension({
 *   recipient: "YOUR_SOLANA_ADDRESS",
 *   services: [{ action: myAction, priceUSDC: 0.05, qualityGuarantee: 0.85, disputeWindow: 3600 }],
 * });
 * createDreams({ extensions: [x402] }).start();
 * ```
 */
export function createX402Extension(config: X402ExtensionConfig) {
  const network = config.network ?? "mainnet-beta";

  const signatureStore = config.signatureStore ?? new InMemorySignatureStore();

  // Shared across HTTP middleware and gated actions for consistent replay protection
  const verifier = new PaymentVerifier({
    rpcUrl: config.rpcUrl,
    network,
    recipient: config.recipient,
    usdcMint: config.usdcMint,
    signatureStore,
    maxAgeSeconds: config.maxPaymentAge,
  });

  const x402Service = service({
    register(container) {
      container.singleton("x402:verifier", () => verifier);
    },

    async boot(container) {
      const { server } = await startX402Server(config, verifier);
      container.singleton("x402:server", () => server);
    },

    async stop(container) {
      verifier.destroy();

      try {
        const server = container.resolve<Server>("x402:server");
        await new Promise<void>((resolve, reject) => {
          server.close((err) => (err ? reject(err) : resolve()));
        });
      } catch {
        // boot may not have completed
      }
    },
  });

  const reputationContext = createReputationContext(
    config.services,
    config.maxCustomers,
    config.tierThresholds
  );

  const gatedActions = config.services.map((svc) =>
    createPaymentGatedAction(svc, verifier)
  );

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
