import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { MemorySystem } from "../memory-system";
import {
  InMemoryKeyValueProvider,
  InMemoryVectorProvider,
  InMemoryGraphProvider,
} from "../providers/in-memory";
import type { Memory, Fact } from "../types";

describe("FactualMemory", () => {
  let memory: Memory;

  beforeEach(async () => {
    memory = new MemorySystem({
      providers: {
        kv: new InMemoryKeyValueProvider(),
        vector: new InMemoryVectorProvider(),
        graph: new InMemoryGraphProvider(),
      },
    });
    await memory.initialize();
  });

  afterEach(async () => {
    await memory.close();
  });

  describe("fact storage", () => {
    it("should store a single fact", async () => {
      const fact: Fact = {
        id: "fact:1",
        statement: "The Earth orbits the Sun",
        confidence: 1.0,
        source: "astronomy",
        timestamp: Date.now(),
      };

      await memory.facts.store(fact);

      const retrieved = await memory.facts.get("fact:1");
      expect(retrieved).toEqual(fact);
    });

    it("should store multiple facts", async () => {
      const facts: Fact[] = [
        {
          id: "fact:1",
          statement: "Water freezes at 0°C",
          confidence: 1.0,
          source: "physics",
          timestamp: Date.now(),
        },
        {
          id: "fact:2",
          statement: "Paris is in France",
          confidence: 1.0,
          source: "geography",
          timestamp: Date.now(),
        },
      ];

      await memory.facts.store(facts);

      const fact1 = await memory.facts.get("fact:1");
      const fact2 = await memory.facts.get("fact:2");

      expect(fact1).toEqual(facts[0]);
      expect(fact2).toEqual(facts[1]);
    });

    it("should auto-generate ID if not provided", async () => {
      const fact = {
        statement: "Cats are mammals",
        confidence: 0.95,
        source: "biology",
        timestamp: Date.now(),
        id: "fact:auto:1",
      };

      await memory.facts.store(fact as Fact);

      // Should have auto-generated ID
      expect(fact.id).toBeDefined();
      expect(fact.id).toMatch(/^fact:/);
    });

    it("should auto-generate timestamp if not provided", async () => {
      const fact = {
        id: "fact:test",
        statement: "Dogs are loyal",
        confidence: 0.9,
        source: "observation",
        timestamp: Date.now(),
      };

      const beforeStore = Date.now();
      await memory.facts.store(fact as Fact);
      const afterStore = Date.now();

      expect(fact.timestamp).toBeDefined();
      expect(fact.timestamp).toBeGreaterThanOrEqual(beforeStore);
      expect(fact.timestamp).toBeLessThanOrEqual(afterStore);
    });
  });

  describe("fact search", () => {
    beforeEach(async () => {
      const facts: Fact[] = [
        {
          id: "fact:1",
          statement: "Python is a programming language",
          confidence: 1.0,
          source: "programming",
          entities: ["Python"],
          tags: { category: "technology" },
          timestamp: Date.now(),
        },
        {
          id: "fact:2",
          statement: "JavaScript runs in browsers",
          confidence: 1.0,
          source: "web-dev",
          entities: ["JavaScript"],
          tags: { category: "technology" },
          timestamp: Date.now(),
        },
        {
          id: "fact:3",
          statement: "Cats sleep 12-16 hours daily",
          confidence: 0.9,
          source: "veterinary",
          entities: ["Cats"],
          tags: { category: "animals" },
          timestamp: Date.now(),
        },
      ];

      await memory.facts.store(facts);
    });

    it("should search facts by text content", async () => {
      const results = await memory.facts.search("programming language");

      expect(results.length).toBeGreaterThan(0);
      expect(results.some((f) => f.statement.includes("Python"))).toBe(true);
    });

    it("should filter search results by metadata", async () => {
      const results = await memory.facts.search("", {
        filter: { category: "technology" },
        limit: 10,
      });

      expect(results.length).toBe(2);
      expect(results.every((f) => f.tags?.category === "technology")).toBe(
        true
      );
    });

    it("should sort results by confidence", async () => {
      const results = await memory.facts.search("", {
        sort: "confidence",
        limit: 10,
      });

      // Should be sorted by confidence descending
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].confidence).toBeGreaterThanOrEqual(
          results[i].confidence
        );
      }
    });

    it("should respect search limit", async () => {
      const results = await memory.facts.search("", { limit: 2 });
      expect(results.length).toBeLessThanOrEqual(2);
    });

    it("should return empty array for non-matching search", async () => {
      const results = await memory.facts.search("nonexistent topic");
      expect(results).toEqual([]);
    });
  });

  describe("fact verification", () => {
    it("should verify a fact with no conflicts", async () => {
      const fact: Fact = {
        id: "fact:verify:1",
        statement: "The sky appears blue during daytime",
        confidence: 0.9,
        source: "observation",
        timestamp: Date.now(),
      };

      await memory.facts.store(fact);
      const verification = await memory.facts.verify("fact:verify:1");

      expect(verification.factId).toBe("fact:verify:1");
      expect(verification.verified).toBe(true);
      expect(verification.supportingFacts).toEqual([]);
      expect(verification.conflictingFacts).toEqual([]);
      expect(verification.lastVerified).toBeDefined();
    });

    it("should throw error when verifying non-existent fact", async () => {
      await expect(memory.facts.verify("nonexistent")).rejects.toThrow(
        "Fact nonexistent not found"
      );
    });

    it("should calculate verification confidence", async () => {
      const fact: Fact = {
        id: "fact:confidence:1",
        statement: "Water is wet",
        confidence: 0.8,
        source: "common-sense",
        timestamp: Date.now(),
      };

      await memory.facts.store(fact);
      const verification = await memory.facts.verify("fact:confidence:1");

      expect(verification.confidence).toBeGreaterThan(0);
      expect(verification.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe("fact updates", () => {
    it("should update existing fact", async () => {
      const originalFact: Fact = {
        id: "fact:update:1",
        statement: "Original statement",
        confidence: 0.7,
        source: "test",
        timestamp: Date.now(),
      };

      await memory.facts.store(originalFact);

      await memory.facts.update("fact:update:1", {
        statement: "Updated statement",
        confidence: 0.9,
      });

      const updated = await memory.facts.get("fact:update:1");
      expect(updated?.statement).toBe("Updated statement");
      expect(updated?.confidence).toBe(0.9);
      expect(updated?.source).toBe("test"); // Should preserve other fields
    });

    it("should throw error when updating non-existent fact", async () => {
      await expect(
        memory.facts.update("nonexistent", { confidence: 0.5 })
      ).rejects.toThrow("Fact nonexistent not found");
    });
  });

  describe("fact deletion", () => {
    it("should delete existing fact", async () => {
      const fact: Fact = {
        id: "fact:delete:1",
        statement: "To be deleted",
        confidence: 0.8,
        source: "test",
        timestamp: Date.now(),
      };

      await memory.facts.store(fact);

      const deleted = await memory.facts.delete("fact:delete:1");
      expect(deleted).toBe(true);

      const retrieved = await memory.facts.get("fact:delete:1");
      expect(retrieved).toBeNull();
    });

    it("should return false when deleting non-existent fact", async () => {
      const deleted = await memory.facts.delete("nonexistent");
      expect(deleted).toBe(false);
    });
  });

  describe("fact retrieval by attributes", () => {
    beforeEach(async () => {
      const facts: Fact[] = [
        {
          id: "fact:tag:1",
          statement: "Fact with category tech",
          confidence: 1.0,
          source: "test",
          tags: { category: "tech", priority: "high" },
          timestamp: Date.now(),
        },
        {
          id: "fact:tag:2",
          statement: "Fact with category science",
          confidence: 0.9,
          source: "test",
          tags: { category: "science", priority: "medium" },
          timestamp: Date.now(),
        },
        {
          id: "fact:context:1",
          statement: "Fact from chat context",
          confidence: 0.8,
          source: "conversation",
          contextId: "chat:123",
          timestamp: Date.now(),
        },
      ];

      await memory.facts.store(facts);
    });

    it("should get facts by tag", async () => {
      const techFacts = await memory.facts.getByTag("category", "tech");

      expect(techFacts.length).toBe(1);
      expect(techFacts[0].id).toBe("fact:tag:1");
    });

    it("should get facts by context", async () => {
      const chatFacts = await memory.facts.getByContext("chat:123");

      expect(chatFacts.length).toBe(1);
      expect(chatFacts[0].id).toBe("fact:context:1");
    });

    it("should return empty array for non-matching tag", async () => {
      const facts = await memory.facts.getByTag("category", "nonexistent");
      expect(facts).toEqual([]);
    });

    it("should return empty array for non-matching context", async () => {
      const facts = await memory.facts.getByContext("nonexistent:context");
      expect(facts).toEqual([]);
    });
  });

  describe("entity integration", () => {
    it("should add entities to graph when storing facts with entities", async () => {
      const fact: Fact = {
        id: "fact:entities:1",
        statement: "Albert Einstein developed the theory of relativity",
        confidence: 1.0,
        source: "history",
        entities: ["Albert Einstein", "theory of relativity"],
        timestamp: Date.now(),
      };

      await memory.facts.store(fact);

      // Check if entities were added to graph
      const einstein = await memory.graph.getEntity("entity:albert-einstein");
      const theory = await memory.graph.getEntity(
        "entity:theory-of-relativity"
      );

      expect(einstein).toBeDefined();
      expect(theory).toBeDefined();
      expect(einstein?.name).toBe("Albert Einstein");
      expect(theory?.name).toBe("theory of relativity");
    });
  });
});
