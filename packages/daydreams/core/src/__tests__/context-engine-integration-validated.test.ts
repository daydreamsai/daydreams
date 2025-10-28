import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createDreams } from "../dreams";
import { context } from "../context";
import { createEngine } from "../engine";
import { createContextState } from "../context";
import { createWorkingMemory } from "../memory/utils";
import {
  createSilentTestAgent,
  createMockLanguageModel,
  createTestMemory,
  waitForPendingPromises,
} from "./test-utilities";
import type { Agent, AnyContext, InputRef } from "../types";
import * as z from "zod";
import { LogLevel } from "../types";
import { randomUUIDv7 } from "../utils";

/**
 * Tier 2: Context-Engine Integration Tests (Validated Setup)
 *
 * This test suite validates the integration between contexts and engines
 * starting with basic setup validation before adding complex scenarios.
 */

describe("Context-Engine Integration - Tier 2 (Validated)", () => {
  let agent: Agent;

  afterEach(async () => {
    if (agent?.isBooted()) {
      await agent.stop();
    }
  });

  describe("Setup Validation", () => {
    it("should create agent with proper inputs and outputs for integration testing", async () => {
      // Create agent with complete input/output setup
      agent = createSilentTestAgent({
        model: createMockLanguageModel({
          responses: [
            '<output name="text">{"content": "Setup validated successfully"}</output>',
          ],
        }),
        memory: createTestMemory(),
        inputs: {
          text: {
            schema: z.string(),
            handler: async (content: string) => ({
              data: content,
              params: {},
            }),
          },
        },
        outputs: {
          text: {
            schema: z.string(),
            handler: async (data: string) => ({
              data,
              processed: true,
            }),
          },
        },
        contexts: [],
      });

      // Validate agent creation
      expect(agent).toBeDefined();
      expect(agent.model).toBeDefined();
      expect(agent.memory).toBeDefined();
      expect(agent.inputs.text).toBeDefined();
      expect(agent.outputs.text).toBeDefined();
      expect(agent.isBooted()).toBe(false);

      // Test agent startup
      await agent.start();
      expect(agent.isBooted()).toBe(true);

      // Validate inputs and outputs are properly registered
      expect(agent.inputs.text.handler).toBeDefined();
      expect(agent.outputs.text.handler).toBeDefined();
    });

    it("should create test context that can be used with the agent", async () => {
      // Create a simple test context
      const testContext = context({
        type: "integration-test",
        schema: z.object({
          message: z.string(),
        }),
        create: () => ({ testData: "initialized" }),
        instructions: "This is a test context for integration testing",
      });

      // Create agent with the context
      agent = createSilentTestAgent({
        model: createMockLanguageModel({
          responses: [
            '<output name="text">{"content": "Context created successfully"}</output>',
          ],
        }),
        memory: createTestMemory(),
        inputs: {
          text: {
            schema: z.string(),
            handler: async (content: string) => ({
              data: content,
              params: {},
            }),
          },
        },
        outputs: {
          text: {
            schema: z.string(),
            handler: async (data: string) => ({
              data,
              processed: true,
            }),
          },
        },
        contexts: [testContext],
      });

      await agent.start();

      // Test context creation through agent
      const contextState = await agent.getContext({
        context: testContext,
        args: { message: "test" },
      });

      expect(contextState).toBeDefined();
      expect(contextState.id).toBe("integration-test"); // No key function, so just the type
      expect(contextState.context.type).toBe("integration-test");
      expect(contextState.args.message).toBe("test");
    });

    it("should validate engine can be created from agent context", async () => {
      const testContext = context({
        type: "engine-test",
        schema: z.object({
          id: z.string(),
        }),
        create: () => ({ engineTestData: true }),
        instructions: "Engine integration test context",
      });

      agent = createSilentTestAgent({
        model: createMockLanguageModel({
          responses: [
            '<output name="text">{"content": "Engine integration ready"}</output>',
          ],
        }),
        memory: createTestMemory(),
        inputs: {
          text: {
            schema: z.string(),
            handler: async (content: string) => ({
              data: content,
              params: {},
            }),
          },
        },
        outputs: {
          text: {
            schema: z.string(),
            handler: async (data: string) => ({
              data,
              processed: true,
            }),
          },
        },
        contexts: [testContext],
      });

      await agent.start();

      // Create context state
      const contextState = await agent.getContext({
        context: testContext,
        args: { id: "engine-test-1" },
      });

      // Create working memory
      const workingMemory = createWorkingMemory();

      // Create engine from context
      const engine = createEngine({
        agent,
        ctxState: contextState,
        workingMemory,
        subscriptions: new Set(),
        __chunkSubscriptions: new Set(),
      });

      expect(engine).toBeDefined();
      expect(engine.state.ctxState).toBe(contextState);
      expect(engine.controller).toBeDefined();
      expect(engine.state.running).toBe(false);

      // Test engine startup
      const stepRef = await engine.start();
      expect(engine.state.running).toBe(true);
      expect(stepRef.ref).toBe("step");
      expect(stepRef.step).toBe(1);

      // Cleanup
      engine.controller.abort();
    });
  });

  describe("Basic Integration Tests", () => {
    it("should process a simple message flow from context to engine", async () => {
      // Create a test context with simple behavior
      const messageContext = context({
        type: "message-flow",
        schema: z.object({
          userId: z.string(),
        }),
        create: () => ({ processedMessages: 0 }),
        instructions: "Process user messages and respond appropriately",
      });

      // Create agent with the context
      agent = createSilentTestAgent({
        model: createMockLanguageModel({
          responses: [
            '<output name="text">{"content": "Message processed successfully"}</output>',
          ],
        }),
        memory: createTestMemory(),
        inputs: {
          text: {
            schema: z.string(),
            handler: async (content: string) => ({
              data: content,
              params: {},
            }),
          },
        },
        outputs: {
          text: {
            schema: z.string(),
            handler: async (data: string) => ({
              data,
              processed: true,
            }),
          },
        },
        contexts: [messageContext],
      });

      await agent.start();

      // Create context state
      const contextState = await agent.getContext({
        context: messageContext,
        args: { userId: "test-user-1" },
      });

      // Create working memory and engine
      const workingMemory = createWorkingMemory();
      const subscriptions = new Set<(log: any, done: boolean) => void>();
      const chunkSubscriptions = new Set<(chunk: any) => void>();

      const engine = createEngine({
        agent,
        ctxState: contextState,
        workingMemory,
        subscriptions,
        __chunkSubscriptions: chunkSubscriptions,
      });

      // Start engine
      await engine.start();
      expect(engine.state.running).toBe(true);

      // Create input message
      const inputMessage: InputRef = {
        id: randomUUIDv7(),
        ref: "input",
        type: "text",
        content: "Hello, this is a test message",
        data: "Hello, this is a test message",
        timestamp: Date.now(),
        processed: false,
      };

      // Process the input through the engine
      await engine.push(inputMessage);

      // Verify the message was processed
      expect(workingMemory.inputs).toHaveLength(1);
      expect(workingMemory.inputs[0]).toBe(inputMessage);
      expect(engine.state.chain).toContain(inputMessage);

      // Verify basic engine state is maintained
      expect(engine.state.running).toBe(true);
      expect(engine.state.chain.length).toBeGreaterThan(0);

      // Wait for any async operations to complete
      await waitForPendingPromises();

      // Cleanup
      engine.controller.abort();
    });

    it("should notify subscriptions when processing messages", async () => {
      // Create test context
      const subscriptionContext = context({
        type: "subscription-test",
        schema: z.object({
          channelId: z.string(),
        }),
        create: () => ({ eventsReceived: 0 }),
        instructions: "Test subscription notifications",
      });

      // Create agent
      agent = createSilentTestAgent({
        model: createMockLanguageModel({
          responses: [
            '<output name="text">{"content": "Subscription test response"}</output>',
          ],
        }),
        memory: createTestMemory(),
        inputs: {
          text: {
            schema: z.string(),
            handler: async (content: string) => ({
              data: content,
              params: {},
            }),
          },
        },
        outputs: {
          text: {
            schema: z.string(),
            handler: async (data: string) => ({
              data,
              processed: true,
            }),
          },
        },
        contexts: [subscriptionContext],
      });

      await agent.start();

      // Create context state
      const contextState = await agent.getContext({
        context: subscriptionContext,
        args: { channelId: "test-channel" },
      });

      // Create working memory and subscriptions
      const workingMemory = createWorkingMemory();
      const subscriptions = new Set<(log: any, done: boolean) => void>();
      const chunkSubscriptions = new Set<(chunk: any) => void>();

      // Add mock subscribers
      const logSubscriber = vi.fn();
      const chunkSubscriber = vi.fn();
      subscriptions.add(logSubscriber);
      chunkSubscriptions.add(chunkSubscriber);

      const engine = createEngine({
        agent,
        ctxState: contextState,
        workingMemory,
        subscriptions,
        __chunkSubscriptions: chunkSubscriptions,
      });

      await engine.start();

      // Create and push a test message
      const testMessage: InputRef = {
        id: randomUUIDv7(),
        ref: "input",
        type: "text",
        content: "Test subscription message",
        data: "Test subscription message",
        timestamp: Date.now(),
        processed: false,
      };

      await engine.push(testMessage);

      // Verify subscribers were called
      expect(logSubscriber).toHaveBeenCalledWith(
        expect.objectContaining({
          ref: "input",
          content: "Test subscription message",
        }),
        true // done flag
      );

      expect(chunkSubscriber).toHaveBeenCalledWith({
        type: "log",
        log: expect.objectContaining({
          ref: "input",
          content: "Test subscription message",
        }),
        done: true,
      });

      // Wait for any async operations
      await waitForPendingPromises();

      // Cleanup
      engine.controller.abort();
    });

    it("should validate context state management across multiple operations", async () => {
      // Create a stateful context
      const statefulContext = context({
        type: "stateful-operations",
        schema: z.object({
          operationId: z.string(),
        }),
        create: () => ({
          operationsCount: 0,
          lastOperationTime: null as number | null,
        }),
        instructions: "Track operations and maintain state",
      });

      // Create agent
      agent = createSilentTestAgent({
        model: createMockLanguageModel({
          responses: [
            '<output name="text">{"content": "First operation completed"}</output>',
            '<output name="text">{"content": "Second operation completed"}</output>',
          ],
        }),
        memory: createTestMemory(),
        inputs: {
          text: {
            schema: z.string(),
            handler: async (content: string) => ({
              data: content,
              params: {},
            }),
          },
        },
        outputs: {
          text: {
            schema: z.string(),
            handler: async (data: string) => ({
              data,
              processed: true,
            }),
          },
        },
        contexts: [statefulContext],
      });

      await agent.start();

      // Create context state
      const contextState = await agent.getContext({
        context: statefulContext,
        args: { operationId: "multi-op-test" },
      });

      // Verify initial state
      expect(contextState.memory.operationsCount).toBe(0);
      expect(contextState.memory.lastOperationTime).toBeNull();

      // Create engine for processing operations
      const workingMemory = createWorkingMemory();
      const engine = createEngine({
        agent,
        ctxState: contextState,
        workingMemory,
        subscriptions: new Set(),
        __chunkSubscriptions: new Set(),
      });

      await engine.start();

      // Process first operation
      const operation1: InputRef = {
        id: randomUUIDv7(),
        ref: "input",
        type: "text",
        content: "First operation",
        data: "First operation",
        timestamp: Date.now(),
        processed: false,
      };

      await engine.push(operation1);

      // Verify first operation processed
      expect(workingMemory.inputs).toHaveLength(1);
      expect(workingMemory.inputs[0].content).toBe("First operation");

      // Process second operation
      const operation2: InputRef = {
        id: randomUUIDv7(),
        ref: "input",
        type: "text",
        content: "Second operation",
        data: "Second operation",
        timestamp: Date.now(),
        processed: false,
      };

      await engine.push(operation2);

      // Verify both operations processed
      expect(workingMemory.inputs).toHaveLength(2);
      expect(workingMemory.inputs[1].content).toBe("Second operation");

      // Verify engine state maintained consistency
      expect(engine.state.running).toBe(true);
      expect(engine.state.chain.length).toBeGreaterThanOrEqual(2);

      // Save final state
      await agent.saveContext(contextState, workingMemory);

      // Cleanup
      engine.controller.abort();
    });
  });
});
