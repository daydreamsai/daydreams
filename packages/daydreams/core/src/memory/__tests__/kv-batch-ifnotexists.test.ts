import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { MemorySystem } from "..";
import {
  InMemoryKeyValueProvider,
  InMemoryVectorProvider,
  InMemoryGraphProvider,
} from "../providers/in-memory";

describe("KeyValueMemory setBatch with ifNotExists semantics", () => {
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
  });

  afterAll(async () => {
    await memory.close();
  });

  it("throws on existing key and partially applies prior entries", async () => {
    await memory.kv.set("batch:unique", 1);

    const entries = new Map<string, number>([
      ["ok:1", 100],
      ["batch:unique", 999], // collision
      ["ok:2", 200], // should not be applied due to earlier throw
    ]);

    await expect(
      memory.kv.setBatch(entries, { ifNotExists: true })
    ).rejects.toBeTruthy();

    // First entry applied
    expect(await memory.kv.get("ok:1")).toBe(100);
    // Conflicting key remains original
    expect(await memory.kv.get("batch:unique")).toBe(1);
    // Subsequent entry not applied due to throw
    expect(await memory.kv.get("ok:2")).toBeNull();
  });
});
