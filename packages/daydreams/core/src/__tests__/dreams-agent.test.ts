import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createDreams } from "../dreams";
import { context } from "../context";
import { action } from "../utils";
import { 
  createTestAgent, 
  createAgentTestHelper,
  createMockLanguageModel,
  createTestMemory,
  createTestContext,
  createTestAction
} from "./test-utilities";
import type { Agent, Extension } from "../types";
import * as z from "zod";
import { LogLevel } from "../types";

describe("Agent Creation & Configuration - Tier 1", () => {
  let testAgent: Agent;

  afterEach(async () => {
    if (testAgent?.isBooted()) {
      await testAgent.stop();
    }
  });

  describe("Basic Agent Creation", () => {
    it("should create agent with minimal configuration", () => {
      const helper = createAgentTestHelper();
      
      helper.expectProperConfiguration();
      expect(helper.agent.isBooted()).toBe(false);
    });

    it("should create agent with custom model", () => {
      const customModel = createMockLanguageModel();
      testAgent = createTestAgent({ model: customModel });

      expect(testAgent.model).toBe(customModel);
    });

    it("should create agent with custom memory system", () => {
      const customMemory = createTestMemory();
      testAgent = createTestAgent({ memory: customMemory });

      expect(testAgent.memory).toBe(customMemory);
    });

    it("should handle missing model gracefully", () => {
      // Should not throw during creation
      expect(() => {
        testAgent = createTestAgent({ model: undefined });
      }).not.toThrow();

      expect(testAgent.model).toBeUndefined();
    });

    it("should set default log level", () => {
      testAgent = createTestAgent();
      
      expect(testAgent.logger).toBeDefined();
      // Logger should be configured with default level
    });

    it("should respect custom log level", () => {
      testAgent = createTestAgent({ logLevel: LogLevel.ERROR });
      
      expect(testAgent.logger).toBeDefined();
    });
  });

  describe("Context Registration", () => {
    it("should register single context correctly", () => {
      const testContext = createTestContext({ type: "single-test" });
      const helper = createAgentTestHelper({ 
        contexts: [testContext]
      });

      helper.expectContextRegistered("single-test");
    });

    it("should register multiple contexts correctly", () => {
      const context1 = createTestContext({ type: "context-1" });
      const context2 = createTestContext({ type: "context-2" });
      
      const helper = createAgentTestHelper({ 
        contexts: [context1, context2]
      });

      helper.expectContextRegistered("context-1");
      helper.expectContextRegistered("context-2");
    });

    it("should handle contexts with schemas", () => {
      const contextWithSchema = context({
        type: "schema-context",
        schema: z.object({
          userId: z.string(),
          sessionId: z.string()
        }),
        create: () => ({ userPrefs: {} })
      });

      const helper = createAgentTestHelper({ 
        contexts: [contextWithSchema]
      });

      helper.expectContextRegistered("schema-context");
    });

    it("should handle duplicate context types", () => {
      const context1 = createTestContext({ type: "duplicate" });
      const context2 = createTestContext({ type: "duplicate" });

      // Should not throw, but second one should override first
      expect(() => {
        testAgent = createTestAgent({ 
          contexts: [context1, context2]
        });
      }).not.toThrow();
    });
  });

  describe("Action Registration", () => {
    it("should register actions correctly", () => {
      const testAction = createTestAction({ name: "test-action" });
      testAgent = createTestAgent({ actions: [testAction] });

      // Actions are not registered in registry by default, but should be available
      expect(testAgent.actions).toContain(testAction);
    });

    it("should register multiple actions", () => {
      const action1 = createTestAction({ name: "action-1" });
      const action2 = createTestAction({ name: "action-2" });

      testAgent = createTestAgent({ 
        actions: [action1, action2]
      });

      expect(testAgent.actions).toHaveLength(2);
      expect(testAgent.actions).toContain(action1);
      expect(testAgent.actions).toContain(action2);
    });

    it("should handle actions with complex schemas", () => {
      const complexAction = action({
        name: "complex-action",
        schema: z.object({
          query: z.string(),
          options: z.object({
            limit: z.number().optional(),
            sortBy: z.enum(["date", "relevance"]).optional()
          }).optional()
        }),
        handler: async ({ query, options }) => {
          return { query, options, success: true };
        }
      });

      testAgent = createTestAgent({ actions: [complexAction] });
      expect(testAgent.actions).toContain(complexAction);
    });
  });

  describe("Extension Processing", () => {
    it("should process simple extension", () => {
      const simpleExtension: Extension = {
        name: "simple-test-extension",
        inputs: {},
        actions: [createTestAction({ name: "extension-action" })]
      };

      testAgent = createTestAgent({ 
        extensions: [simpleExtension]
      });

      // Extension action should be merged into agent actions
      expect(testAgent.actions.some(a => a.name === "extension-action")).toBe(true);
    });

    it("should process extension with contexts", () => {
      const extensionContext = createTestContext({ type: "extension-context" });
      const extension: Extension = {
        name: "context-extension",
        inputs: {},
        contexts: { "extension-context": extensionContext }
      };

      const helper = createAgentTestHelper({ 
        extensions: [extension]
      });

      helper.expectContextRegistered("extension-context");
    });

    it("should merge extension inputs and outputs", () => {
      const extension: Extension = {
        name: "io-extension", 
        inputs: {
          "ext-input": {
            schema: z.string(),
            handler: vi.fn()
          }
        },
        outputs: {
          "ext-output": {
            schema: z.string(),
            handler: vi.fn()
          }
        }
      };

      testAgent = createTestAgent({ 
        extensions: [extension]
      });

      expect(testAgent.inputs["ext-input"]).toBeDefined();
      expect(testAgent.outputs["ext-output"]).toBeDefined();
    });

    it("should handle multiple extensions", () => {
      const ext1: Extension = {
        name: "extension-1",
        inputs: {},
        actions: [createTestAction({ name: "ext1-action" })]
      };

      const ext2: Extension = {
        name: "extension-2", 
        inputs: {},
        actions: [createTestAction({ name: "ext2-action" })]
      };

      testAgent = createTestAgent({ 
        extensions: [ext1, ext2]
      });

      expect(testAgent.actions.some(a => a.name === "ext1-action")).toBe(true);
      expect(testAgent.actions.some(a => a.name === "ext2-action")).toBe(true);
    });
  });

  describe("Configuration Validation", () => {
    it("should handle conflicting configurations gracefully", () => {
      const context1 = createTestContext({ type: "conflict-test" });
      const extension: Extension = {
        name: "conflicting-extension",
        inputs: {},
        contexts: { 
          "conflict-test": createTestContext({ type: "conflict-test" })
        }
      };

      // Should not throw, later registration should take precedence
      expect(() => {
        testAgent = createTestAgent({
          contexts: [context1],
          extensions: [extension]
        });
      }).not.toThrow();
    });

    it("should validate required dependencies", () => {
      // Test that agent creation succeeds with valid dependencies
      expect(() => {
        testAgent = createTestAgent({
          model: createMockLanguageModel(),
          memory: createTestMemory()
        });
      }).not.toThrow();
    });

    it("should handle empty configuration arrays", () => {
      expect(() => {
        testAgent = createTestAgent({
          contexts: [],
          actions: [],
          extensions: []
        });
      }).not.toThrow();
    });
  });

  describe("Task Configuration", () => {
    it("should set default task configuration", () => {
      testAgent = createTestAgent();
      
      const taskConfig = testAgent.getTaskConfig();
      expect(taskConfig.concurrency.default).toBe(3);
      expect(taskConfig.concurrency.llm).toBe(3);
      expect(taskConfig.priority.default).toBe(10);
    });

    it("should respect custom task configuration", () => {
      testAgent = createTestAgent({
        tasks: {
          concurrency: { default: 5, llm: 2 },
          priority: { default: 20, high: 50, low: 5 }
        }
      });

      const taskConfig = testAgent.getTaskConfig();
      expect(taskConfig.concurrency.default).toBe(5);
      expect(taskConfig.concurrency.llm).toBe(2);
      expect(taskConfig.priority.default).toBe(20);
    });

    it("should provide priority level helpers", () => {
      testAgent = createTestAgent({
        tasks: {
          priority: { default: 10, high: 30, low: 3 }
        }
      });

      const priorities = testAgent.getPriorityLevels();
      expect(priorities.default).toBe(10);
      expect(priorities.high).toBe(30);
      expect(priorities.low).toBe(3);
    });

    it("should calculate default priority levels when not specified", () => {
      testAgent = createTestAgent({
        tasks: {
          priority: { default: 20 } // Only default specified
        }
      });

      const priorities = testAgent.getPriorityLevels();
      expect(priorities.default).toBe(20);
      expect(priorities.high).toBe(40); // default * 2
      expect(priorities.low).toBe(10);  // default / 2
    });
  });

  describe("Agent State Management", () => {
    it("should track booted state correctly", () => {
      testAgent = createTestAgent();
      
      expect(testAgent.isBooted()).toBe(false);
    });

    it("should provide registry access", () => {
      const testContext = createTestContext({ type: "registry-test" });
      testAgent = createTestAgent({ contexts: [testContext] });

      expect(testAgent.registry).toBeDefined();
      expect(testAgent.registry.contexts).toBeDefined();
      expect(testAgent.registry.actions).toBeDefined();
      expect(testAgent.registry.inputs).toBeDefined();
      expect(testAgent.registry.outputs).toBeDefined();
    });

    it("should provide container access", () => {
      testAgent = createTestAgent();
      
      expect(testAgent.container).toBeDefined();
    });

    it("should provide task runner access", () => {
      testAgent = createTestAgent();
      
      expect(testAgent.taskRunner).toBeDefined();
      expect(testAgent.taskRunner.enqueueTask).toBeDefined();
    });
  });

  describe("Error Handling in Creation", () => {
    it("should handle extension install errors gracefully", async () => {
      // Create a mock install function that will fail when called
      const mockInstall = vi.fn().mockImplementation(async () => {
        throw new Error("Install failed");
      });

      const faultyExtension: Extension = {
        name: "faulty-extension", 
        inputs: {},
        install: mockInstall
      };

      // Creation should succeed even if install will fail later
      expect(() => {
        testAgent = createTestAgent({ extensions: [faultyExtension] });
      }).not.toThrow();

      // Install errors will cause startup to fail (as expected for critical install failures)
      await expect(testAgent.start()).rejects.toThrow("Install failed");
      
      // Verify the install method was called
      expect(mockInstall).toHaveBeenCalled();
    });

    it("should handle malformed context schemas", () => {
      // This should be caught during creation or early validation
      const invalidContext = context({
        type: "invalid-context",
        schema: {} as any, // Invalid schema
        create: () => ({})
      });

      expect(() => {
        testAgent = createTestAgent({ contexts: [invalidContext] });
      }).not.toThrow(); // Should handle gracefully
    });
  });
});