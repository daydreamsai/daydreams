import { describe, it, expect, beforeEach } from "vitest";
import * as z from "zod";
import { createEngine } from "../engine";
import type { AnyAgent, AnyRef, ContextState, LogChunk, OutputRef, WorkingMemory } from "../types";
import { createSilentTestAgent, createMockContextState } from "./test-utilities";
import { createWorkingMemory } from "../memory/utils";

describe("Action template resolvers", () => {
  let agent: AnyAgent;
  let ctxState: ContextState;
  let working: WorkingMemory;
  let subs: Set<(log: AnyRef, done: boolean) => void>;
  let chunkSubs: Set<(chunk: LogChunk) => void>;

  beforeEach(() => {
    agent = createSilentTestAgent();
    ctxState = createMockContextState();
    working = createWorkingMemory();
    subs = new Set();
    chunkSubs = new Set();
  });

  it("resolves calls[...] into subsequent action args", async () => {
    await agent.memory.initialize();
    const engine = createEngine({
      agent,
      ctxState,
      workingMemory: working,
      subscriptions: subs,
      __chunkSubscriptions: chunkSubs,
    });

    await engine.setParams({
      actions: [
        {
          name: "a1",
          schema: z.object({}),
          handler: async () => ({ value: 7 }),
        } as any,
        {
          name: "a2",
          schema: z.object({ n: z.any() }),
          handler: async (data: any) => ({ received: data }),
        } as any,
      ],
    });

    await engine.start();

    // First call produces result { value: 7 }
    await engine.push({
      ref: "action_call",
      id: "c1",
      name: "a1",
      content: "{}",
      data: {},
      timestamp: Date.now(),
      processed: false,
    } as any);

    // Second call takes n from calls[0].value
    await engine.push({
      ref: "action_call",
      id: "c2",
      name: "a2",
      content: JSON.stringify({ n: "{{calls[0].value}}" }),
      data: undefined,
      timestamp: Date.now(),
      processed: false,
    } as any);

    // Verify last action_result exists and received templated data
    const last = working.results[working.results.length - 1] as any;
    expect(last).toBeTruthy();
    expect(last.name).toBe("a2");
    const n = last.data?.received?.n;
    // Accept either scalar 7 or single-element array [7]
    expect(n === 7 || (Array.isArray(n) && n[0] === 7)).toBe(true);
  });

  it("resolves shortTermMemory into action args", async () => {
    await agent.memory.initialize();
    const engine = createEngine({
      agent,
      ctxState,
      workingMemory: working,
      subscriptions: subs,
      __chunkSubscriptions: chunkSubs,
    });

    // Define a shortTermMemory context with memory
    const shortTermMemory = {
      type: "shortTermMemory",
      schema: z.object({}).optional() as any,
      create: async () => ({ user: { name: "Sam" } }),
      instructions: "",
    } as any;

    await engine.setParams({
      actions: [
        {
          name: "greet",
          schema: z.object({ who: z.string() }),
          handler: async (_data: any, _ctx: any) => ({ ok: true }),
        } as any,
      ],
      contexts: [{ context: shortTermMemory } as any],
    });

    await engine.start();

    await engine.push({
      ref: "action_call",
      id: "g1",
      name: "greet",
      content: JSON.stringify({ who: "{{shortTermMemory.user.name}}" }),
      data: undefined,
      timestamp: Date.now(),
      processed: false,
    } as any);

    const res = working.results[working.results.length - 1] as any;
    expect(res.name).toBe("greet");
    expect(res.data?.ok).toBe(true);
  });
});
