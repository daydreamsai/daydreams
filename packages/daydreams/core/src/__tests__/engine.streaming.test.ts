import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createEngine } from "../engine";
import type { AnyAgent, AnyRef, ContextState, Handlers, LogChunk, OutputRef, WorkingMemory } from "../types";
import * as z from "zod";
import { createSilentTestAgent, createMockContextState } from "./test-utilities";
import { createWorkingMemory } from "../memory/utils";

describe("Engine Streaming - Processed Outputs", () => {
  let mockAgent: AnyAgent;
  let mockContextState: ContextState;
  let mockWorkingMemory: WorkingMemory;
  let subscriptions: Set<(log: AnyRef, done: boolean) => void>;
  let chunkSubscriptions: Set<(chunk: LogChunk) => void>;

  beforeEach(() => {
    mockAgent = createSilentTestAgent();
    mockContextState = createMockContextState();
    mockWorkingMemory = createWorkingMemory();
    subscriptions = new Set();
    chunkSubscriptions = new Set();
  });

  afterEach(async () => {
    try {
      if (mockAgent?.isBooted?.()) await mockAgent.stop();
    } catch {}
  });

  it("streams processed outputs to onLogStream subscribers", async () => {
    const onLogStream = vi.fn();
    const handlers: Partial<Handlers> = { onLogStream };

    const engine = createEngine({
      agent: mockAgent,
      ctxState: mockContextState,
      workingMemory: mockWorkingMemory,
      subscriptions,
      handlers,
      __chunkSubscriptions: chunkSubscriptions,
    });

    // Override outputs via engine params to avoid being overwritten during prepare()
    await engine.setParams({
      outputs: {
        unit_text: {
          schema: z.string(),
          // no handler -> default processing branch
        } as any,
      },
    });

    await engine.start();

    const outputRef: OutputRef = {
      id: "out-1",
      ref: "output",
      name: "unit_text",
      content: "hello",
      data: "hello",
      timestamp: Date.now(),
      processed: false,
    };

    await engine.push(outputRef);

    // Filter events for this output id
    const callsForOut = onLogStream.mock.calls
      .map((args) => args[0] as AnyRef)
      .filter((log) => log.ref === "output" && log.id === "out-1");

    // Only the processed output is streamed (stub is not streamed)
    expect(callsForOut.length).toBe(1);
    expect(callsForOut.some((l) => (l as any).processed === true)).toBe(true);
  });

  it("streams processed outputs to chunk subscribers", async () => {
    const onChunk = vi.fn();
    chunkSubscriptions.add(onChunk);

    const engine = createEngine({
      agent: mockAgent,
      ctxState: mockContextState,
      workingMemory: mockWorkingMemory,
      subscriptions,
      __chunkSubscriptions: chunkSubscriptions,
    });

    // Override outputs via engine params to avoid being overwritten during prepare()
    await engine.setParams({
      outputs: {
        unit_text: {
          schema: z.string(),
        } as any,
      },
    });

    await engine.start();

    const outputRef: OutputRef = {
      id: "out-2",
      ref: "output",
      name: "unit_text",
      content: "world",
      data: "world",
      timestamp: Date.now(),
      processed: false,
    };

    await engine.push(outputRef);

    const chunksForOut = onChunk.mock.calls
      .map((args) => args[0] as LogChunk)
      .filter((chunk) => chunk.type === "log" && (chunk as any).log?.ref === "output" && (chunk as any).log?.id === "out-2");

    // Expect both the initial stub and the processed output to be chunked
    expect(chunksForOut.length).toBeGreaterThanOrEqual(2);
  });

  it("streams action_result to subscribers and chunks", async () => {
    const onLogStream = vi.fn();
    const onChunk = vi.fn();
    chunkSubscriptions.add(onChunk);

    const handlers: Partial<Handlers> = { onLogStream };

    const engine = createEngine({
      agent: mockAgent,
      ctxState: mockContextState,
      workingMemory: mockWorkingMemory,
      subscriptions,
      handlers,
      __chunkSubscriptions: chunkSubscriptions,
    });

    // Provide an action via engine params so prepare() registers it
    await engine.setParams({
      actions: [
        {
          name: "stream-action",
          description: "",
          schema: z.object({}),
          handler: async () => ({ ok: true }),
        } as any,
      ],
    });

    await engine.start();

    const call = {
      ref: "action_call" as const,
      id: "call-1",
      name: "stream-action",
      content: "{}",
      data: {},
      timestamp: Date.now(),
      processed: false,
    };

    await engine.push(call as any);

    const actionResults = onLogStream.mock.calls
      .map((a) => a[0] as AnyRef)
      .filter((r) => r.ref === "action_result" && (r as any).name === "stream-action");

    const actionResultChunks = onChunk.mock.calls
      .map((a) => a[0] as LogChunk)
      .filter((c) => c.type === "log" && (c as any).log?.ref === "action_result");

    expect(actionResults.length + actionResultChunks.length).toBeGreaterThan(0);
  });

  it("streams error action_result when action handler throws", async () => {
    const onLogStream = vi.fn();
    const handlers: Partial<Handlers> = { onLogStream };

    const engine = createEngine({
      agent: mockAgent,
      ctxState: mockContextState,
      workingMemory: mockWorkingMemory,
      subscriptions,
      handlers,
      __chunkSubscriptions: chunkSubscriptions,
    });

    await engine.setParams({
      actions: [
        {
          name: "bad-action",
          schema: z.object({}),
          handler: async () => {
            throw new Error("boom");
          },
        } as any,
      ],
    });

    await engine.start();

    const call = {
      ref: "action_call" as const,
      id: "call-err",
      name: "bad-action",
      content: "{}",
      data: {},
      timestamp: Date.now(),
      processed: false,
    };

    await engine.push(call as any);

    const results = onLogStream.mock.calls
      .map((a) => a[0] as AnyRef)
      .filter((r) => r.ref === "action_result" && (r as any).name === "bad-action");

    expect(results.length).toBeGreaterThan(0);
    const res = results[results.length - 1] as any;
    expect(res.data?.error?.message || typeof res.data?.error === "string").toBeTruthy();
    expect(res.processed).toBe(false);
  });

  it("streams error event when output name is invalid (non-abort)", async () => {
    const onLogStream = vi.fn();
    const onChunk = vi.fn();
    const handlers: Partial<Handlers> = { onLogStream };
    chunkSubscriptions.add(onChunk);

    const engine = createEngine({
      agent: mockAgent,
      ctxState: mockContextState,
      workingMemory: mockWorkingMemory,
      subscriptions,
      handlers,
      __chunkSubscriptions: chunkSubscriptions,
    });

    await engine.start();

    const badOutput: OutputRef = {
      id: "bad-out",
      ref: "output",
      name: "unknown",
      content: "",
      data: "",
      timestamp: Date.now(),
      processed: false,
    } as any;

    await engine.push(badOutput);

    const errorEvents = onLogStream.mock.calls
      .map((a) => a[0] as AnyRef)
      .filter((r) => r.ref === "event" && (r as any).name === "error");

    const errorEventChunks = onChunk.mock.calls
      .map((a) => a[0] as LogChunk)
      .filter((c) => c.type === "log" && (c as any).log?.ref === "event" && (c as any).log?.name === "error");

    expect(errorEvents.length + errorEventChunks.length).toBeGreaterThan(0);
  });

  it("emits ParsingError event when output schema parsing fails", async () => {
    const onLogStream = vi.fn();
    const handlers: Partial<Handlers> = { onLogStream };

    const engine = createEngine({
      agent: mockAgent,
      ctxState: mockContextState,
      workingMemory: mockWorkingMemory,
      subscriptions,
      handlers,
      __chunkSubscriptions: chunkSubscriptions,
    });

    await engine.setParams({
      outputs: {
        unit_json: {
          schema: z.object({ foo: z.string() }),
        } as any,
      },
    });

    await engine.start();

    // Provide invalid JSON content to trigger ParsingError
    const badJson: OutputRef = {
      id: "bad-json",
      ref: "output",
      name: "unit_json",
      content: "not-json",
      data: undefined as any,
      timestamp: Date.now(),
      processed: false,
    } as any;

    await engine.push(badJson);

    const parsingErrors = onLogStream.mock.calls
      .map((a) => a[0] as AnyRef)
      .filter((r) => r.ref === "event" && (r as any).name === "error")
      .filter((e) => (e as any).data?.error?.name === "ParsingError");

    expect(parsingErrors.length).toBeGreaterThan(0);
  });

  it.todo("sets running=false when engine.stop() is called");
  it("sets running=false when engine.stop() is called", async () => {
    const engine = createEngine({
      agent: mockAgent,
      ctxState: mockContextState,
      workingMemory: mockWorkingMemory,
      subscriptions,
      __chunkSubscriptions: chunkSubscriptions,
    });

    await engine.start();
    expect(engine.state.running).toBe(true);

    await engine.stop();
    expect(engine.state.running).toBe(false);
    expect(engine.controller.signal.aborted).toBe(true);

    const badInput: any = {
      id: "stopped-1",
      ref: "input",
      type: "text",
      content: "x",
      data: "x",
      timestamp: Date.now(),
      processed: false,
    };
    await expect(engine.push(badInput)).rejects.toThrow(/not running/i);
  });

  it("emits error safely without unhandled rejection when aborted", async () => {
    const onLogStream = vi.fn();
    const onChunk = vi.fn();
    chunkSubscriptions.add(onChunk);
    const handlers = { onLogStream } as Partial<Handlers>;
    const engine = createEngine({
      agent: mockAgent,
      ctxState: mockContextState,
      workingMemory: mockWorkingMemory,
      subscriptions,
      handlers,
      __chunkSubscriptions: chunkSubscriptions,
    });

    // Start running so state.running remains true; we'll abort controller only
    await engine.start();
    engine.controller.abort("test-abort");

    // Push an output with unknown name to trigger error path
    const unknownOutput: OutputRef = {
      id: "unknown-out",
      ref: "output",
      name: "does_not_exist",
      content: "",
      data: "",
      timestamp: Date.now(),
      processed: false,
    } as any;

    // Push may reject depending on environment; ensure no unhandled rejection
    await engine.push(unknownOutput).catch(() => {});

    // Expect an error event to have been streamed
    // Engine records error and pushes an error event to working memory
    expect(engine.state.errors.length).toBeGreaterThan(0);
    expect(mockWorkingMemory.events.length).toBeGreaterThan(0);
  });
});
