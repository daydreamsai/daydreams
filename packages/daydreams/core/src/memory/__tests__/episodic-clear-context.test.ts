import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { MemorySystem, type Episode } from "..";
import {
  InMemoryKeyValueProvider,
  InMemoryVectorProvider,
  InMemoryGraphProvider,
} from "../providers/in-memory";

describe("EpisodicMemory clearContext", () => {
  let memory: MemorySystem;
  const contextId = "ctx-clear";
  const ids = ["ec-1", "ec-2", "ec-3"];

  beforeAll(async () => {
    memory = new MemorySystem({
      providers: {
        kv: new InMemoryKeyValueProvider(),
        vector: new InMemoryVectorProvider(),
        graph: new InMemoryGraphProvider(),
      },
    });
    await memory.initialize();

    const base = Date.now();
    const make = (id: string): Episode => ({
      id,
      contextId,
      type: "conversation",
      summary: `summary ${id}`,
      logs: [],
      metadata: {},
      timestamp: base,
      startTime: base - 100,
      endTime: base,
      duration: 100,
      context: contextId,
    });

    for (const id of ids) {
      await memory.episodes.store(make(id));
    }
  });

  afterAll(async () => {
    await memory.close();
  });

  it("removes episodes and context list; vector namespace is cleared", async () => {
    const before = await memory.episodes.getByContext(contextId, 10);
    expect(before.length).toBeGreaterThanOrEqual(3);

    await memory.episodes.clearContext(contextId);

    const after = await memory.episodes.getByContext(contextId, 10);
    expect(after.length).toBe(0);

    // Context list key deleted
    const list = await memory.kv.get(`episodes:context:${contextId}`);
    expect(list).toBeNull();

    // Episode keys deleted
    for (const id of ids) {
      const ep = await memory.kv.get(`episode:${id}`);
      expect(ep).toBeNull();
    }

    // Vector namespace search returns no results
    const search = await memory.vector.search({
      query: "",
      namespace: `episodes:${contextId}`,
      limit: 10,
    });
    expect(search.length).toBe(0);
  });
});
