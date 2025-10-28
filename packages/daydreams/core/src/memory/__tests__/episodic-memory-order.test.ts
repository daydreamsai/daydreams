import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { MemorySystem, type Episode } from "..";
import {
  InMemoryKeyValueProvider,
  InMemoryVectorProvider,
  InMemoryGraphProvider,
} from "../providers/in-memory";

describe("EpisodicMemory getByContext ordering", () => {
  let memory: MemorySystem;
  const contextId = "episodic-order-ctx";

  beforeAll(async () => {
    memory = new MemorySystem({
      providers: {
        kv: new InMemoryKeyValueProvider(),
        vector: new InMemoryVectorProvider(),
        graph: new InMemoryGraphProvider(),
      },
    });
    await memory.initialize();

    // Store three episodes with increasing timestamps
    const base = Date.now();
    const make = (i: number): Episode => ({
      id: `ep-${i}`,
      contextId,
      type: "conversation",
      summary: `episode ${i}`,
      logs: [],
      metadata: {},
      timestamp: base + i * 1000,
      startTime: base + i * 1000 - 500,
      endTime: base + i * 1000,
      duration: 500,
      context: contextId,
    });

    await memory.episodes.store(make(1));
    await memory.episodes.store(make(2));
    await memory.episodes.store(make(3));
  });

  afterAll(async () => {
    await memory.close();
  });

  it("returns most recent first", async () => {
    const eps = await memory.episodes.getByContext(contextId, 10);
    expect(eps.length).toBeGreaterThanOrEqual(3);
    // Sorted by timestamp desc
    expect(eps[0].timestamp).toBeGreaterThanOrEqual(eps[1].timestamp);
    expect(eps[1].timestamp).toBeGreaterThanOrEqual(eps[2].timestamp);
    expect(eps[0].id).toBe("ep-3");
  });
});
