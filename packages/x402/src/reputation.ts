import { context, action } from "@daydreamsai/core";
import { z } from "zod";
import type {
  ReputationMemory,
  ReputationTier,
  CustomerRecord,
  ReputationCommitment,
  ServiceStats,
  TierThresholds,
  X402ServiceConfig,
} from "./types";

const DEFAULT_TIER_THRESHOLDS: TierThresholds = {
  regular: 1.0,
  trusted: 10.0,
  premium: 50.0,
};

function computeTier(
  customer: Pick<CustomerRecord, "totalSpent" | "disputeCount" | "requestCount">,
  thresholds: TierThresholds
): ReputationTier {
  const disputeRatio =
    customer.requestCount > 0
      ? customer.disputeCount / customer.requestCount
      : 0;

  if (disputeRatio > 0.1) return "new";
  if (customer.totalSpent >= thresholds.premium) return "premium";
  if (customer.totalSpent >= thresholds.trusted) return "trusted";
  if (customer.totalSpent >= thresholds.regular) return "regular";
  return "new";
}

function generateCommitmentHash(
  services: ServiceStats[]
): ReputationCommitment {
  const totalFulfilled = services.reduce((s, svc) => s + svc.requestCount, 0);
  const weightedQuality = services.reduce(
    (s, svc) => s + svc.qualityGuarantee * svc.requestCount,
    0
  );
  const aggregateQuality =
    totalFulfilled > 0 ? weightedQuality / totalFulfilled : 0;

  // Deterministic hash from service stats
  // Production: replace with Poseidon hash or ZK circuit
  const payload = services
    .map((s) => `${s.name}:${s.requestCount}:${s.qualityGuarantee}:${s.revenue}`)
    .join("|");
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }

  return {
    commitment: Math.abs(hash).toString(16).padStart(8, "0"),
    timestamp: Date.now(),
    serviceCount: services.length,
    aggregateQuality: Math.round(aggregateQuality * 1000) / 1000,
    totalFulfilled,
  };
}

/**
 * Creates the reputation context for tracking service quality,
 * customer tiers, and generating reputation commitments.
 */
export function createReputationContext(
  services: X402ServiceConfig[],
  maxCustomers = 500,
  tierThresholds = DEFAULT_TIER_THRESHOLDS
) {
  const initialServices: ServiceStats[] = services.map((s) => ({
    name: s.action.name,
    priceUSDC: s.priceUSDC,
    qualityGuarantee: s.qualityGuarantee,
    disputeWindow: s.disputeWindow,
    description: s.description ?? s.action.description ?? "",
    requestCount: 0,
    revenue: 0,
  }));

  return context({
    type: "x402-reputation",
    schema: z.object({ agentId: z.string() }),
    key: (args) => `x402:reputation:${args.agentId}`,

    create: () => ({
      services: initialServices.map((s) => ({ ...s })),
      customers: [] as CustomerRecord[],
      revenue: { today: 0, total: 0, lastReset: new Date().toISOString().slice(0, 10) },
      commitments: [] as ReputationCommitment[],
    }),

    description: (state) => {
      const mem = state.memory as ReputationMemory;
      const totalRequests = mem.services.reduce((s, svc) => s + svc.requestCount, 0);
      return [
        `x402 Services: ${mem.services.length} | Requests: ${totalRequests}`,
        `Revenue: $${mem.revenue.total.toFixed(2)} (today: $${mem.revenue.today.toFixed(2)})`,
        `Customers: ${mem.customers.length} | Commitments: ${mem.commitments.length}`,
      ];
    },
  }).setActions([
    action({
      name: "x402:recordPayment",
      description: "Record a verified x402 payment",
      schema: z.object({
        serviceName: z.string(),
        userId: z.string(),
        username: z.string(),
        amountUSDC: z.number(),
      }),
      handler: async (data, ctx) => {
        const mem = ctx.memory as ReputationMemory;
        const { serviceName, userId, username, amountUSDC } = data;

        const service = mem.services.find((s) => s.name === serviceName);
        if (service) {
          service.requestCount++;
          service.revenue += amountUSDC;
        }

        let customer = mem.customers.find((c) => c.userId === userId);
        if (!customer) {
          customer = {
            userId, username, totalSpent: 0,
            requestCount: 0, lastRequest: Date.now(),
            disputeCount: 0, tier: "new",
          };
          mem.customers.push(customer);
          if (mem.customers.length > maxCustomers) {
            mem.customers.sort((a, b) => b.lastRequest - a.lastRequest);
            mem.customers = mem.customers.slice(0, maxCustomers);
          }
        }

        customer.totalSpent += amountUSDC;
        customer.requestCount++;
        customer.lastRequest = Date.now();
        customer.tier = computeTier(customer, tierThresholds);

        const today = new Date().toISOString().slice(0, 10);
        if (mem.revenue.lastReset !== today) {
          mem.revenue.today = 0;
          mem.revenue.lastReset = today;
        }
        mem.revenue.today += amountUSDC;
        mem.revenue.total += amountUSDC;

        return {
          revenue: mem.revenue.total,
          customerTier: customer.tier,
          serviceRequests: service?.requestCount,
        };
      },
    }),

    action({
      name: "x402:recordDispute",
      description: "Record a quality dispute",
      schema: z.object({
        userId: z.string(),
        serviceName: z.string(),
        reason: z.string(),
      }),
      handler: async (data, ctx) => {
        const mem = ctx.memory as ReputationMemory;
        const customer = mem.customers.find((c) => c.userId === data.userId);
        if (customer) {
          customer.disputeCount++;
          customer.tier = computeTier(customer, tierThresholds);
        }
        return { recorded: true, disputeCount: customer?.disputeCount };
      },
    }),

    action({
      name: "x402:getCustomerTier",
      description: "Get reputation tier for a customer",
      schema: z.object({ userId: z.string() }),
      handler: async (data, ctx) => {
        const mem = ctx.memory as ReputationMemory;
        const customer = mem.customers.find((c) => c.userId === data.userId);
        if (!customer) return { tier: "new" as ReputationTier, found: false };
        return {
          tier: customer.tier, found: true,
          totalSpent: customer.totalSpent,
          requestCount: customer.requestCount,
        };
      },
    }),

    action({
      name: "x402:generateCommitment",
      description: "Generate a reputation commitment proving service quality",
      schema: z.object({}),
      handler: async (_data, ctx) => {
        const mem = ctx.memory as ReputationMemory;
        const commitment = generateCommitmentHash(mem.services);
        mem.commitments.push(commitment);
        if (mem.commitments.length > 100) {
          mem.commitments = mem.commitments.slice(-100);
        }
        return commitment;
      },
    }),

    action({
      name: "x402:verifyCommitment",
      description: "Verify a previously issued reputation commitment",
      schema: z.object({ commitment: z.string() }),
      handler: async (data, ctx) => {
        const mem = ctx.memory as ReputationMemory;
        const found = mem.commitments.find((c) => c.commitment === data.commitment);
        if (!found) return { valid: false };
        return {
          valid: true,
          timestamp: found.timestamp,
          aggregateQuality: found.aggregateQuality,
          totalFulfilled: found.totalFulfilled,
        };
      },
    }),

    action({
      name: "x402:getServicesForTier",
      description: "Get services accessible at a given reputation tier",
      schema: z.object({ tier: z.enum(["new", "regular", "trusted", "premium"]) }),
      handler: async (data, ctx) => {
        const mem = ctx.memory as ReputationMemory;
        const tierOrder: ReputationTier[] = ["new", "regular", "trusted", "premium"];
        const tierIndex = tierOrder.indexOf(data.tier);

        // Gate expensive services behind higher tiers
        const sorted = [...mem.services].sort((a, b) => a.priceUSDC - b.priceUSDC);
        const perTier = Math.ceil(sorted.length / tierOrder.length);
        const available = sorted.filter((_, i) => {
          const required = Math.min(Math.floor(i / perTier), tierOrder.length - 1);
          return required <= tierIndex;
        });

        return {
          tier: data.tier,
          available: available.map((s) => ({
            name: s.name, priceUSDC: s.priceUSDC, description: s.description,
          })),
        };
      },
    }),

    action({
      name: "x402:getRevenueStats",
      description: "Get revenue and usage statistics",
      schema: z.object({}),
      handler: async (_data, ctx) => {
        const mem = ctx.memory as ReputationMemory;
        return {
          revenue: mem.revenue,
          services: mem.services
            .sort((a, b) => b.revenue - a.revenue)
            .map((s) => ({
              name: s.name, revenue: s.revenue,
              requests: s.requestCount, quality: s.qualityGuarantee,
            })),
          customers: mem.customers.length,
          tierDistribution: {
            new: mem.customers.filter((c) => c.tier === "new").length,
            regular: mem.customers.filter((c) => c.tier === "regular").length,
            trusted: mem.customers.filter((c) => c.tier === "trusted").length,
            premium: mem.customers.filter((c) => c.tier === "premium").length,
          },
        };
      },
    }),
  ]);
}
