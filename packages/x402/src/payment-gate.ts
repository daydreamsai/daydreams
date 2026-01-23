import { action } from "@daydreamsai/core";
import { z } from "zod";
import type { X402ServiceConfig } from "./types";
import type { PaymentVerifier } from "./payment-verifier";

/** Wraps an action with payment verification. Adds paymentSignature field to schema. */
export function createPaymentGatedAction(
  config: X402ServiceConfig,
  verifier: PaymentVerifier
) {
  const originalSchema = config.action.schema;

  // ActionSchema requires ZodObject. For non-ZodObject schemas, use passthrough
  // and validate the original schema in the handler instead.
  let gatedSchema: z.ZodObject<any>;
  let needsManualValidation = false;

  if (!originalSchema) {
    gatedSchema = z.object({
      paymentSignature: z
        .string()
        .min(86)
        .max(88)
        .describe("Solana transaction signature proving USDC payment"),
    });
  } else if (originalSchema instanceof z.ZodObject) {
    gatedSchema = originalSchema.extend({
      paymentSignature: z
        .string()
        .min(86)
        .max(88)
        .describe("Solana transaction signature proving USDC payment"),
    });
  } else {
    gatedSchema = z
      .object({
        paymentSignature: z
          .string()
          .min(86)
          .max(88)
          .describe("Solana transaction signature proving USDC payment"),
      })
      .passthrough();
    needsManualValidation = true;
  }

  return action({
    name: config.action.name,
    description: `[x402: ${config.priceUSDC} USDC] ${config.action.description ?? config.description ?? ""}`,
    schema: gatedSchema,

    handler: async (data: any, ctx: any, agent: any) => {
      const { paymentSignature, ...actionData } = data;

      if (needsManualValidation && originalSchema) {
        const parsed = (originalSchema as z.ZodType).safeParse(actionData);
        if (!parsed.success) {
          return {
            error: "validation_error",
            details: parsed.error.issues,
          };
        }
      }

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
            network: "solana",
          },
        };
      }

      const result = await config.action.handler(actionData, ctx, agent);

      return {
        result,
        payment: {
          verified: true,
          signature: validation.proof!.signature,
          payer: validation.proof!.payer,
          amountUSDC: validation.proof!.amountUSDC,
        },
        quality: {
          guarantee: config.qualityGuarantee,
          disputeWindow: config.disputeWindow,
        },
      };
    },
  });
}
