import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { MemorySystem } from "..";
import {
  InMemoryKeyValueProvider,
  InMemoryVectorProvider,
  InMemoryGraphProvider,
} from "../providers/in-memory";

describe("MemorySystem recallOne convenience", () => {
  let memory: MemorySystem;

  beforeAll(async () => {
    memory = new MemorySystem({
      providers: {
        kv: new InMemoryKeyValueProvider(),
        vector: new InMemoryVectorProvider(),
        graph: new InMemoryGraphProvider(),
      },
    });
    await memory.initialize();

    await memory.vector.index([
      { id: "exact", content: "alpha beta", metadata: { docId: "D1" } },
      { id: "start", content: "alpha beta gamma", metadata: { docId: "D2" } },
      {
        id: "other",
        content: "completely different text",
        metadata: { docId: "D3" },
      },
    ]);
  });

  afterAll(async () => {
    await memory.close();
  });

  it("returns best match or null", async () => {
    const best = await memory.recallOne("alpha beta", {
      include: { content: true, metadata: true },
    } as any);
    expect(best?.id).toBe("exact");

    const none = await memory.recallOne("no matching terms at all", {
      minScore: 0.9,
    } as any);
    expect(none).toBeNull();
  });
});
