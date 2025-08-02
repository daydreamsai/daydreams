import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  MemorySystem,
  InMemoryKeyValueProvider,
  InMemoryVectorProvider,
  InMemoryGraphProvider,
} from "../index";
import type { Memory } from "../types";
import type { AgentContext, AnyAgent } from "../../types";

describe("MemorySystem", () => {
  let memory: Memory;
  let mockCtx: AgentContext;
  let mockAgent: AnyAgent;

  beforeEach(async () => {
    memory = new MemorySystem({
      providers: {
        kv: new InMemoryKeyValueProvider(),
        vector: new InMemoryVectorProvider(),
        graph: new InMemoryGraphProvider(),
      },
    });
    await memory.initialize();

    // Create mock agent context and agent for testing
    mockCtx = {
      id: "test-context",
      type: "test",
      key: "test-key",
      memory: {} as any,
      settings: {},
      workingMemory: {} as any,
    } as unknown as AgentContext;

    mockAgent = {
      model: {} as any,
      logger: {
        info: () => {},
        warn: () => {},
        error: () => {},
        debug: () => {},
      },
    } as unknown as AnyAgent;
  });

  afterEach(async () => {
    await memory.close();
  });

  describe("initialization", () => {
    it("should initialize all providers", async () => {
      const kv = new InMemoryKeyValueProvider();
      const vector = new InMemoryVectorProvider();
      const graph = new InMemoryGraphProvider();

      const system = new MemorySystem({
        providers: { kv, vector, graph },
      });

      await system.initialize();

      // Check health of all providers
      const kvHealth = await kv.health();
      const vectorHealth = await vector.health();
      const graphHealth = await graph.health();

      expect(kvHealth.status).toBe("healthy");
      expect(vectorHealth.status).toBe("healthy");
      expect(graphHealth.status).toBe("healthy");

      await system.close();
    });
  });

  describe("remember operation", () => {
    it("should store content with a key", async () => {
      await memory.remember({ test: "data" }, { key: "test:1" });

      const stored = await memory.kv.get("test:1");
      expect(stored).toEqual({ test: "data" });
    });

    it("should index content for vector search", async () => {
      await memory.remember("This is a test document", {
        key: "doc:1",
        type: "document",
      });

      const results = await memory.vector.search({ query: "test" });
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe("doc:1");
    });

    it("should store facts when content is classified as fact", async () => {
      await memory.remember(
        {
          statement: "The sky is blue",
          confidence: 0.95,
          source: "observation",
        },
        { type: "fact" }
      );

      const facts = await memory.facts.search("sky");
      expect(facts.length).toBeGreaterThan(0);
      expect(facts[0].statement).toBe("The sky is blue");
    });
  });

  describe("recall operation", () => {
    beforeEach(async () => {
      // Store some test data
      await memory.remember("Paris is the capital of France", {
        key: "fact:paris",
        type: "fact",
      });

      await memory.remember("I prefer dark mode", {
        key: "pref:1",
        type: "preference",
      });
    });

    it("should recall relevant memories", async () => {
      const results = await memory.recall("What is the capital of France?");

      expect(results.length).toBeGreaterThan(0);
      expect(
        results.some((r) =>
          typeof r.content === "string"
            ? r.content.includes("Paris")
            : JSON.stringify(r.content).includes("Paris")
        )
      ).toBe(true);
    });

    it("should filter by type when specified", async () => {
      const results = await memory.recall("preferences", {
        types: ["preference"],
      });

      expect(results.every((r) => r.type === "vector")).toBe(true);
    });

    it("should respect limit option", async () => {
      const results = await memory.recall("test", { limit: 1 });
      expect(results.length).toBeLessThanOrEqual(1);
    });
  });

  describe("forget operation", () => {
    beforeEach(async () => {
      await memory.kv.set("temp:1", { data: "test1" });
      await memory.kv.set("temp:2", { data: "test2" });
      await memory.kv.set("keep:1", { data: "important" });
    });

    it("should delete by pattern", async () => {
      await memory.forget({ pattern: "temp:*" });

      expect(await memory.kv.exists("temp:1")).toBe(false);
      expect(await memory.kv.exists("temp:2")).toBe(false);
      expect(await memory.kv.exists("keep:1")).toBe(true);
    });
  });

  describe("working memory", () => {
    it("should create and manage working memory", async () => {
      const contextId = "test-context";

      // Create working memory
      const wm = await memory.working.create(contextId);
      expect(wm.inputs).toEqual([]);
      expect(wm.outputs).toEqual([]);

      // Push entries
      await memory.working.push(
        contextId,
        {
          id: "input-1",
          ref: "input",
          type: "test",
          content: "Hello",
          data: "Hello",
          timestamp: Date.now(),
          processed: false,
        },
        mockCtx,
        mockAgent
      );

      // Get updated working memory
      const updated = await memory.working.get(contextId);
      expect(updated.inputs).toHaveLength(1);
      expect(updated.inputs[0].content).toBe("Hello");
    });

    it("should handle memory pressure", async () => {
      const contextId = "pressure-test";
      await memory.working.create(contextId);

      // Push many entries with memory manager
      const memoryManager = {
        maxSize: 5,
        strategy: "fifo" as const,
      };

      for (let i = 0; i < 10; i++) {
        await memory.working.push(
          contextId,
          {
            id: `input-${i}`,
            ref: "input",
            type: "test",
            content: `Message ${i}`,
            data: `Message ${i}`,
            timestamp: Date.now(),
            processed: false,
          },
          mockCtx,
          mockAgent,
          { memoryManager }
        );
      }

      const wm = await memory.working.get(contextId);
      expect(wm.inputs.length).toBeLessThanOrEqual(5);
    });
  });

  describe("facts memory", () => {
    it("should store and retrieve facts", async () => {
      const fact = {
        id: "fact:1",
        statement: "Water boils at 100°C at sea level",
        confidence: 1.0,
        source: "science",
        timestamp: Date.now(),
      };

      await memory.facts.store(fact);

      const retrieved = await memory.facts.get("fact:1");
      expect(retrieved).toEqual(fact);
    });

    it("should verify facts", async () => {
      const fact = {
        id: "fact:2",
        statement: "The Earth is round",
        confidence: 1.0,
        source: "science",
        timestamp: Date.now(),
      };

      await memory.facts.store(fact);
      const verification = await memory.facts.verify("fact:2");

      expect(verification.verified).toBe(true);
      expect(verification.factId).toBe("fact:2");
    });
  });

  describe("episodes memory", () => {
    it("should store and find similar episodes", async () => {
      const episode = {
        id: "ep:1",
        type: "conversation" as const,
        input: "What's the weather?",
        output: "It's sunny today",
        context: "chat:123",
        timestamp: Date.now(),
      };

      await memory.episodes.store(episode);

      const similar = await memory.episodes.findSimilar(
        "chat:123",
        "Tell me about the weather",
        5
      );

      expect(similar.length).toBeGreaterThan(0);
      expect(similar[0].id).toBe("ep:1");
    });

    it("should get timeline of episodes", async () => {
      const now = Date.now();

      await memory.episodes.store({
        id: "ep:past",
        type: "event",
        context: "test",
        timestamp: now - 3600000, // 1 hour ago
      });

      await memory.episodes.store({
        id: "ep:recent",
        type: "event",
        context: "test",
        timestamp: now - 60000, // 1 minute ago
      });

      const timeline = await memory.episodes.getTimeline(
        new Date(now - 7200000), // 2 hours ago
        new Date()
      );

      expect(timeline).toHaveLength(2);
      expect(timeline[0].id).toBe("ep:past");
      expect(timeline[1].id).toBe("ep:recent");
    });
  });

  describe("graph memory", () => {
    it("should manage entities and relationships", async () => {
      // Add entities
      const user = {
        id: "user:1",
        type: "person",
        name: "Alice",
        properties: { age: 30 },
        contextIds: ["chat:1"],
      };

      const topic = {
        id: "topic:1",
        type: "topic",
        name: "AI",
        properties: { category: "technology" },
        contextIds: ["chat:1"],
      };

      await memory.graph.addEntity(user);
      await memory.graph.addEntity(topic);

      // Add relationship
      await memory.graph.addRelationship({
        id: "rel:1",
        from: "user:1",
        to: "topic:1",
        type: "interested_in",
        strength: 0.9,
      });

      // Find related entities
      const related = await memory.graph.findRelated("user:1");
      expect(related).toHaveLength(1);
      expect(related[0].id).toBe("topic:1");
    });
  });

  describe("lifecycle events", () => {
    it("should emit lifecycle events", async () => {
      const events: string[] = [];

      memory.lifecycle.on("beforeRemember", () => {
        events.push("beforeRemember");
      });
      memory.lifecycle.on("afterRemember", () => {
        events.push("afterRemember");
      });

      await memory.remember("test", { key: "test" });

      expect(events).toContain("beforeRemember");
      expect(events).toContain("afterRemember");
    });
  });
});
