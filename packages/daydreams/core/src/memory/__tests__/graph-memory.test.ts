import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { MemorySystem } from "..";
import {
  InMemoryKeyValueProvider,
  InMemoryVectorProvider,
  InMemoryGraphProvider,
} from "../providers/in-memory";

describe("GraphMemoryImpl basic entity/relationship lifecycle", () => {
  let memory: MemorySystem;
  const ctx = "graph-ctx";

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

  it("adds entities, relates them, finds related, updates, finds path, and removes", async () => {
    // Add entities with deterministic IDs
    const aId = await memory.graph.addEntity({
      id: "A",
      type: "person",
      name: "Alice",
      properties: { age: 30 },
      contextIds: [ctx],
    });
    const bId = await memory.graph.addEntity({
      id: "B",
      type: "person",
      name: "Bob",
      properties: { age: 31 },
      contextIds: [ctx],
    });
    const cId = await memory.graph.addEntity({
      id: "C",
      type: "person",
      name: "Carol",
      properties: { age: 29 },
      contextIds: [ctx],
    });

    expect(aId).toBe("A");
    expect(bId).toBe("B");
    expect(cId).toBe("C");

    // Add relationships A->B and B->C
    const r1 = await memory.graph.addRelationship({
      id: "",
      from: aId,
      to: bId,
      type: "knows",
    });
    const r2 = await memory.graph.addRelationship({
      id: "",
      from: bId,
      to: cId,
      type: "knows",
    });
    expect(r1).toBeTruthy();
    expect(r2).toBeTruthy();

    // Get and verify entity mapping
    const a = await memory.graph.getEntity("A");
    expect(a?.name).toBe("Alice");
    expect(a?.properties.age).toBe(30);
    expect(a?.contextIds).toEqual([ctx]);

    // Find related to A (should include B)
    const relatedToA = await memory.graph.findRelated("A");
    expect(relatedToA.some((e) => e.id === "B")).toBe(true);

    // Update B and verify changes
    await memory.graph.updateEntity("B", {
      name: "Bobby",
      properties: { age: 32, role: "friend" },
      contextIds: [ctx],
    });
    const b = await memory.graph.getEntity("B");
    expect(b?.name).toBe("Bobby");
    expect(b?.properties.age).toBe(32);
    expect(b?.properties.role).toBe("friend");

    // Path A -> C exists via B
    const pathEntities = await memory.graph.findPath("A", "C");
    expect(pathEntities.map((e) => e.id)).toEqual(["A", "B", "C"]);

    // Remove B and verify it and its edges are gone
    const removed = await memory.graph.removeEntity("B");
    expect(removed).toBe(true);
    expect(await memory.graph.getEntity("B")).toBeNull();

    const relatedAfter = await memory.graph.findRelated("A");
    expect(relatedAfter.some((e) => e.id === "B")).toBe(false);

    // Path A -> C should no longer exist
    const pathAfter = await memory.graph.findPath("A", "C");
    expect(pathAfter.length).toBe(0);
  });
});
