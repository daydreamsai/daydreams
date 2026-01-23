import express, { type Express } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import type { X402ExtensionConfig } from "./types";
import type { PaymentVerifier } from "./payment-verifier";
import { x402PaymentGate } from "./middleware";

/**
 * Creates an Express HTTP server implementing the x402 protocol.
 *
 * Endpoints:
 * - GET  /api/services         - Service discovery with pricing
 * - POST /api/services/:name   - Execute service (402 if unpaid)
 * - GET  /api/health           - Server health check
 */
export function createX402Server(
  config: X402ExtensionConfig,
  verifier: PaymentVerifier
): Express {
  const app = express();
  app.use(express.json());

  // CORS
  const corsOrigins = config.cors ?? ["*"];
  app.use(
    cors({
      origin: corsOrigins.includes("*") ? true : corsOrigins,
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "X-Payment", "Authorization"],
      exposedHeaders: [
        "X-Payment-Amount",
        "X-Payment-Address",
        "X-Payment-Network",
        "X-Quality-Guarantee",
        "X-Dispute-Window",
        "X-Service-Description",
        "X-Solana-Pay-URL",
      ],
    })
  );

  // Rate limiting
  const generalLimit = rateLimit({
    windowMs: 60_000,
    max: config.rateLimits?.general ?? 60,
    standardHeaders: true,
    legacyHeaders: false,
  });

  const serviceLimit = rateLimit({
    windowMs: 60_000,
    max: config.rateLimits?.perService ?? 10,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use(generalLimit);

  // Service discovery
  app.get("/api/services", (_req, res) => {
    const services = config.services.map((s) => ({
      name: s.action.name,
      description: s.description ?? s.action.description ?? "",
      priceUSDC: s.priceUSDC,
      qualityGuarantee: s.qualityGuarantee,
      disputeWindow: s.disputeWindow,
      endpoint: `/api/services/${s.action.name}`,
    }));
    res.json({ services, recipient: config.recipient, network: "solana-mainnet" });
  });

  // Service endpoints
  for (const serviceConfig of config.services) {
    app.post(
      `/api/services/${serviceConfig.action.name}`,
      serviceLimit,
      x402PaymentGate(serviceConfig, verifier, config.recipient),
      async (req, res) => {
        try {
          const result = await serviceConfig.action.handler(
            req.body,
            {} as any,
            {} as any
          );

          res.json({
            result,
            payment: {
              verified: true,
              payer: req.paymentProof?.payer,
              amount: req.paymentProof?.amount,
            },
            quality: {
              guarantee: serviceConfig.qualityGuarantee,
              disputeWindow: serviceConfig.disputeWindow,
            },
          });
        } catch (err) {
          res.status(500).json({
            error: "service_error",
            message: err instanceof Error ? err.message : "Unknown error",
          });
        }
      }
    );
  }

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      protocol: "x402",
      version: "1.0.0",
      services: config.services.length,
      network: "solana-mainnet",
      uptime: process.uptime(),
    });
  });

  return app;
}

/**
 * Start the x402 HTTP server.
 */
export function startX402Server(
  config: X402ExtensionConfig,
  verifier: PaymentVerifier
): Promise<Express> {
  const app = createX402Server(config, verifier);
  const port = config.port ?? 4020;

  return new Promise((resolve) => {
    app.listen(port, () => {
      console.log(`x402 server listening on port ${port}`);
      resolve(app);
    });
  });
}
