import { describe, it, expect, vi } from "vitest";
import * as z from "zod";
import { handleActionCall } from "../handlers";
import { TaskRunner } from "../task";
import { createTestMemory, createMockContextState } from "./test-utilities";
import type { AnyAgent } from "../types";

function createAgent(): AnyAgent {
  const memory = createTestMemory();
  return {
    logger: { info: vi.fn(), debug: vi.fn(), error: vi.fn(), trace: vi.fn(), warn: vi.fn(), event: vi.fn() } as any,
    memory,
    taskRunner: new TaskRunner(1, { info: vi.fn(), debug: vi.fn(), error: vi.fn(), trace: vi.fn(), warn: vi.fn(), event: vi.fn() } as any) as any,
  } as any;
}

describe("Action behavior", () => {
  it("invokes onSuccess and sets formatted field", async () => {
    // Provide Promise.try polyfill for handler internals that use it
    (Promise as any).try = (fn: Function, ...args: any[]) => Promise.resolve().then(() => fn(...args));

    const agent = createAgent();
    await agent.memory.initialize();
    const ctxState = createMockContextState();

    const onSuccess = vi.fn(async () => {});

    const action = {
      name: "format-success",
      schema: z.object({}),
      handler: async () => ({ value: 1 }),
      ctxRef: { type: ctxState.context.type, id: ctxState.id },
      onSuccess,
      format: (result: any) => ({ info: `res:${result.data?.value}` }),
    } as any;

    const call = {
      ref: "action_call" as const,
      id: "fs-1",
      name: "format-success",
      content: "{}",
      data: {},
      timestamp: Date.now(),
      processed: false,
    };

    const callCtx: any = { ...ctxState, workingMemory: {}, actionMemory: undefined, agentMemory: undefined, abortSignal: new AbortController().signal, call };

    const res = await handleActionCall({
      action,
      logger: agent.logger as any,
      call,
      taskRunner: agent.taskRunner as any,
      agent,
      abortSignal: callCtx.abortSignal,
      callCtx,
    });

    expect(onSuccess).toHaveBeenCalled();
    expect(res.formatted?.info).toBe("res:1");

    // cleanup polyfill
    delete (Promise as any).try;
  });

  it("retries once then succeeds when action.retry=1", async () => {
    const agent = createAgent();
    await agent.memory.initialize();
    const ctxState = createMockContextState();

    let attempts = 0;
    const action = {
      name: "retry-once",
      schema: z.object({}),
      handler: async () => {
        attempts++;
        if (attempts === 1) throw new Error("first fail");
        return { ok: true };
      },
      retry: 1,
      ctxRef: { type: ctxState.context.type, id: ctxState.id },
    } as any;

    const call = {
      ref: "action_call" as const,
      id: "rt-1",
      name: "retry-once",
      content: "{}",
      data: {},
      timestamp: Date.now(),
      processed: false,
    };

    const callCtx: any = { ...ctxState, workingMemory: {}, actionMemory: undefined, agentMemory: undefined, abortSignal: new AbortController().signal, call };

    const res = await handleActionCall({ action, logger: agent.logger as any, call, taskRunner: agent.taskRunner as any, agent, abortSignal: callCtx.abortSignal, callCtx });

    expect(res.data?.ok).toBe(true);
    expect(attempts).toBe(2);
  });
});

