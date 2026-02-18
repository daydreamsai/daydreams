import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { MemorySystem, type Episode } from "..";
import {
  InMemoryKeyValueProvider,
  InMemoryVectorProvider,
  InMemoryGraphProvider,
} from "../providers/in-memory";

describe("EpisodicMemory basic store and findSimilar", () => {
  let memory: MemorySystem;
  const contextId = "episodic-ctx-1";

  beforeAll(async () => {
    memory = new MemorySystem({
      providers: {
        kv: new InMemoryKeyValueProvider(),
        vector: new InMemoryVectorProvider(),
        graph: new InMemoryGraphProvider(),
      },
    });
    await memory.initialize();
  });

  afterAll(async () => {
    await memory.close();
  });

  it("stores episode and retrieves it via similarity in namespace", async () => {
    const now = Date.now();
    const episode: Episode = {
      id: `ep-${now}`,
      contextId,
      type: "conversation",
      summary: "Project Apollo landing module checklist and mission steps",
      logs: [],
      metadata: { tags: ["apollo", "checklist"] },
      timestamp: now,
      startTime: now - 1000,
      endTime: now,
      duration: 1000,
      context: contextId,
    };

    await memory.episodes.store(episode);

    const found = await memory.episodes.findSimilar(
      contextId,
      "landing module checklist",
      5
    );
    expect(found.length).toBeGreaterThan(0);
    expect(found.some((e) => e.id === episode.id)).toBe(true);
  });
});
