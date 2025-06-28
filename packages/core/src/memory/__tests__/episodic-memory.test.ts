import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { MemorySystem } from "../memory-system";
import {
  InMemoryKeyValueProvider,
  InMemoryVectorProvider,
  InMemoryGraphProvider,
} from "../providers/in-memory";
import type { Memory, Episode, CompressedEpisode } from "../types";

describe("EpisodicMemory", () => {
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

  describe("episode storage", () => {
    it("should store a conversation episode", async () => {
      const episode: Episode = {
        id: "ep:1",
        type: "conversation",
        input: "What's the weather like?",
        output: "It's sunny and warm today",
        context: "chat:123",
        timestamp: Date.now(),
        duration: 1500,
        metadata: { userIntent: "weather-query" },
      };

      await memory.episodes.store(episode);

      const retrieved = await memory.episodes.get("ep:1");
      expect(retrieved).toEqual(episode);
    });

    it("should store an action episode", async () => {
      const episode: Episode = {
        id: "ep:action:1",
        type: "action",
        input: { action: "search", query: "AI news" },
        output: { results: ["Article 1", "Article 2"] },
        context: "task:research",
        timestamp: Date.now(),
        duration: 3000,
        metadata: { actionType: "search", resultCount: 2 },
      };

      await memory.episodes.store(episode);

      const retrieved = await memory.episodes.get("ep:action:1");
      expect(retrieved).toEqual(episode);
    });

    it("should auto-generate ID if not provided", async () => {
      const episode = {
        type: "event",
        input: "system startup",
        context: "system",
        timestamp: Date.now(),
      } as Episode;

      await memory.episodes.store(episode);

      expect(episode.id).toBeDefined();
      expect(episode.id).toMatch(/^episode:/);
    });

    it("should auto-generate timestamp if not provided", async () => {
      const episode: Episode = {
        id: "ep:test",
        type: "conversation",
        input: "test input",
        output: "test output",
        context: "test",
        timestamp: Date.now(),
      };

      const beforeStore = Date.now();
      await memory.episodes.store(episode as Episode);
      const afterStore = Date.now();

      expect(episode.timestamp).toBeDefined();
      expect(episode.timestamp).toBeGreaterThanOrEqual(beforeStore);
      expect(episode.timestamp).toBeLessThanOrEqual(afterStore);
    });

    it("should create vector index for episode content", async () => {
      const episode: Episode = {
        id: "ep:vector:1",
        type: "conversation",
        input: "Tell me about machine learning",
        output:
          "Machine learning is a subset of AI that enables computers to learn",
        context: "education",
        timestamp: Date.now(),
      };

      await memory.episodes.store(episode);

      // Search should find this episode
      const results = await memory.vector.search({ query: "machine learning" });
      expect(results.some((r) => r.id === "ep:vector:1")).toBe(true);
    });

    it("should use summary for vector indexing when available", async () => {
      const episode: Episode = {
        id: "ep:summary:1",
        type: "conversation",
        summary:
          "Discussion about artificial intelligence and its applications",
        context: "tech-talk",
        timestamp: Date.now(),
      };

      await memory.episodes.store(episode);

      const results = await memory.vector.search({
        query: "artificial intelligence",
      });
      expect(results.some((r) => r.id === "ep:summary:1")).toBe(true);
    });
  });

  describe("episode retrieval", () => {
    it("should retrieve episode by ID", async () => {
      const episode: Episode = {
        id: "ep:retrieve:1",
        type: "conversation",
        input: "Hello",
        output: "Hi there!",
        context: "greeting",
        timestamp: Date.now(),
      };

      await memory.episodes.store(episode);

      const retrieved = await memory.episodes.get("ep:retrieve:1");
      expect(retrieved).toEqual(episode);
    });

    it("should return null for non-existent episode", async () => {
      const retrieved = await memory.episodes.get("nonexistent");
      expect(retrieved).toBeNull();
    });
  });

  describe("finding similar episodes", () => {
    beforeEach(async () => {
      const episodes: Episode[] = [
        {
          id: "ep:similar:1",
          type: "conversation",
          input: "What's the weather today?",
          output: "It's sunny and 75°F",
          context: "chat:123",
          timestamp: Date.now() - 3600000, // 1 hour ago
        },
        {
          id: "ep:similar:2",
          type: "conversation",
          input: "How's the weather?",
          output: "It's cloudy with light rain",
          context: "chat:123",
          timestamp: Date.now() - 1800000, // 30 minutes ago
        },
        {
          id: "ep:different:1",
          type: "action",
          input: { action: "calculate", expression: "2+2" },
          output: { result: 4 },
          context: "math:456",
          timestamp: Date.now() - 900000, // 15 minutes ago
        },
      ];

      await Promise.all(episodes.map((ep) => memory.episodes.store(ep)));
    });

    it("should find similar episodes in same context", async () => {
      const similar = await memory.episodes.findSimilar(
        "chat:123",
        "What's the current weather?",
        5
      );

      expect(similar.length).toBeGreaterThan(0);
      expect(similar.every((ep) => ep.context === "chat:123")).toBe(true);
    });

    it("should respect the limit parameter", async () => {
      const similar = await memory.episodes.findSimilar(
        "chat:123",
        "weather",
        1
      );

      expect(similar.length).toBeLessThanOrEqual(1);
    });

    it("should return empty array for non-matching context", async () => {
      const similar = await memory.episodes.findSimilar(
        "nonexistent:context",
        "anything",
        5
      );

      expect(similar).toEqual([]);
    });
  });

  describe("timeline retrieval", () => {
    beforeEach(async () => {
      const now = Date.now();
      const episodes: Episode[] = [
        {
          id: "ep:timeline:1",
          type: "event",
          context: "system",
          timestamp: now - 7200000, // 2 hours ago
        },
        {
          id: "ep:timeline:2",
          type: "conversation",
          input: "Hello",
          output: "Hi",
          context: "chat",
          timestamp: now - 3600000, // 1 hour ago
        },
        {
          id: "ep:timeline:3",
          type: "action",
          input: { action: "search" },
          output: { results: [] },
          context: "task",
          timestamp: now - 1800000, // 30 minutes ago
        },
        {
          id: "ep:timeline:4",
          type: "event",
          context: "system",
          timestamp: now - 900000, // 15 minutes ago
        },
      ];

      await Promise.all(episodes.map((ep) => memory.episodes.store(ep)));
    });

    it("should get episodes within time range", async () => {
      const now = Date.now();
      const start = new Date(now - 4000000); // ~1 hour ago
      const end = new Date(now - 1000000); // ~15 minutes ago

      const timeline = await memory.episodes.getTimeline(start, end);

      expect(timeline.length).toBe(2);
      expect(timeline[0].id).toBe("ep:timeline:2");
      expect(timeline[1].id).toBe("ep:timeline:3");
    });

    it("should return episodes sorted by timestamp", async () => {
      const start = new Date(0);
      const end = new Date();

      const timeline = await memory.episodes.getTimeline(start, end);

      // Should be sorted chronologically
      for (let i = 1; i < timeline.length; i++) {
        expect(timeline[i].timestamp).toBeGreaterThanOrEqual(
          timeline[i - 1].timestamp
        );
      }
    });

    it("should return empty array for non-matching time range", async () => {
      const start = new Date(Date.now() + 3600000); // 1 hour in future
      const end = new Date(Date.now() + 7200000); // 2 hours in future

      const timeline = await memory.episodes.getTimeline(start, end);
      expect(timeline).toEqual([]);
    });
  });

  describe("episodes by context", () => {
    beforeEach(async () => {
      const episodes: Episode[] = [
        {
          id: "ep:context:1",
          type: "conversation",
          input: "First message",
          output: "First response",
          context: "chat:abc",
          timestamp: Date.now() - 3600000,
        },
        {
          id: "ep:context:2",
          type: "conversation",
          input: "Second message",
          output: "Second response",
          context: "chat:abc",
          timestamp: Date.now() - 1800000,
        },
        {
          id: "ep:context:3",
          type: "action",
          input: { action: "search" },
          output: { results: [] },
          context: "task:xyz",
          timestamp: Date.now() - 900000,
        },
      ];

      await Promise.all(episodes.map((ep) => memory.episodes.store(ep)));
    });

    it("should get all episodes for a context", async () => {
      const chatEpisodes = await memory.episodes.getByContext("chat:abc");

      expect(chatEpisodes.length).toBe(2);
      expect(chatEpisodes.every((ep) => ep.context === "chat:abc")).toBe(true);
    });

    it("should return episodes sorted by timestamp", async () => {
      const episodes = await memory.episodes.getByContext("chat:abc");

      // Should be sorted chronologically
      for (let i = 1; i < episodes.length; i++) {
        expect(episodes[i].timestamp).toBeGreaterThanOrEqual(
          episodes[i - 1].timestamp
        );
      }
    });

    it("should return empty array for non-existent context", async () => {
      const episodes = await memory.episodes.getByContext("nonexistent");
      expect(episodes).toEqual([]);
    });
  });

  describe("episode compression", () => {
    it("should compress multiple episodes into one", async () => {
      const now = Date.now();
      const episodes: Episode[] = [
        {
          id: "ep:compress:1",
          type: "conversation",
          input: "Hello",
          output: "Hi there",
          context: "chat:compress",
          timestamp: now - 3600000,
        },
        {
          id: "ep:compress:2",
          type: "conversation",
          input: "How are you?",
          output: "I'm doing well",
          context: "chat:compress",
          timestamp: now - 1800000,
        },
        {
          id: "ep:compress:3",
          type: "conversation",
          input: "Goodbye",
          output: "See you later",
          context: "chat:compress",
          timestamp: now - 900000,
        },
      ];

      await Promise.all(episodes.map((ep) => memory.episodes.store(ep)));

      const compressed = await memory.episodes.compress(episodes);

      expect(compressed.type).toBe("compression");
      expect(compressed.originalEpisodes).toEqual([
        "ep:compress:1",
        "ep:compress:2",
        "ep:compress:3",
      ]);
      expect(compressed.compressionRatio).toBe(3);
      expect(compressed.context).toBe("chat:compress");
      expect(compressed.metadata?.originalCount).toBe(3);
      expect(compressed.metadata?.types).toContain("conversation");
    });

    it("should store compressed episode", async () => {
      const episodes: Episode[] = [
        {
          id: "ep:store:1",
          type: "event",
          context: "test",
          timestamp: Date.now() - 1000,
        },
      ];

      await memory.episodes.store(episodes[0]);

      const compressed = await memory.episodes.compress(episodes);

      // Compressed episode should be stored and retrievable
      const retrieved = await memory.episodes.get(compressed.id);
      expect(retrieved).toEqual(compressed);
    });

    it("should handle empty episode array", async () => {
      await expect(memory.episodes.compress([])).rejects.toThrow();
    });

    it("should include summary in compressed episode", async () => {
      const episodes: Episode[] = [
        {
          id: "ep:summary:1",
          type: "conversation",
          input: "test",
          output: "response",
          context: "test",
          timestamp: Date.now() - 1000,
        },
      ];

      await memory.episodes.store(episodes[0]);

      const compressed = await memory.episodes.compress(episodes);

      expect(compressed.summary).toContain("Compressed 1 episodes");
      expect(compressed.summary).toContain(
        new Date(episodes[0].timestamp).toISOString()
      );
    });
  });

  describe("lifecycle events", () => {
    it("should emit episode.stored event", async () => {
      let storedEpisode: Episode | null = null;

      memory.lifecycle.on("episode.stored", (episode) => {
        storedEpisode = episode;
      });

      const episode: Episode = {
        id: "ep:event:1",
        type: "conversation",
        input: "test",
        output: "response",
        context: "test",
        timestamp: Date.now(),
      };

      await memory.episodes.store(episode);

      expect(storedEpisode).toEqual(episode);
    });
  });
});
