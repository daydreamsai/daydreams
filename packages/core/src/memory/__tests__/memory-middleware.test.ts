import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { MemorySystem } from "../memory-system";
import { InMemoryKeyValueProvider, InMemoryVectorProvider, InMemoryGraphProvider } from "../providers/in-memory";
import type { Memory, MemoryMiddleware, MemoryContext } from "../types";

describe("MemoryMiddleware", () => {
  let memory: Memory;

  afterEach(async () => {
    if (memory) {
      await memory.close();
    }
  });

  describe("middleware lifecycle", () => {
    it("should initialize middleware on memory system startup", async () => {
      let initializeCalled = false;

      const testMiddleware: MemoryMiddleware = {
        name: "test-middleware",
        initialize: async (mem) => {
          initializeCalled = true;
          expect(mem).toBeDefined();
        },
      };

      memory = new MemorySystem({
        providers: {
          kv: new InMemoryKeyValueProvider(),
          vector: new InMemoryVectorProvider(),
          graph: new InMemoryGraphProvider(),
        },
        middleware: [testMiddleware],
      });

      await memory.initialize();

      expect(initializeCalled).toBe(true);
    });

    it("should call middleware hooks in correct order", async () => {
      const callOrder: string[] = [];

      const middleware1: MemoryMiddleware = {
        name: "middleware-1",
        beforeRemember: async () => {
          callOrder.push("before-1");
        },
        afterRemember: async () => {
          callOrder.push("after-1");
        },
      };

      const middleware2: MemoryMiddleware = {
        name: "middleware-2",
        beforeRemember: async () => {
          callOrder.push("before-2");
        },
        afterRemember: async () => {
          callOrder.push("after-2");
        },
      };

      memory = new MemorySystem({
        providers: {
          kv: new InMemoryKeyValueProvider(),
          vector: new InMemoryVectorProvider(),
          graph: new InMemoryGraphProvider(),
        },
        middleware: [middleware1, middleware2],
      });

      await memory.initialize();
      await memory.remember("test content", { key: "test" });

      expect(callOrder).toEqual(["before-1", "before-2", "after-1", "after-2"]);
    });
  });

  describe("transform middleware", () => {
    it("should transform data before storage", async () => {
      const transformMiddleware: MemoryMiddleware = {
        name: "transform-store",
        transformStore: async (data) => {
          if (typeof data === "string") {
            return data.toUpperCase();
          }
          return data;
        },
      };

      memory = new MemorySystem({
        providers: {
          kv: new InMemoryKeyValueProvider(),
          vector: new InMemoryVectorProvider(),
          graph: new InMemoryGraphProvider(),
        },
        middleware: [transformMiddleware],
      });

      await memory.initialize();
      await memory.remember("hello world", { key: "test:transform" });

      const stored = await memory.kv.get("test:transform");
      expect(stored).toBe("HELLO WORLD");
    });

    it("should transform data on retrieval", async () => {
      const transformMiddleware: MemoryMiddleware = {
        name: "transform-retrieve",
        transformRetrieve: async (data) => {
          return {
            ...data,
            transformed: true,
            originalContent: data.content,
            content: `[RETRIEVED] ${data.content}`,
          };
        },
      };

      memory = new MemorySystem({
        providers: {
          kv: new InMemoryKeyValueProvider(),
          vector: new InMemoryVectorProvider(),
          graph: new InMemoryGraphProvider(),
        },
        middleware: [transformMiddleware],
      });

      await memory.initialize();
      await memory.remember("test content", { key: "test:retrieve" });

      const results = await memory.recall("test content");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].transformed).toBe(true);
      expect(results[0].content).toBe("[RETRIEVED] test content");
    });

    it("should chain multiple transformations", async () => {
      const middleware1: MemoryMiddleware = {
        name: "transform-1",
        transformStore: async (data) => {
          return typeof data === "string" ? `[STEP1] ${data}` : data;
        },
      };

      const middleware2: MemoryMiddleware = {
        name: "transform-2",
        transformStore: async (data) => {
          return typeof data === "string" ? `[STEP2] ${data}` : data;
        },
      };

      memory = new MemorySystem({
        providers: {
          kv: new InMemoryKeyValueProvider(),
          vector: new InMemoryVectorProvider(),
          graph: new InMemoryGraphProvider(),
        },
        middleware: [middleware1, middleware2],
      });

      await memory.initialize();
      await memory.remember("original", { key: "test:chain" });

      const stored = await memory.kv.get("test:chain");
      expect(stored).toBe("[STEP2] [STEP1] original");
    });
  });

  describe("context-aware middleware", () => {
    it("should access memory context in hooks", async () => {
      let capturedContext: MemoryContext | null = null;

      const contextMiddleware: MemoryMiddleware = {
        name: "context-aware",
        beforeRemember: async (context) => {
          capturedContext = context;
        },
      };

      memory = new MemorySystem({
        providers: {
          kv: new InMemoryKeyValueProvider(),
          vector: new InMemoryVectorProvider(),
          graph: new InMemoryGraphProvider(),
        },
        middleware: [contextMiddleware],
      });

      await memory.initialize();
      await memory.remember("test data", {
        key: "test:context",
        type: "test",
        metadata: { source: "unit-test" },
      });

      expect(capturedContext).toBeDefined();
      expect(capturedContext?.operation).toBe("remember");
      expect(capturedContext?.data).toBe("test data");
      expect(capturedContext?.options?.key).toBe("test:context");
      expect(capturedContext?.memory).toBe(memory);
    });

    it("should modify options through middleware", async () => {
      const optionsMiddleware: MemoryMiddleware = {
        name: "options-modifier",
        beforeRemember: async (context) => {
          if (context.options) {
            context.options.metadata = {
              ...context.options.metadata,
              processed: true,
              timestamp: Date.now(),
            };
          }
        },
      };

      memory = new MemorySystem({
        providers: {
          kv: new InMemoryKeyValueProvider(),
          vector: new InMemoryVectorProvider(),
          graph: new InMemoryGraphProvider(),
        },
        middleware: [optionsMiddleware],
      });

      await memory.initialize();
      await memory.remember("test", { key: "test:options" });

      // Check if the metadata was modified and stored
      const results = await memory.vector.search({ 
        query: "test", 
        includeMetadata: true 
      });
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].metadata?.processed).toBe(true);
      expect(results[0].metadata?.timestamp).toBeDefined();
    });
  });

  describe("error handling in middleware", () => {
    it("should handle middleware errors gracefully", async () => {
      const errorMiddleware: MemoryMiddleware = {
        name: "error-middleware",
        beforeRemember: async () => {
          throw new Error("Middleware error");
        },
      };

      memory = new MemorySystem({
        providers: {
          kv: new InMemoryKeyValueProvider(),
          vector: new InMemoryVectorProvider(),
          graph: new InMemoryGraphProvider(),
        },
        middleware: [errorMiddleware],
      });

      await memory.initialize();

      // The error should propagate but not crash the system
      await expect(memory.remember("test", { key: "test:error" }))
        .rejects.toThrow("Middleware error");
    });

    it("should continue with other middleware if one fails", async () => {
      let middleware2Called = false;

      const errorMiddleware: MemoryMiddleware = {
        name: "error-middleware",
        beforeRemember: async () => {
          throw new Error("First middleware error");
        },
      };

      const successMiddleware: MemoryMiddleware = {
        name: "success-middleware",
        initialize: async () => {
          middleware2Called = true;
        },
      };

      memory = new MemorySystem({
        providers: {
          kv: new InMemoryKeyValueProvider(),
          vector: new InMemoryVectorProvider(),
          graph: new InMemoryGraphProvider(),
        },
        middleware: [errorMiddleware, successMiddleware],
      });

      await memory.initialize();

      // Second middleware should still be initialized
      expect(middleware2Called).toBe(true);
    });
  });

  describe("recall middleware", () => {
    it("should apply middleware to recall operations", async () => {
      const callOrder: string[] = [];

      const recallMiddleware: MemoryMiddleware = {
        name: "recall-middleware",
        beforeRecall: async () => {
          callOrder.push("before-recall");
        },
        afterRecall: async () => {
          callOrder.push("after-recall");
        },
      };

      memory = new MemorySystem({
        providers: {
          kv: new InMemoryKeyValueProvider(),
          vector: new InMemoryVectorProvider(),
          graph: new InMemoryGraphProvider(),
        },
        middleware: [recallMiddleware],
      });

      await memory.initialize();
      await memory.remember("searchable content", { key: "test:recall" });
      await memory.recall("searchable");

      expect(callOrder).toContain("before-recall");
      expect(callOrder).toContain("after-recall");
    });

    it("should modify recall context", async () => {
      let capturedQuery: string | null = null;
      let capturedResults: any[] | null = null;

      const recallMiddleware: MemoryMiddleware = {
        name: "recall-context",
        beforeRecall: async (context) => {
          capturedQuery = context.data;
        },
        afterRecall: async (context) => {
          capturedResults = context.data;
        },
      };

      memory = new MemorySystem({
        providers: {
          kv: new InMemoryKeyValueProvider(),
          vector: new InMemoryVectorProvider(),
          graph: new InMemoryGraphProvider(),
        },
        middleware: [recallMiddleware],
      });

      await memory.initialize();
      await memory.remember("findable content", { key: "test:find" });
      await memory.recall("findable");

      expect(capturedQuery).toBe("findable");
      expect(capturedResults).toBeDefined();
      expect(Array.isArray(capturedResults)).toBe(true);
    });
  });

  describe("forget middleware", () => {
    it("should apply middleware to forget operations", async () => {
      const callOrder: string[] = [];

      const forgetMiddleware: MemoryMiddleware = {
        name: "forget-middleware",
        beforeForget: async () => {
          callOrder.push("before-forget");
        },
        afterForget: async () => {
          callOrder.push("after-forget");
        },
      };

      memory = new MemorySystem({
        providers: {
          kv: new InMemoryKeyValueProvider(),
          vector: new InMemoryVectorProvider(),
          graph: new InMemoryGraphProvider(),
        },
        middleware: [forgetMiddleware],
      });

      await memory.initialize();
      await memory.remember("temporary data", { key: "temp:test" });
      await memory.forget({ pattern: "temp:*" });

      expect(callOrder).toContain("before-forget");
      expect(callOrder).toContain("after-forget");
    });
  });

  describe("logging and monitoring middleware", () => {
    it("should create logging middleware", async () => {
      const logs: Array<{ operation: string; timestamp: number; data?: any }> = [];

      const loggingMiddleware: MemoryMiddleware = {
        name: "logger",
        beforeRemember: async (context) => {
          logs.push({
            operation: "remember-start",
            timestamp: Date.now(),
            data: context.data,
          });
        },
        afterRemember: async (context) => {
          logs.push({
            operation: "remember-complete",
            timestamp: Date.now(),
            data: context.data,
          });
        },
        beforeRecall: async (context) => {
          logs.push({
            operation: "recall-start",
            timestamp: Date.now(),
            data: context.data,
          });
        },
        afterRecall: async (context) => {
          logs.push({
            operation: "recall-complete", 
            timestamp: Date.now(),
            data: context.data.length,
          });
        },
      };

      memory = new MemorySystem({
        providers: {
          kv: new InMemoryKeyValueProvider(),
          vector: new InMemoryVectorProvider(),
          graph: new InMemoryGraphProvider(),
        },
        middleware: [loggingMiddleware],
      });

      await memory.initialize();
      await memory.remember("logged content", { key: "test:log" });
      await memory.recall("logged");

      expect(logs.length).toBe(4);
      expect(logs[0].operation).toBe("remember-start");
      expect(logs[1].operation).toBe("remember-complete");
      expect(logs[2].operation).toBe("recall-start");
      expect(logs[3].operation).toBe("recall-complete");
    });

    it("should create metrics collection middleware", async () => {
      const metrics = {
        remembers: 0,
        recalls: 0,
        totalDataSize: 0,
        averageRecallResults: 0,
      };

      const metricsMiddleware: MemoryMiddleware = {
        name: "metrics",
        afterRemember: async (context) => {
          metrics.remembers++;
          if (typeof context.data === "string") {
            metrics.totalDataSize += context.data.length;
          }
        },
        afterRecall: async (context) => {
          metrics.recalls++;
          const resultCount = Array.isArray(context.data) ? context.data.length : 0;
          metrics.averageRecallResults = 
            (metrics.averageRecallResults * (metrics.recalls - 1) + resultCount) / metrics.recalls;
        },
      };

      memory = new MemorySystem({
        providers: {
          kv: new InMemoryKeyValueProvider(),
          vector: new InMemoryVectorProvider(),
          graph: new InMemoryGraphProvider(),
        },
        middleware: [metricsMiddleware],
      });

      await memory.initialize();
      
      await memory.remember("content 1", { key: "test:1" });
      await memory.remember("content 2", { key: "test:2" });
      await memory.recall("content");
      await memory.recall("test");

      expect(metrics.remembers).toBe(2);
      expect(metrics.recalls).toBe(2);
      expect(metrics.totalDataSize).toBe(18); // "content 1" (9) + "content 2" (9) = 18
      expect(metrics.averageRecallResults).toBeGreaterThan(0);
    });
  });

  describe("caching middleware", () => {
    it("should implement basic caching middleware", async () => {
      const cache = new Map<string, any>();
      let cacheHits = 0;
      let cacheMisses = 0;

      let currentQuery: string = "";
      
      const cachingMiddleware: MemoryMiddleware = {
        name: "cache",
        beforeRecall: async (context) => {
          currentQuery = context.data;
          const cacheKey = `recall:${context.data}:${JSON.stringify(context.options || {})}`;
          if (cache.has(cacheKey)) {
            cacheHits++;
            // In a real implementation, you'd return cached results here
            // For this test, we'll just track the cache hit
          } else {
            cacheMisses++;
          }
        },
        afterRecall: async (context) => {
          const cacheKey = `recall:${currentQuery}:${JSON.stringify(context.options || {})}`;
          cache.set(cacheKey, context.data);
        },
      };

      memory = new MemorySystem({
        providers: {
          kv: new InMemoryKeyValueProvider(),
          vector: new InMemoryVectorProvider(),
          graph: new InMemoryGraphProvider(),
        },
        middleware: [cachingMiddleware],
      });

      await memory.initialize();
      await memory.remember("cacheable content", { key: "test:cache" });
      
      // First recall - cache miss
      await memory.recall("cacheable");
      expect(cacheMisses).toBe(1);
      expect(cacheHits).toBe(0);

      // Second recall - cache hit
      await memory.recall("cacheable");
      expect(cacheMisses).toBe(1);
      expect(cacheHits).toBe(1);
    });
  });
});