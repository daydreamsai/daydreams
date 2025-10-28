import { describe, it, expect, vi } from "vitest";
import * as z from "zod";
import { handleActionCall } from "../handlers";
import { TaskRunner } from "../task";
import { createMockContextState, createTestMemory } from "./test-utilities";
import type { AnyAgent } from "../types";

describe("Action execution unit tests", () => {
  function createAgent(): AnyAgent {
    const memory = createTestMemory();
    return {
      logger: { info: vi.fn(), debug: vi.fn(), error: vi.fn(), trace: vi.fn(), warn: vi.fn(), event: vi.fn() } as any,
      memory,
      taskRunner: { enqueueTask: vi.fn(async () => ({ ok: true })) } as any,
    } as any;
  }

  it("passes explicit queueKey to TaskRunner", async () => {
    const agent = createAgent();
    await agent.memory.initialize();
    const ctxState = createMockContextState();
    const action = {
      name: "q-action",
      schema: z.object({}),
      handler: async () => ({ ok: true }),
      ctxRef: { type: ctxState.context.type, id: ctxState.id },
    } as any;

    const call = {
      ref: "action_call" as const,
      id: "q-1",
      name: "q-action",
      content: "{}",
      data: {},
      timestamp: Date.now(),
      processed: false,
    };

    const callCtx: any = { ...ctxState, workingMemory: {}, actionMemory: undefined, agentMemory: undefined, abortSignal: new AbortController().signal, call };

    await handleActionCall({
      action,
      logger: agent.logger as any,
      call,
      taskRunner: agent.taskRunner as any,
      agent,
      abortSignal: callCtx.abortSignal,
      callCtx,
      queueKey: "explicit-queue",
    });

    const enqueue = (agent.taskRunner.enqueueTask as any as ReturnType<typeof vi.fn>);
    expect(enqueue).toHaveBeenCalled();
    const args = enqueue.mock.calls[0][2];
    expect(args.queueKey).toBe("explicit-queue");
  });

  it("derives queueKey from action.queueKey string or function", async () => {
    const agent = createAgent();
    const ctxState = createMockContextState();
    const base = {
      schema: z.object({}),
      handler: async () => ({ ok: true }),
      ctxRef: { type: ctxState.context.type, id: ctxState.id },
    } as any;

    const call = {
      ref: "action_call" as const,
      id: "q-2",
      name: "a1",
      content: "{}",
      data: {},
      timestamp: Date.now(),
      processed: false,
    };

    const callCtx: any = { ...ctxState, workingMemory: {}, actionMemory: undefined, agentMemory: undefined, abortSignal: new AbortController().signal, call };

    // string
    const a1 = { ...base, name: "a1", queueKey: "from-action" } as any;
    await handleActionCall({ action: a1, logger: agent.logger as any, call, taskRunner: agent.taskRunner as any, agent, abortSignal: callCtx.abortSignal, callCtx });
    let args = (agent.taskRunner.enqueueTask as any).mock.calls.pop()[2];
    expect(args.queueKey).toBe("from-action");

    // function
    const a2 = { ...base, name: "a2", queueKey: (ctx: any) => `from-${ctx.call.id}` } as any;
    call.name = "a2";
    await handleActionCall({ action: a2, logger: agent.logger as any, call, taskRunner: agent.taskRunner as any, agent, abortSignal: callCtx.abortSignal, callCtx });
    args = (agent.taskRunner.enqueueTask as any).mock.calls.pop()[2];
    expect(args.queueKey).toBe("from-q-2");
  });

  it("persists actionMemory when actionState is provided", async () => {
    const agent = createAgent();
    const ctxState = createMockContextState();
    const action = {
      name: "stateful",
      schema: z.object({}),
      handler: async (_: any, ctx: any) => {
        ctx.actionMemory = { counter: 1 };
        return { ok: true };
      },
      actionState: { key: "action:stateful", create: () => ({ counter: 0 }) },
      ctxRef: { type: ctxState.context.type, id: ctxState.id },
    } as any;

    const call = {
      ref: "action_call" as const,
      id: "st-1",
      name: "stateful",
      content: "{}",
      data: {},
      timestamp: Date.now(),
      processed: false,
    };

    const callCtx: any = { ...ctxState, workingMemory: {}, actionMemory: undefined, agentMemory: undefined, abortSignal: new AbortController().signal, call };

    const setSpy = vi.spyOn(agent.memory.kv, "set").mockResolvedValue(void 0 as any);

    // Use a real TaskRunner so the handler executes and mutates callCtx
    const runner = new TaskRunner(1, agent.logger as any);

    await handleActionCall({ action, logger: agent.logger as any, call, taskRunner: runner as any, agent, abortSignal: callCtx.abortSignal, callCtx });

    expect(setSpy).toHaveBeenCalledWith("action:stateful", { counter: 1 });
  });
});
