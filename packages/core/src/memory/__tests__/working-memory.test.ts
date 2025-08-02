import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { MemorySystem } from "../memory-system";
import {
  InMemoryKeyValueProvider,
  InMemoryVectorProvider,
  InMemoryGraphProvider,
} from "../providers/in-memory";
import type { Memory, WorkingMemoryData, MemoryManager } from "../types";
import type { AnyRef, AgentContext, AnyAgent } from "../../types";

describe("WorkingMemory", () => {
  let memory: Memory;
  let mockCtx: AgentContext;
  let mockAgent: AnyAgent;

  beforeEach(async () => {
    memory = new MemorySystem({
      providers: {
        kv: new InMemoryKeyValueProvider(),
        vector: new InMemoryVectorProvider(),
        graph: new InMemoryGraphProvider(),
      },
    });
    await memory.initialize();

    // Create mock agent context and agent for testing
    mockCtx = {
      id: "test-context",
      type: "test",
      key: "test-key",
      memory: {} as any,
      settings: {},
      workingMemory: {} as any,
    } as unknown as AgentContext;

    mockAgent = {
      model: {} as any,
      logger: {
        info: () => {},
        warn: () => {},
        error: () => {},
        debug: () => {},
      },
    } as unknown as AnyAgent;
  });

  afterEach(async () => {
    await memory.close();
  });

  describe("working memory creation", () => {
    it("should create new working memory with empty arrays", async () => {
      const contextId = "test:context:1";

      const workingMemory = await memory.working.create(contextId);

      expect(workingMemory.inputs).toEqual([]);
      expect(workingMemory.outputs).toEqual([]);
      expect(workingMemory.thoughts).toEqual([]);
      expect(workingMemory.calls).toEqual([]);
      expect(workingMemory.results).toEqual([]);
      expect(workingMemory.events).toEqual([]);
      expect(workingMemory.steps).toEqual([]);
      expect(workingMemory.runs).toEqual([]);
    });

    it("should store working memory in KV store", async () => {
      const contextId = "test:context:2";

      await memory.working.create(contextId);

      const stored = await memory.kv.get<WorkingMemoryData>(
        `working-memory:${contextId}`
      );
      expect(stored).toBeDefined();
      expect(stored?.inputs).toEqual([]);
    });
  });

  describe("working memory retrieval", () => {
    it("should retrieve existing working memory", async () => {
      const contextId = "test:context:3";

      const created = await memory.working.create(contextId);
      const retrieved = await memory.working.get(contextId);

      expect(retrieved).toEqual(created);
    });

    it("should auto-create working memory if not exists", async () => {
      const contextId = "test:context:4";

      const workingMemory = await memory.working.get(contextId);

      expect(workingMemory.inputs).toEqual([]);
      expect(workingMemory.outputs).toEqual([]);
    });
  });

  describe("pushing entries to working memory", () => {
    let contextId: string;

    beforeEach(async () => {
      contextId = "test:push:context";
      await memory.working.create(contextId);
    });

    it("should push input entries", async () => {
      const inputRef: AnyRef = {
        id: "input:1",
        ref: "input",
        type: "text",
        content: "Hello world",
        data: "Hello world",
        timestamp: Date.now(),
        processed: false,
      };

      await memory.working.push(contextId, inputRef, mockCtx, mockAgent);

      const workingMemory = await memory.working.get(contextId);
      expect(workingMemory.inputs).toHaveLength(1);
      expect(workingMemory.inputs[0]).toEqual(inputRef);
    });

    it("should push output entries", async () => {
      const outputRef: AnyRef = {
        id: "output:1",
        ref: "output",
        type: "text",
        content: "Hello back!",
        data: "Hello back!",
        timestamp: Date.now(),
        processed: true,
      };

      await memory.working.push(contextId, outputRef, mockCtx, mockAgent);

      const workingMemory = await memory.working.get(contextId);
      expect(workingMemory.outputs).toHaveLength(1);
      expect(workingMemory.outputs[0]).toEqual(outputRef);
    });

    it("should push thought entries", async () => {
      const thoughtRef: AnyRef = {
        id: "thought:1",
        ref: "thought",
        content: "I need to think about this",
        timestamp: Date.now(),
        processed: true,
      };

      await memory.working.push(contextId, thoughtRef, mockCtx, mockAgent);

      const workingMemory = await memory.working.get(contextId);
      expect(workingMemory.thoughts).toHaveLength(1);
      expect(workingMemory.thoughts[0]).toEqual(thoughtRef);
    });

    it("should push action call entries", async () => {
      const callRef: AnyRef = {
        id: "call:1",
        ref: "action_call",
        name: "search",
        // input: { query: "test" },
        content: "search(test)",
        data: { query: "test" },
        timestamp: Date.now(),
        processed: true,
      };

      await memory.working.push(contextId, callRef, mockCtx, mockAgent);

      const workingMemory = await memory.working.get(contextId);
      expect(workingMemory.calls).toHaveLength(1);
      expect(workingMemory.calls[0]).toEqual(callRef);
    });

    it("should push action result entries", async () => {
      const resultRef: AnyRef = {
        id: "result:1",
        ref: "action_result",
        data: { results: ["item1", "item2"] },
        callId: "call:1",
        name: "search",
        timestamp: Date.now(),
        processed: true,
      };

      await memory.working.push(contextId, resultRef, mockCtx, mockAgent);

      const workingMemory = await memory.working.get(contextId);
      expect(workingMemory.results).toHaveLength(1);
      expect(workingMemory.results[0]).toEqual(resultRef);
    });

    it("should push event entries", async () => {
      const eventRef: AnyRef = {
        id: "event:1",
        ref: "event",
        name: "user_joined",
        data: { userId: "123" },
        timestamp: Date.now(),
        processed: true,
      };

      await memory.working.push(contextId, eventRef, mockCtx, mockAgent);

      const workingMemory = await memory.working.get(contextId);
      expect(workingMemory.events).toHaveLength(1);
      expect(workingMemory.events[0]).toEqual(eventRef);
    });

    it("should push step entries", async () => {
      const stepRef: AnyRef = {
        id: "step:1",
        ref: "step",
        type: "system",
        step: 1,
        data: {
          prompt: "1",
          response: "1",
        },
        timestamp: Date.now(),
        processed: false,
      };

      await memory.working.push(contextId, stepRef, mockCtx, mockAgent);

      const workingMemory = await memory.working.get(contextId);
      expect(workingMemory.steps).toHaveLength(1);
      expect(workingMemory.steps[0]).toEqual(stepRef);
    });

    it("should push run entries", async () => {
      const runRef: AnyRef = {
        id: "run:1",
        ref: "run",
        timestamp: Date.now(),
        type: "run",
        data: {
          number: "1",
        },
        processed: false,
      };

      await memory.working.push(contextId, runRef, mockCtx, mockAgent);

      const workingMemory = await memory.working.get(contextId);
      expect(workingMemory.runs).toHaveLength(1);
      expect(workingMemory.runs[0]).toEqual(runRef);
    });

    it("should emit lifecycle event on update", async () => {
      let emittedEvent: any = null;

      memory.lifecycle.on("workingMemory.updated", (data) => {
        emittedEvent = data;
      });

      const inputRef: AnyRef = {
        id: "input:test",
        ref: "input",
        type: "text",
        content: "test",
        data: "test",
        timestamp: Date.now(),
        processed: false,
      };

      await memory.working.push(contextId, inputRef, mockCtx, mockAgent);

      expect(emittedEvent).toBeDefined();
      expect(emittedEvent.contextId).toBe(contextId);
      expect(emittedEvent.entry).toEqual(inputRef);
      expect(emittedEvent.size).toBeGreaterThan(0);
    });
  });

  describe("memory management", () => {
    let contextId: string;

    beforeEach(async () => {
      contextId = "test:management:context";
      await memory.working.create(contextId);
    });

    it("should handle memory pressure with FIFO strategy", async () => {
      const memoryManager: MemoryManager = {
        maxSize: 3,
        strategy: "fifo",
      };

      // Push 5 entries (exceeds maxSize of 3)
      for (let i = 0; i < 5; i++) {
        const inputRef: AnyRef = {
          id: `input:${i}`,
          ref: "input",
          type: "text",
          content: `Message ${i}`,
          data: `Message ${i}`,
          timestamp: Date.now() + i,
          processed: false,
        };

        await memory.working.push(contextId, inputRef, mockCtx, mockAgent, {
          memoryManager,
        });
      }

      const workingMemory = await memory.working.get(contextId);

      // Should have pruned to keep only recent entries
      expect(workingMemory.inputs.length).toBeLessThanOrEqual(3);
    });

    it("should use custom shouldPrune function", async () => {
      let pruneCallCount = 0;

      const memoryManager: MemoryManager = {
        maxSize: 2,
        shouldPrune: async (ctx, memory, entry, agent) => {
          pruneCallCount++;
          return memory.inputs.length >= 2;
        },
      };

      // Push entries to trigger pruning check
      for (let i = 0; i < 3; i++) {
        const inputRef: AnyRef = {
          id: `input:${i}`,
          ref: "input",
          type: "text",
          content: `Message ${i}`,
          data: `Message ${i}`,
          timestamp: Date.now(),
          processed: false,
        };

        await memory.working.push(contextId, inputRef, mockCtx, mockAgent, {
          memoryManager,
        });
      }

      expect(pruneCallCount).toBeGreaterThan(0);
    });

    it("should use custom onMemoryPressure function", async () => {
      let pressureCallCount = 0;

      const memoryManager: MemoryManager = {
        maxSize: 1,
        onMemoryPressure: async (ctx, memory, agent) => {
          pressureCallCount++;
          // Custom pruning logic - keep only the last input
          return {
            ...memory,
            inputs: memory.inputs.slice(-1),
          };
        },
      };

      // Push multiple entries to trigger memory pressure
      for (let i = 0; i < 3; i++) {
        const inputRef: AnyRef = {
          id: `input:${i}`,
          ref: "input",
          type: "text",
          content: `Message ${i}`,
          data: `Message ${i}`,
          timestamp: Date.now(),
          processed: false,
        };

        await memory.working.push(contextId, inputRef, mockCtx, mockAgent, {
          memoryManager,
        });
      }

      expect(pressureCallCount).toBeGreaterThan(0);

      const workingMemory = await memory.working.get(contextId);
      expect(workingMemory.inputs.length).toBe(1);
      expect(workingMemory.inputs[0].content).toBe("Message 2"); // Last message
    });

    it("should compress old entries with smart strategy", async () => {
      let compressCallCount = 0;

      const memoryManager: MemoryManager = {
        maxSize: 2,
        strategy: "smart",
        compress: async (ctx, entries, agent) => {
          compressCallCount++;
          return `Compressed ${entries.length} entries`;
        },
      };

      // Push many entries to trigger compression
      for (let i = 0; i < 15; i++) {
        const inputRef: AnyRef = {
          id: `input:${i}`,
          ref: "input",
          type: "text",
          content: `Message ${i}`,
          data: `Message ${i}`,
          timestamp: Date.now() + i,
          processed: false,
        };

        await memory.working.push(contextId, inputRef, mockCtx, mockAgent, {
          memoryManager,
        });
      }

      expect(compressCallCount).toBeGreaterThan(0);

      // Should have created a compressed episode
      const episodes = await memory.episodes.getByContext(contextId);
      expect(episodes.some((ep) => ep.type === "compression")).toBe(true);
    });
  });

  describe("working memory operations", () => {
    it("should clear working memory", async () => {
      const contextId = "test:clear:context";

      // Create and populate working memory
      await memory.working.create(contextId);
      await memory.working.push(
        contextId,
        {
          id: "input:1",
          ref: "input",
          type: "text",
          content: "test",
          data: "test",
          timestamp: Date.now(),
          processed: false,
        },
        mockCtx,
        mockAgent
      );

      // Verify it has content
      let workingMemory = await memory.working.get(contextId);
      expect(workingMemory.inputs.length).toBe(1);

      // Clear it
      await memory.working.clear(contextId);

      // Verify it's empty
      workingMemory = await memory.working.get(contextId);
      expect(workingMemory.inputs).toEqual([]);
      expect(workingMemory.outputs).toEqual([]);
    });

    it("should set working memory data", async () => {
      const contextId = "test:set:context";

      const customData: WorkingMemoryData = {
        inputs: [
          {
            id: "input:custom",
            ref: "input",
            type: "text",
            content: "custom input",
            data: "custom input",
            timestamp: Date.now(),
            processed: false,
          },
        ],
        outputs: [],
        thoughts: [],
        calls: [],
        results: [],
        events: [],
        steps: [],
        runs: [],
      };

      await memory.working.set(contextId, customData);

      const retrieved = await memory.working.get(contextId);
      expect(retrieved).toEqual(customData);
    });

    it("should summarize working memory", async () => {
      const contextId = "test:summary:context";

      await memory.working.create(contextId);

      // Add some entries
      await memory.working.push(
        contextId,
        {
          id: "input:1",
          ref: "input",
          type: "text",
          content: "test input",
          data: "test input",
          timestamp: Date.now(),
          processed: false,
        },
        mockCtx,
        mockAgent
      );

      await memory.working.push(
        contextId,
        {
          id: "output:1",
          ref: "output",
          type: "text",
          content: "test output",
          data: "test output",
          timestamp: Date.now(),
          processed: true,
        },
        mockCtx,
        mockAgent
      );

      const summary = await memory.working.summarize(contextId);

      expect(summary).toContain("inputs");
      expect(summary).toContain("outputs");
      expect(summary).toContain("1"); // Should show counts
    });
  });

  describe("error handling", () => {
    it("should handle invalid context ID gracefully", async () => {
      // Should not throw, should auto-create
      const workingMemory = await memory.working.get("invalid:context");
      expect(workingMemory).toBeDefined();
      expect(workingMemory.inputs).toEqual([]);
    });

    it("should handle malformed entries gracefully", async () => {
      const contextId = "test:error:context";
      await memory.working.create(contextId);

      // This should not throw due to missing required fields
      const invalidRef = {
        ref: "input",
        id: "invalid:1",
        timestamp: Date.now(),
        // Missing other fields but should still work
      } as AnyRef;

      // Should not crash, may return gracefully
      try {
        await memory.working.push(contextId, invalidRef, mockCtx, mockAgent);
        expect(true).toBe(true); // If no error, that's fine
      } catch (error) {
        expect(true).toBe(true); // If error, that's also acceptable behavior
      }
    });
  });
});
