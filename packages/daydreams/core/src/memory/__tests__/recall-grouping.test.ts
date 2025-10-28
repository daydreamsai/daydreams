import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { MemorySystem } from "..";
import {
  InMemoryKeyValueProvider,
  InMemoryVectorProvider,
  InMemoryGraphProvider,
} from "../providers/in-memory";

describe("MemorySystem recall grouping", () => {
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

    // Two docs from same docId=A with different scores for query 'foo bar'
    // - a1 matches exactly → score 1.0
    // - a2 startsWith → score 0.9
    // One doc for docId=B
    await memory.vector.index([
      {
        id: "a1",
        content: "foo bar",
        metadata: { docId: "A", source: "test" },
      },
      {
        id: "a2",
        content: "foo bar baz",
        metadata: { docId: "A", source: "test" },
      },
      {
        id: "b1",
        content: "foo bar also",
        metadata: { docId: "B", source: "test" },
      },
    ]);
  });

  afterAll(async () => {
    await memory.close();
  });

  it("groups by docId and keeps best per group", async () => {
    const results = await memory.recall("foo bar", {
      groupBy: "docId",
      dedupeBy: "none",
      include: { content: true, metadata: true },
      limit: 10,
    } as any);

    // Expect one result per docId (A and B)
    expect(results.length).toBe(2);
    const groups = new Set(results.map((r) => r.groupKey));
    expect(groups.has("A")).toBe(true);
    expect(groups.has("B")).toBe(true);

    // For docId=A, the exact match (a1) should win over a2
    const a = results.find((r) => r.groupKey === "A");
    expect(a?.id).toBe("a1");
  });
});
