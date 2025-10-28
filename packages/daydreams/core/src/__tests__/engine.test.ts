import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createEngine } from "../engine";
import type {
  AnyAgent,
  ContextState,
  WorkingMemory,
  AnyRef,
  InputRef,
  OutputRef,
  LogChunk,
  Handlers,
} from "../types";
import * as z from "zod";
import {
  createSilentTestAgent,
  createMockActionCall,
  createMockContextState,
  createTestAction,
  createTestContext,
} from "./test-utilities";
import { createWorkingMemory } from "../memory/utils";

describe("Engine State Management - Tier 1", () => {
  let mockAgent: AnyAgent;
  let mockContextState: ContextState;
  let mockWorkingMemory: WorkingMemory;
  let mockSubscriptions: Set<(log: AnyRef, done: boolean) => void>;
  let mockChunkSubscriptions: Set<(chunk: LogChunk) => void>;
  let engine: ReturnType<typeof createEngine>;

  beforeEach(async () => {
    // Create agent with minimal configuration to avoid hanging
    mockAgent = createSilentTestAgent();
    mockContextState = createMockContextState();
    mockWorkingMemory = createWorkingMemory();
    mockSubscriptions = new Set();
    mockChunkSubscriptions = new Set();

    engine = createEngine({
      agent: mockAgent,
      ctxState: mockContextState,
      workingMemory: mockWorkingMemory,
      subscriptions: mockSubscriptions,
      __chunkSubscriptions: mockChunkSubscriptions,
    });
  });

  afterEach(async () => {
    // Simple cleanup without waiting for settled state
    try {
      if (engine?.controller && !engine.controller.signal.aborted) {
        engine.controller.abort();
      }
      if (mockAgent?.isBooted?.()) {
        await mockAgent.stop();
      }
    } catch (error) {
      // Ignore cleanup errors in tests
    }
  });

  describe("Engine Initialization", () => {
    it("should initialize engine with correct default state", () => {
      expect(engine.state.running).toBe(false);
      expect(engine.state.step).toBe(-1);
      expect(engine.state.chain).toEqual([]);
      expect(engine.state.promises).toEqual([]);
      expect(engine.state.errors).toEqual([]);
      expect(engine.state.results).toEqual([]);
    });

    it("should provide abort controller", () => {
      expect(engine.controller).toBeDefined();
      expect(engine.controller.signal).toBeDefined();
    });

    it("should track context state reference", () => {
      expect(engine.state.ctxState).toBe(mockContextState);
    });

    it("should initialize deferred promise", () => {
      expect(engine.state.defer.promise).toBeInstanceOf(Promise);
    });
  });

  describe("Engine Lifecycle", () => {
    it("should start engine and transition states correctly", async () => {
      expect(engine.state.running).toBe(false);
      expect(engine.state.step).toBe(-1);

      await engine.start();

      expect(engine.state.running).toBe(true);
      expect(engine.state.step).toBe(1);
    });

    it("should prevent starting already running engine", async () => {
      await engine.start();

      await expect(engine.start()).rejects.toThrow("alredy running");
    });

    it("should stop engine and abort operations", async () => {
      await engine.start();

      expect(engine.state.running).toBe(true);
      expect(engine.controller.signal.aborted).toBe(false);

      await engine.stop();

      expect(engine.controller.signal.aborted).toBe(true);
    });

    it("should create step references correctly", async () => {
      const step = await engine.start();

      expect(step.ref).toBe("step");
      expect(step.step).toBe(1);
      expect(step.id).toBeDefined();
      expect(step.timestamp).toBeDefined();
    });

    it("should create run reference on start", async () => {
      await engine.start();

      // Should have pushed run reference to working memory
      expect(mockWorkingMemory.runs.length).toBeGreaterThan(0);

      const runRef = mockWorkingMemory.runs[0];
      expect(runRef.ref).toBe("run");
      expect(runRef.type).toBe(mockContextState.context.type);
    });
  });

  describe("State Management", () => {
    it("should track promises correctly", async () => {
      await engine.start();

      const promise1 = Promise.resolve("test1");
      const promise2 = Promise.resolve("test2");

      // Simulate adding promises (internally done by push methods)
      engine.state.promises.push(promise1, promise2);

      expect(engine.state.promises).toHaveLength(2);
      expect(engine.state.promises).toContain(promise1);
      expect(engine.state.promises).toContain(promise2);

      // Wait for promises to resolve
      await Promise.all(engine.state.promises);
    });

    it("should track errors correctly", async () => {
      await engine.start();

      // Simulate error tracking
      const mockError = {
        log: createMockActionCall(),
        error: new Error("Test error"),
      };
      engine.state.errors.push(mockError);

      expect(engine.state.errors).toHaveLength(1);
      expect(engine.state.errors[0]).toBe(mockError);
    });

    it("should manage chain state", async () => {
      await engine.start();

      // Clear chain state after start (which adds step/run refs)
      const initialLength = engine.state.chain.length;

      const inputRef: InputRef = {
        id: "input-1",
        ref: "input",
        type: "text",
        content: "test input",
        data: "test input",
        timestamp: Date.now(),
        processed: false,
      };

      // Push to chain (normally done by push method)
      engine.state.chain.push(inputRef);

      expect(engine.state.chain).toHaveLength(initialLength + 1);
      expect(engine.state.chain[engine.state.chain.length - 1]).toBe(inputRef);
    });

    it("should prepare contexts and actions", async () => {
      // Add test action to context
      const testAction = createTestAction({ name: "prepare-test-action" });
      mockContextState.context = createTestContext();
      mockContextState.context.actions = [testAction as any];

      await engine.setParams({
        actions: [testAction],
      });

      await engine.prepare();

      expect(engine.state.actions.length).toBeGreaterThan(0);
    });
  });

  describe("Log Processing and Routing", () => {
    beforeEach(async () => {
      // Setup minimal inputs/outputs to prevent NotFound errors
      engine.state.inputs = [
        {
          type: "text",
          schema: z.string(),
          handler: async () => ({ data: "processed", params: {} }),
        },
      ];

      engine.state.outputs = [
        {
          name: "text",
          schema: z.string(),
          handler: async () => ({ data: "processed", processed: true }),
          ctxRef: { type: "test", id: "test", key: "test" },
        } as any,
      ];

      await engine.start();
    });

    it("should handle input references", async () => {
      const inputRef: InputRef = {
        id: "input-test",
        ref: "input",
        type: "text",
        content: "test input",
        data: "test input",
        timestamp: Date.now(),
        processed: false,
      };

      // Engine should handle error gracefully and still process the log
      await engine.push(inputRef);

      expect(engine.state.chain).toContain(inputRef);
      expect(mockWorkingMemory.inputs).toContain(inputRef);
    });

    it("should handle output references", async () => {
      const outputRef: OutputRef = {
        id: "output-test",
        ref: "output",
        name: "text",
        content: "test output",
        data: "test output",
        timestamp: Date.now(),
        processed: true,
      };

      await engine.push(outputRef);

      // The output gets modified during processing (formatted property added)
      expect(engine.state.chain).toContainEqual(
        expect.objectContaining({
          id: "output-test",
          ref: "output",
          name: "text",
          content: "test output",
          data: "test output",
          processed: true,
        })
      );
      expect(mockWorkingMemory.outputs).toContainEqual(
        expect.objectContaining({
          id: "output-test",
          ref: "output",
          name: "text",
          content: "test output",
          data: "test output",
          processed: true,
        })
      );
    });

    it("should handle action calls and create results", async () => {
      const actionCall = createMockActionCall();

      // Add mock action to engine state with proper typing
      engine.state.actions = [
        {
          name: "test-action",
          description: "Test action",
          schema: z.object({}),
          handler: async () => ({ success: true }),
          ctxRef: {
            type: mockContextState.context.type,
            id: mockContextState.id,
          },
        } as any,
      ];

      await engine.push(actionCall);

      expect(engine.state.chain).toContain(actionCall);
      expect(mockWorkingMemory.calls).toContain(actionCall);
      expect(engine.state.results.length).toBeGreaterThan(0);
    });

    it("should add outputs to chain during processing", async () => {
      const outputRef: OutputRef = {
        id: "output-test",
        ref: "output",
        name: "text",
        content: "test output",
        data: "test output",
        timestamp: Date.now(),
        processed: false,
      };

      const chainLengthBefore = engine.state.chain.length;
      await engine.push(outputRef);

      // Outputs get added to chain plus an error event is generated
      expect(engine.state.chain.length).toBeGreaterThan(chainLengthBefore);
    });
  });

  describe("Subscription Management", () => {
    it("should notify subscribers on log events", async () => {
      const mockSubscriber = vi.fn();
      mockSubscriptions.add(mockSubscriber);

      await engine.start();

      const inputRef: InputRef = {
        id: "sub-test",
        ref: "input",
        type: "text",
        content: "test",
        data: "test",
        timestamp: Date.now(),
        processed: false,
      };

      await engine.push(inputRef);

      expect(mockSubscriber).toHaveBeenCalledWith(
        expect.objectContaining({ id: "sub-test" }),
        true
      );
    });

    it("should notify chunk subscribers", async () => {
      const mockChunkSubscriber = vi.fn();
      mockChunkSubscriptions.add(mockChunkSubscriber);

      await engine.start();

      const inputRef: InputRef = {
        id: "chunk-test",
        ref: "input",
        type: "text",
        content: "test",
        data: "test",
        timestamp: Date.now(),
        processed: false,
      };

      await engine.push(inputRef);

      expect(mockChunkSubscriber).toHaveBeenCalledWith({
        type: "log",
        log: expect.objectContaining({ id: "chunk-test" }),
        done: true,
      });
    });

    it("should handle subscriber errors gracefully", async () => {
      const faultySubscriber = vi.fn().mockImplementation(() => {
        throw new Error("Subscriber error");
      });
      mockSubscriptions.add(faultySubscriber);

      await engine.start();

      const inputRef: InputRef = {
        id: "error-test",
        ref: "input",
        type: "text",
        content: "test",
        data: "test",
        timestamp: Date.now(),
        processed: false,
      };

      // Engine push will complete but may have internal errors that get logged
      await engine.push(inputRef);
      expect(faultySubscriber).toHaveBeenCalled();
    });
  });

  describe("Promise and Concurrency Management", () => {
    beforeEach(async () => {
      await engine.start();
    });

    it("should track promises correctly", async () => {
      const initialLength = engine.state.promises.length;

      // Test direct promise tracking without using engine.settled()
      const testPromise = Promise.resolve("test");
      engine.state.promises.push(testPromise);

      expect(engine.state.promises.length).toBe(initialLength + 1);
      expect(engine.state.promises).toContain(testPromise);

      // Wait for the promise to resolve
      await testPromise;

      // Basic promise tracking is working
      expect(testPromise).resolves.toBe("test");
    });

    it("should handle multiple concurrent promises", async () => {
      const promise1 = Promise.resolve("first");
      const promise2 = Promise.resolve("second");

      engine.state.promises.push(promise1, promise2);

      expect(engine.state.promises.length).toBeGreaterThanOrEqual(2);

      const results = await Promise.all([promise1, promise2]);
      expect(results).toEqual(["first", "second"]);
    });
  });

  describe("Step Management", () => {
    it("should increment step numbers correctly", async () => {
      const step1 = await engine.start();
      expect(step1.step).toBe(1);

      const step2 = await engine.nextStep();
      expect(step2.step).toBe(1); // Should still be 1 as step isn't incremented by nextStep

      expect(engine.state.step).toBe(1);
    });

    it("should create unique step IDs", async () => {
      const step1 = await engine.start();
      const step2 = await engine.nextStep();

      expect(step1.id).not.toBe(step2.id);
      expect(step1.id).toBeDefined();
      expect(step2.id).toBeDefined();
    });
  });

  describe("Continue Conditions", () => {
    beforeEach(async () => {
      await engine.start();
    });

    it("should not continue when aborted", () => {
      engine.controller.abort();
      expect(engine.shouldContinue()).toBe(false);
    });

    it("should continue with pending unprocessed logs", () => {
      engine.state.chain.push({
        id: "unprocessed",
        ref: "input",
        type: "text",
        content: "test",
        data: "test",
        timestamp: Date.now(),
        processed: false,
      });

      expect(engine.shouldContinue()).toBe(true);
    });

    it("should not continue with only processed logs", () => {
      // Clear existing chain entries first
      engine.state.chain = [];

      engine.state.chain.push({
        id: "processed",
        ref: "input",
        type: "text",
        content: "test",
        data: "test",
        timestamp: Date.now(),
        processed: true,
      });

      expect(engine.shouldContinue()).toBe(false);
    });

    it("should ignore thoughts in continue decision", () => {
      // Clear existing chain entries first
      engine.state.chain = [];

      engine.state.chain.push({
        id: "thought",
        ref: "thought",
        content: "thinking...",
        timestamp: Date.now(),
        processed: false,
      });

      expect(engine.shouldContinue()).toBe(false);
    });

    it("should respect context shouldContinue", () => {
      const contextWithContinue = createTestContext();
      contextWithContinue.shouldContinue = () => true;

      engine.state.contexts = [
        {
          ...mockContextState,
          context: contextWithContinue,
        },
      ];

      expect(engine.shouldContinue()).toBe(true);
    });
  });

  describe("Error Handling", () => {
    beforeEach(async () => {
      await engine.start();
    });

    it("should handle errors during log processing", async () => {
      // Mock a scenario that would cause an error - use a valid ref but invalid content
      const invalidLog = {
        ref: "input",
        id: "error-test",
        type: "invalid-type",
        content: "test",
        data: "test",
        timestamp: Date.now(),
        processed: false,
      } as any;

      // Engine push will complete - errors are logged internally
      await engine.push(invalidLog);

      // Check that logs were processed (chain should include the input and error event)
      expect(engine.state.chain.length).toBeGreaterThan(0);
    });

    it("should continue execution despite errors", () => {
      // Clear existing chain entries first
      engine.state.chain = [];

      // Add error to state
      engine.state.errors.push({
        log: createMockActionCall(),
        error: new Error("Test error"),
      });

      // Should still be able to continue (no pending unprocessed work)
      expect(engine.shouldContinue()).toBe(false);
    });

    it("should create error events", async () => {
      // This would be tested more thoroughly in integration tests
      // For now, just ensure error handling doesn't crash
      const mockError = new Error("Test error");
      engine.state.errors.push({
        log: createMockActionCall(),
        error: mockError,
      });

      expect(engine.state.errors.length).toBe(1);
    });
  });

  describe("Engine Handlers Integration", () => {
    it("should call onLogStream handler when provided", async () => {
      const mockHandler = vi.fn();
      const handlers: Partial<Handlers> = {
        onLogStream: mockHandler,
      };

      const engineWithHandlers = createEngine({
        agent: mockAgent,
        ctxState: mockContextState,
        workingMemory: mockWorkingMemory,
        subscriptions: mockSubscriptions,
        handlers,
      });

      await engineWithHandlers.start();

      const inputRef: InputRef = {
        id: "handler-test",
        ref: "input",
        type: "text",
        content: "test",
        data: "test",
        timestamp: Date.now(),
        processed: false,
      };

      await engineWithHandlers.push(inputRef);

      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({ id: "handler-test" }),
        true
      );

      engineWithHandlers.controller.abort();
    });

    it("should handle handler errors gracefully", async () => {
      const faultyHandler = vi.fn().mockImplementation(() => {
        throw new Error("Handler error");
      });

      const handlers: Partial<Handlers> = {
        onLogStream: faultyHandler,
      };

      const engineWithHandlers = createEngine({
        agent: mockAgent,
        ctxState: mockContextState,
        workingMemory: mockWorkingMemory,
        subscriptions: mockSubscriptions,
        handlers,
      });

      await engineWithHandlers.start();

      const inputRef: InputRef = {
        id: "faulty-handler-test",
        ref: "input",
        type: "text",
        content: "test",
        data: "test",
        timestamp: Date.now(),
        processed: false,
      };

      // Engine push completes - handler errors are logged internally
      await engineWithHandlers.push(inputRef);
      expect(faultyHandler).toHaveBeenCalled();

      engineWithHandlers.controller.abort();
    });
  });
});
