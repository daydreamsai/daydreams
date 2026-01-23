import express, { type Express, type Request, type Response, type NextFunction } from "express";
import type { Server } from "http";
import cors from "cors";
import rateLimit from "express-rate-limit";
import type { X402ExtensionConfig, X402ServiceConfig } from "./types";
import { USDC_MINTS } from "./types";
import type { PaymentVerifier } from "./payment-verifier";
import { x402PaymentGate } from "./middleware";

/** Slugify an action name for use in URL paths. */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** x402 HTTP server. GET /api/services, POST /api/services/:slug, GET /api/health. */
export function createX402Server(
  config: X402ExtensionConfig,
  verifier: PaymentVerifier
): Express {
  const app = express();

  app.use(express.json({ limit: "100kb" }));

  const corsOrigins = config.cors;
  if (corsOrigins && corsOrigins.length > 0) {
    app.use(
      cors({
        origin: corsOrigins,
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
  }

  const generalLimit = rateLimit({
    windowMs: 60_000,
    max: config.rateLimits?.general ?? 60,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(generalLimit);

  const serviceMap = new Map<string, X402ServiceConfig>();
  for (const svc of config.services) {
    const slug = slugify(svc.action.name);
    serviceMap.set(slug, svc);
  }

  app.get("/api/services", (_req, res) => {
    const services = config.services.map((s) => {
      const slug = slugify(s.action.name);
      return {
        name: s.action.name,
        slug,
        description: s.description ?? s.action.description ?? "",
        priceUSDC: s.priceUSDC,
        qualityGuarantee: s.qualityGuarantee,
        disputeWindow: s.disputeWindow,
        endpoint: `/api/services/${slug}`,
      };
    });
    res.json({
      services,
      recipient: config.recipient,
      network: config.network ?? "mainnet-beta",
    });
  });

  for (const [slug, serviceConfig] of serviceMap) {
    const perServiceLimit = rateLimit({
      windowMs: 60_000,
      max: config.rateLimits?.perService ?? 10,
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => `${slug}:${req.ip}`,
    });

    const network = config.network ?? "mainnet-beta";
    const usdcMint = config.usdcMint ?? USDC_MINTS[network];

    app.post(
      `/api/services/${slug}`,
      perServiceLimit,
      x402PaymentGate(serviceConfig, verifier, config.recipient, usdcMint),
      async (req: Request, res: Response) => {
        if (serviceConfig.action.schema) {
          const parsed = serviceConfig.action.schema.safeParse(req.body);
          if (!parsed.success) {
            res.status(400).json({
              error: "invalid_request",
              details: parsed.error.issues,
            });
            return;
          }
        }

        const timeout = serviceConfig.timeout ?? 30_000;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeout);

        try {
          const result = await Promise.race([
            serviceConfig.action.handler(req.body, {} as any, {} as any),
            new Promise((_, reject) => {
              controller.signal.addEventListener("abort", () =>
                reject(new Error("Service execution timeout"))
              );
            }),
          ]);

          clearTimeout(timer);

          res.json({
            result,
            payment: {
              verified: true,
              payer: req.paymentProof?.payer,
              amountUSDC: req.paymentProof?.amountUSDC,
            },
            quality: {
              guarantee: serviceConfig.qualityGuarantee,
              disputeWindow: serviceConfig.disputeWindow,
            },
          });
        } catch (err) {
          clearTimeout(timer);
          const message = err instanceof Error ? err.message : "Unknown error";
          const status = message.includes("timeout") ? 504 : 500;
          res.status(status).json({
            error: status === 504 ? "service_timeout" : "service_error",
            message,
          });
        }
      }
    );
  }

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      protocol: "x402",
      version: "1.0.0",
      services: config.services.length,
      network: config.network ?? "mainnet-beta",
      uptime: process.uptime(),
    });
  });

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({
      error: "internal_error",
      message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
    });
  });

  return app;
}

/** Start the server. Returns app and server for shutdown. */
export function startX402Server(
  config: X402ExtensionConfig,
  verifier: PaymentVerifier
): Promise<{ app: Express; server: Server }> {
  const app = createX402Server(config, verifier);
  const port = config.port ?? 4020;

  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      resolve({ app, server });
    });
    server.on("error", reject);

    server.keepAliveTimeout = 65_000;
    server.headersTimeout = 66_000;
  });
}
