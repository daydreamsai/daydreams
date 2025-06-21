import { describe, it, expect } from "vitest";
import {
  createRequestContext,
  aggregateTokenUsage,
  estimateCost,
} from "./tracking";
import type { TokenUsage } from "./tracking";

describe("Request Tracking - Basic Functionality", () => {
  describe("Request Context Creation", () => {
    it("should create request context with metadata", () => {
      const context = createRequestContext("cli", {
        userId: "user-123",
        sessionId: "session-456",
        metadata: { source: "terminal", version: "1.0" },
      });

      expect(context.requestId).toBeDefined();
      expect(context.trackingEnabled).toBe(true);
      expect(context.metadata?.userId).toBe("user-123");
      expect(context.metadata?.source).toBe("terminal");
    });

    it("should create disabled context when tracking is off", () => {
      const context = createRequestContext("test", { trackingEnabled: false });
      expect(context.trackingEnabled).toBe(false);
    });
  });

  describe("Token Usage Utilities", () => {
    it("should aggregate token usage correctly", () => {
      const usages: TokenUsage[] = [
        {
          inputTokens: 100,
          outputTokens: 200,
          totalTokens: 300,
          estimatedCost: 0.05,
        },
        {
          inputTokens: 50,
          outputTokens: 100,
          totalTokens: 150,
          estimatedCost: 0.025,
        },
        {
          inputTokens: 25,
          outputTokens: 75,
          totalTokens: 100,
          reasoningTokens: 10,
          estimatedCost: 0.02,
        },
      ];

      const aggregated = aggregateTokenUsage(usages);

      expect(aggregated.inputTokens).toBe(175);
      expect(aggregated.outputTokens).toBe(375);
      expect(aggregated.totalTokens).toBe(550);
      expect(aggregated.reasoningTokens).toBe(10);
      expect(aggregated.estimatedCost).toBeCloseTo(0.095, 5);
    });

    it("should estimate cost correctly", () => {
      const tokenUsage: TokenUsage = {
        inputTokens: 1000,
        outputTokens: 2000,
        totalTokens: 3000,
      };

      const cost = estimateCost(tokenUsage, "anthropic", {
        anthropic: {
          inputTokenCost: 3.0,
          outputTokenCost: 15.0,
        },
      });

      expect(cost).toBe(33);
    });

    it("should handle empty token usage array", () => {
      const aggregated = aggregateTokenUsage([]);
      expect(aggregated.inputTokens).toBe(0);
      expect(aggregated.outputTokens).toBe(0);
      expect(aggregated.totalTokens).toBe(0);
      expect(aggregated.reasoningTokens).toBe(0);
      expect(aggregated.estimatedCost).toBe(0);
    });

    it("should handle missing cost estimation config", () => {
      const tokenUsage: TokenUsage = {
        inputTokens: 1000,
        outputTokens: 2000,
        totalTokens: 3000,
      };

      const cost = estimateCost(tokenUsage, "unknown-provider", {});
      expect(cost).toBe(0);
    });

    it("should handle reasoning tokens in cost estimation", () => {
      const tokenUsage: TokenUsage = {
        inputTokens: 1000,
        outputTokens: 1000,
        totalTokens: 2000,
        reasoningTokens: 500,
      };

      const cost = estimateCost(tokenUsage, "openai", {
        openai: {
          inputTokenCost: 5.0,
          outputTokenCost: 15.0,
          reasoningTokenCost: 30.0,
        },
      });

      expect(cost).toBe(35);
    });
  });

  describe("Request Context Hierarchy", () => {
    it("should maintain request context metadata", () => {
      const context = createRequestContext("api", {
        userId: "user-456",
        metadata: { endpoint: "/api/v1/chat" },
      });

      expect(context.requestId).toBeDefined();
      expect(context.metadata?.userId).toBe("user-456");
      expect(context.metadata?.source).toBe("api");
      expect(context.metadata?.endpoint).toBe("/api/v1/chat");
    });

    it("should generate unique request IDs", () => {
      const context1 = createRequestContext("test1");
      const context2 = createRequestContext("test2");

      expect(context1.requestId).not.toBe(context2.requestId);
    });
  });
});
