import type { Request, Response, NextFunction } from "express";
import { PaymentVerifier } from "./payment-verifier";
import type { X402ServiceConfig, PaymentProof, ServiceStats } from "./types";

declare global {
  namespace Express {
    interface Request {
      paymentProof?: PaymentProof;
      serviceConfig?: ServiceStats;
    }
  }
}

/**
 * Express middleware implementing the x402 payment protocol.
 *
 * If the request has no X-Payment header, responds with 402 and
 * payment instructions (Solana Pay URL, amount, quality guarantee).
 *
 * If the header is present, verifies the Solana transaction on-chain
 * and attaches the proof to the request.
 */
export function x402PaymentGate(
  serviceConfig: X402ServiceConfig,
  verifier: PaymentVerifier,
  recipient: string
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const paymentHeader = req.headers["x-payment"] as string | undefined;

    if (!paymentHeader) {
      // No payment - respond with 402 and payment instructions
      const reference = PaymentVerifier.generateReference();
      const solanaPayUrl = PaymentVerifier.buildSolanaPayUrl(
        recipient,
        serviceConfig.priceUSDC,
        reference,
        serviceConfig.action.name,
        serviceConfig.description ?? serviceConfig.action.description
      );

      res.set("x-payment-amount", serviceConfig.priceUSDC.toString());
      res.set("x-payment-address", recipient);
      res.set("x-payment-network", "solana-mainnet");
      res.set("x-quality-guarantee", serviceConfig.qualityGuarantee.toString());
      res.set("x-dispute-window", serviceConfig.disputeWindow.toString());
      res.set("x-service-description", serviceConfig.description ?? serviceConfig.action.description ?? "");
      res.set("x-solana-pay-url", solanaPayUrl);
      res.status(402).json({
        error: "payment_required",
        service: serviceConfig.action.name,
        price: serviceConfig.priceUSDC,
        currency: "USDC",
        network: "solana-mainnet",
        recipient,
        solanaPayUrl,
        qualityGuarantee: serviceConfig.qualityGuarantee,
        disputeWindow: serviceConfig.disputeWindow,
      });
      return;
    }

    // Verify payment on-chain
    const validation = await verifier.verify(
      paymentHeader,
      serviceConfig.priceUSDC
    );

    if (!validation.valid) {
      res.status(402).json({
        error: "payment_invalid",
        details: validation.error,
        service: serviceConfig.action.name,
        price: serviceConfig.priceUSDC,
      });
      return;
    }

    // Attach proof and continue
    req.paymentProof = validation.proof;
    req.serviceConfig = {
      name: serviceConfig.action.name,
      priceUSDC: serviceConfig.priceUSDC,
      qualityGuarantee: serviceConfig.qualityGuarantee,
      disputeWindow: serviceConfig.disputeWindow,
      description: serviceConfig.description ?? serviceConfig.action.description ?? "",
      requestCount: 0,
      revenue: 0,
    };

    next();
  };
}
