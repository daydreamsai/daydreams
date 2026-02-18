import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { MemorySystem } from "..";
import {
  InMemoryKeyValueProvider,
  InMemoryVectorProvider,
  InMemoryGraphProvider,
} from "../providers/in-memory";

describe("WorkingMemoryImpl basic behavior", () => {
  let memory: MemorySystem;
  const contextId = "wm-test-ctx";

  beforeAll(async () => {
    memory = new MemorySystem({
      providers: {
        kv: new InMemoryKeyValueProvider(),
        vector: new InMemoryVectorProvider(),
        graph: new InMemoryGraphProvider(),
      },
    });
    await memory.initialize();
    await memory.working.clear(contextId);
  });

  afterAll(async () => {
    await memory.close();
  });

  it("pushes refs into correct buckets, summarizes, and clears", async () => {
    const now = Date.now();
    const mk = (ref: string) => ({
      id: `${ref}-${Math.random().toString(36).slice(2)}`,
      ref,
      timestamp: now,
    });

    // Push a variety of ref types concurrently to exercise locking
    await Promise.all([
      memory.working.push(contextId, mk("input") as any, {} as any, {} as any),
      memory.working.push(contextId, mk("output") as any, {} as any, {} as any),
      memory.working.push(
        contextId,
        mk("thought") as any,
        {} as any,
        {} as any
      ),
      memory.working.push(
        contextId,
        mk("action_call") as any,
        {} as any,
        {} as any
      ),
      memory.working.push(
        contextId,
        mk("action_result") as any,
        {} as any,
        {} as any
      ),
      memory.working.push(contextId, mk("event") as any, {} as any, {} as any),
      memory.working.push(contextId, mk("step") as any, {} as any, {} as any),
      memory.working.push(contextId, mk("run") as any, {} as any, {} as any),
    ]);

    const data = await memory.working.get(contextId);
    expect(data.inputs.length).toBe(1);
    expect(data.outputs.length).toBe(1);
    expect(data.thoughts.length).toBe(1);
    expect(data.calls.length).toBe(1);
    expect(data.results.length).toBe(1);
    expect(data.events.length).toBe(1);
    expect(data.steps.length).toBe(1);
    expect(data.runs.length).toBe(1);

    const summary = await memory.working.summarize(contextId);
    expect(summary).toContain("Working memory contains:");
    // Extract the JSON object from the summary string
    const jsonPart = summary.split("Working memory contains: ")[1];
    const counts = JSON.parse(jsonPart);
    expect(counts.inputs).toBe(1);
    expect(counts.outputs).toBe(1);

    await memory.working.clear(contextId);
    const cleared = await memory.working.get(contextId);
    expect(cleared.inputs.length).toBe(0);
    expect(cleared.outputs.length).toBe(0);
    expect(cleared.thoughts.length).toBe(0);
    expect(cleared.calls.length).toBe(0);
    expect(cleared.results.length).toBe(0);
    expect(cleared.events.length).toBe(0);
    expect(cleared.steps.length).toBe(0);
    expect(cleared.runs.length).toBe(0);
  });

  it("auto-creates on get and supports set/get round-trip", async () => {
    const cid = "wm-auto-create";
    // No prior create call; get should auto-create
    const initial = await memory.working.get(cid);
    expect(initial.inputs.length).toBe(0);
    expect(initial.outputs.length).toBe(0);

    // Modify and persist via set
    initial.inputs.push({ id: "i1", ref: "input", timestamp: Date.now() } as any);
    await memory.working.set(cid, initial);

    const after = await memory.working.get(cid);
    expect(after.inputs.length).toBe(1);
  });

  it("handles concurrent pushes safely via context lock", async () => {
    const cid = "wm-concurrent";
    await memory.working.clear(cid);

    const now = Date.now();
    const mk = (ref: string, i: number) => ({ id: `${ref}-${i}`, ref, timestamp: now + i });

    const pushes: Promise<void>[] = [];
    for (let i = 0; i < 25; i++) {
      pushes.push(memory.working.push(cid, mk("input", i) as any, {} as any, {} as any));
      pushes.push(memory.working.push(cid, mk("output", i) as any, {} as any, {} as any));
    }
    await Promise.all(pushes);

    const data = await memory.working.get(cid);
    expect(data.inputs.length).toBe(25);
    expect(data.outputs.length).toBe(25);
  });

  it("falls back unknown ref types to events bucket", async () => {
    const cid = "wm-unknown-ref";
    await memory.working.clear(cid);
    await memory.working.push(
      cid,
      { id: "u1", ref: "unknown", timestamp: Date.now() } as any,
      {} as any,
      {} as any
    );
    const data = await memory.working.get(cid);
    expect(data.events.length).toBe(1);
  });
});
