import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { MemorySystem } from "../memory-system";
import {
  InMemoryKeyValueProvider,
  InMemoryVectorProvider,
  InMemoryGraphProvider,
} from "../providers/in-memory";
import type { Memory, SemanticConcept, Pattern } from "../types";

describe("SemanticMemory", () => {
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

  describe("concept storage", () => {
    it("should store a semantic concept", async () => {
      const concept: SemanticConcept = {
        id: "concept:1",
        type: "concept",
        content:
          "Artificial intelligence is the simulation of human intelligence",
        confidence: 0.9,
        occurrences: 5,
        examples: [
          "AI can recognize images",
          "AI can process natural language",
        ],
        metadata: { domain: "technology" },
      };

      await memory.semantic.store(concept);

      const retrieved = await memory.semantic.get("concept:1");
      expect(retrieved).toEqual(concept);
    });

    it("should store a pattern", async () => {
      const pattern: Pattern = {
        id: "pattern:1",
        type: "pattern",
        content: "When user asks about weather, provide current conditions",
        trigger: "weather query",
        response: "current conditions",
        confidence: 0.8,
        occurrences: 10,
        successRate: 0.95,
        examples: ["User: 'What's the weather?' -> 'It's sunny'"],
      };

      await memory.semantic.store(pattern);

      const retrieved = await memory.semantic.get("pattern:1");
      expect(retrieved).toEqual(pattern);
    });

    it("should auto-generate ID if not provided", async () => {
      const concept = {
        id: "concept:auto:1",
        type: "skill",
        content: "Ability to summarize text",
        confidence: 0.7,
        occurrences: 3,
        examples: ["Summarized a news article", "Condensed a research paper"],
      };

      await memory.semantic.store(concept as SemanticConcept);

      expect(concept.id).toBeDefined();
      expect(concept.id).toMatch(/^concept:/);
    });

    it("should create vector index for concept content", async () => {
      const concept: SemanticConcept = {
        id: "concept:vector:1",
        type: "concept",
        content: "Machine learning algorithms can improve through experience",
        confidence: 0.85,
        occurrences: 8,
        examples: ["Neural networks learn from training data"],
      };

      await memory.semantic.store(concept);

      // Should be findable via vector search
      const results = await memory.vector.search({ query: "machine learning" });
      expect(results.some((r) => r.id === "concept:vector:1")).toBe(true);
    });
  });

  describe("concept search", () => {
    beforeEach(async () => {
      const concepts: SemanticConcept[] = [
        {
          id: "concept:ai:1",
          type: "concept",
          content: "Artificial intelligence systems",
          confidence: 0.9,
          occurrences: 15,
          examples: ["ChatGPT", "Computer vision"],
          metadata: { domain: "AI" },
        },
        {
          id: "concept:ml:1",
          type: "concept",
          content: "Machine learning techniques",
          confidence: 0.85,
          occurrences: 12,
          examples: ["Decision trees", "Neural networks"],
          metadata: { domain: "ML" },
        },
        {
          id: "concept:cooking:1",
          type: "skill",
          content: "Cooking techniques and recipes",
          confidence: 0.7,
          occurrences: 8,
          examples: ["Pasta cooking", "Bread baking"],
          metadata: { domain: "cooking" },
        },
      ];

      await Promise.all(concepts.map((c) => memory.semantic.store(c)));
    });

    it("should search concepts by content", async () => {
      const results = await memory.semantic.search("artificial intelligence");

      expect(results.length).toBeGreaterThan(0);
      expect(
        results.some((c) => c.content.includes("Artificial intelligence"))
      ).toBe(true);
    });

    it("should filter by metadata", async () => {
      const results = await memory.semantic.search("", {
        filter: { domain: "AI" },
        limit: 10,
      });

      expect(results.length).toBe(1);
      expect(results[0].metadata?.domain).toBe("AI");
    });

    it("should sort by confidence", async () => {
      const results = await memory.semantic.search("", {
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
      const results = await memory.semantic.search("", { limit: 2 });
      expect(results.length).toBeLessThanOrEqual(2);
    });

    it("should return empty array for non-matching search", async () => {
      const results = await memory.semantic.search("nonexistent topic");
      expect(results).toEqual([]);
    });
  });

  describe("pattern management", () => {
    beforeEach(async () => {
      const patterns: Pattern[] = [
        {
          id: "pattern:weather:1",
          type: "pattern",
          content: "Weather query pattern",
          trigger: "weather",
          response: "weather data",
          confidence: 0.9,
          occurrences: 25,
          successRate: 0.96,
          examples: ["What's the weather? -> It's sunny"],
        },
        {
          id: "pattern:math:1",
          type: "pattern",
          content: "Math calculation pattern",
          trigger: "calculation",
          response: "numeric result",
          confidence: 0.95,
          occurrences: 50,
          successRate: 0.98,
          examples: ["2 + 2 -> 4"],
        },
        {
          id: "pattern:greeting:1",
          type: "pattern",
          content: "Greeting pattern",
          trigger: "hello",
          response: "greeting response",
          confidence: 0.8,
          occurrences: 5,
          successRate: 0.8,
          examples: ["Hello -> Hi there!"],
        },
      ];

      await Promise.all(patterns.map((p) => memory.semantic.store(p)));
    });

    it("should get relevant patterns sorted by performance", async () => {
      const patterns = await memory.semantic.getRelevantPatterns("any-context");

      expect(patterns.length).toBeGreaterThan(0);

      // Should be sorted by success rate * occurrences
      for (let i = 1; i < patterns.length; i++) {
        const scoreA =
          patterns[i - 1].successRate * patterns[i - 1].occurrences;
        const scoreB = patterns[i].successRate * patterns[i].occurrences;
        expect(scoreA).toBeGreaterThanOrEqual(scoreB);
      }
    });

    it("should limit number of patterns returned", async () => {
      const patterns = await memory.semantic.getRelevantPatterns(
        "test-context"
      );
      expect(patterns.length).toBeLessThanOrEqual(10);
    });
  });

  describe("learning from actions", () => {
    it("should create pattern from successful action", async () => {
      const action = {
        name: "search",
        input: { query: "AI news" },
      };

      const result = {
        data: { results: ["Article 1", "Article 2"] },
        error: null,
      };

      await memory.semantic.learnFromAction(action, result);

      // Should have created a pattern
      const patterns = await memory.semantic.getRelevantPatterns("test");
      expect(patterns.length).toBeGreaterThan(0);

      const searchPattern = patterns.find((p) => p.content.includes("search"));
      expect(searchPattern).toBeDefined();
      expect(searchPattern?.confidence).toBe(0.8); // Success confidence
      expect(searchPattern?.occurrences).toBe(1);
      expect(searchPattern?.successRate).toBe(1);
    });

    it("should create pattern from failed action", async () => {
      const action = {
        name: "invalid_action",
        input: { param: "test" },
      };

      const result = {
        data: null,
        error: "Action failed",
      };

      await memory.semantic.learnFromAction(action, result);

      const patterns = await memory.semantic.getRelevantPatterns("test");
      const failedPattern = patterns.find((p) =>
        p.content.includes("invalid_action")
      );

      expect(failedPattern).toBeDefined();
      expect(failedPattern?.confidence).toBe(0.3); // Failure confidence
      expect(failedPattern?.successRate).toBe(0);
    });

    it("should update existing similar pattern", async () => {
      const action = {
        name: "calculate",
        input: { expression: "2 + 2" },
      };

      const result = {
        data: { result: 4 },
        error: null,
      };

      // Learn the same pattern twice
      await memory.semantic.learnFromAction(action, result);
      await memory.semantic.learnFromAction(action, result);

      const patterns = await memory.semantic.getRelevantPatterns("test");
      const calcPattern = patterns.find((p) => p.content.includes("calculate"));

      expect(calcPattern).toBeDefined();
      expect(calcPattern?.occurrences).toBe(2);
      expect(calcPattern?.examples).toHaveLength(2);
    });
  });

  describe("confidence updates", () => {
    it("should update concept confidence", async () => {
      const concept: SemanticConcept = {
        id: "concept:confidence:1",
        type: "concept",
        content: "Test concept",
        confidence: 0.5,
        occurrences: 1,
        examples: ["example"],
      };

      await memory.semantic.store(concept);

      await memory.semantic.updateConfidence("concept:confidence:1", 0.3);

      const updated = await memory.semantic.get("concept:confidence:1");
      expect(updated?.confidence).toBe(0.8); // 0.5 + 0.3
    });

    it("should clamp confidence to valid range", async () => {
      const concept: SemanticConcept = {
        id: "concept:clamp:1",
        type: "concept",
        content: "Test concept",
        confidence: 0.9,
        occurrences: 1,
        examples: ["example"],
      };

      await memory.semantic.store(concept);

      // Try to increase above 1.0
      await memory.semantic.updateConfidence("concept:clamp:1", 0.5);
      let updated = await memory.semantic.get("concept:clamp:1");
      expect(updated?.confidence).toBe(1.0);

      // Try to decrease below 0.0
      await memory.semantic.updateConfidence("concept:clamp:1", -2.0);
      updated = await memory.semantic.get("concept:clamp:1");
      expect(updated?.confidence).toBe(0.0);
    });

    it("should throw error for non-existent concept", async () => {
      await expect(
        memory.semantic.updateConfidence("nonexistent", 0.1)
      ).rejects.toThrow("Concept nonexistent not found");
    });
  });

  describe("concept types", () => {
    it("should handle different concept types", async () => {
      const concepts: SemanticConcept[] = [
        {
          id: "test:concept:1",
          type: "concept",
          content: "A general concept",
          confidence: 0.8,
          occurrences: 5,
          examples: [],
        },
        {
          id: "test:skill:1",
          type: "skill",
          content: "A learned skill",
          confidence: 0.7,
          occurrences: 3,
          examples: [],
        },
        {
          id: "test:relationship:1",
          type: "relationship",
          content: "A relationship between entities",
          confidence: 0.9,
          occurrences: 2,
          examples: [],
        },
      ];

      await Promise.all(concepts.map((c) => memory.semantic.store(c)));

      for (const concept of concepts) {
        const retrieved = await memory.semantic.get(concept.id);
        expect(retrieved?.type).toBe(concept.type);
      }
    });
  });

  describe("lifecycle events", () => {
    it("should emit semantic.stored event", async () => {
      let storedConcept: SemanticConcept | null = null;

      memory.lifecycle.on("semantic.stored", (concept) => {
        storedConcept = concept;
      });

      const concept: SemanticConcept = {
        id: "concept:event:1",
        type: "concept",
        content: "Test concept for events",
        confidence: 0.8,
        occurrences: 1,
        examples: [],
      };

      await memory.semantic.store(concept);

      expect(storedConcept).toEqual(concept);
    });
  });
});
