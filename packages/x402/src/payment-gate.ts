import { action } from "@daydreamsai/core";
import { z } from "zod";
import type { X402ServiceConfig } from "./types";
import type { PaymentVerifier } from "./payment-verifier";

/**
 * Wraps a Daydreams action with x402 payment verification.
 *
 * The wrapped action requires a `paymentSignature` field in addition
 * to the original action's schema. Payment is verified on-chain before
 * the original handler executes.
 *
 * Usage:
 * ```typescript
 * const gatedAction = createPaymentGatedAction(serviceConfig, verifier);
 * // Now gatedAction requires payment before execution
 * ```
 */
export function createPaymentGatedAction(
  config: X402ServiceConfig,
  verifier: PaymentVerifier
) {
  const originalSchema = config.action.schema;

  // Extend original schema with payment signature
  const gatedSchema = originalSchema
    ? z.object({
        ...(originalSchema as z.ZodObject<any>).shape,
        paymentSignature: z
          .string()
          .describe("Solana transaction signature proving USDC payment"),
      })
    : z.object({
        paymentSignature: z
          .string()
          .describe("Solana transaction signature proving USDC payment"),
      });

  return action({
    name: config.action.name,
    description: `[x402 gated: ${config.priceUSDC} USDC] ${config.action.description ?? config.description ?? ""}`,
    schema: gatedSchema,

    handler: async (data: any, ctx: any, agent: any) => {
      const { paymentSignature, ...actionData } = data;

      // Verify payment on-chain
      const validation = await verifier.verify(
        paymentSignature,
        config.priceUSDC
      );

      if (!validation.valid) {
        return {
          error: "payment_invalid",
          details: validation.error,
          required: {
            amount: config.priceUSDC,
            currency: "USDC",
            network: "solana-mainnet",
          },
        };
      }

      // Payment verified - execute original action
      const result = await config.action.handler(actionData, ctx, agent);

      return {
        result,
        payment: {
          verified: true,
          signature: validation.proof!.signature,
          payer: validation.proof!.payer,
          amount: validation.proof!.amount,
        },
        quality: {
          guarantee: config.qualityGuarantee,
          disputeWindow: config.disputeWindow,
        },
      };
    },
  });
}
