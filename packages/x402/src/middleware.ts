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

/** x402 payment gate middleware. Returns 402 with payment instructions or verifies X-Payment header. */
export function x402PaymentGate(
  serviceConfig: X402ServiceConfig,
  verifier: PaymentVerifier,
  recipient: string,
  usdcMint: string
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const paymentHeader = req.headers["x-payment"] as string | undefined;

    if (!paymentHeader) {
      const reference = PaymentVerifier.generateReference();
      const solanaPayUrl = PaymentVerifier.buildSolanaPayUrl(
        recipient,
        serviceConfig.priceUSDC,
        usdcMint,
        reference,
        serviceConfig.action.name,
        serviceConfig.description ?? serviceConfig.action.description
      );

      res.set("x-payment-amount", serviceConfig.priceUSDC.toString());
      res.set("x-payment-address", recipient);
      res.set("x-payment-network", "solana");
      res.set("x-payment-mint", usdcMint);
      res.set("x-quality-guarantee", serviceConfig.qualityGuarantee.toString());
      res.set("x-dispute-window", serviceConfig.disputeWindow.toString());
      res.set("x-service-description", serviceConfig.description ?? serviceConfig.action.description ?? "");
      res.set("x-solana-pay-url", solanaPayUrl);
      res.status(402).json({
        error: "payment_required",
        service: serviceConfig.action.name,
        price: serviceConfig.priceUSDC,
        currency: "USDC",
        network: "solana",
        mint: usdcMint,
        recipient,
        solanaPayUrl,
        qualityGuarantee: serviceConfig.qualityGuarantee,
        disputeWindow: serviceConfig.disputeWindow,
      });
      return;
    }

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
