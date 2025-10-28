import { vi, expect } from "vitest";
import { createDreams } from "../dreams";
import { context } from "../context";
import { action } from "../utils";
import type {
  Agent,
  AnyContext,
  ActionCall,
  ActionResult,
  Config,
  ActionHandler,
} from "../types";
import { LogLevel } from "../types";
import {
  MemorySystem,
  InMemoryKeyValueProvider,
  InMemoryVectorProvider,
  InMemoryGraphProvider,
} from "../memory";
import * as z from "zod";
import type { LanguageModel } from "ai";

/**
 * Enhanced test utilities for Tier 1 unit testing
 */

/**
 * Creates a mock language model for predictable testing
 */
export function createMockLanguageModel(
  options: {
    responses?: string[];
    shouldThrow?: boolean;
    delay?: number;
  } = {}
): LanguageModel {
  const {
    responses = ["<output>Mock response</output>"],
    shouldThrow = false,
    delay = 0,
  } = options;
  let responseIndex = 0;

  const mockGenerateText = vi.fn().mockImplementation(async (_prompt: any) => {
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    if (shouldThrow) {
      throw new Error("Mock LLM error");
    }

    const response = responses[responseIndex % responses.length];
    responseIndex++;

    return {
      text: response,
      finishReason: "stop" as const,
      usage: {
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
      },
    };
  });

  return {
    provider: "mock",
    modelId: "mock-model",
    specificationVersion: "v2",
    generateText: mockGenerateText,
    generateObject: vi.fn(),
    doGenerate: vi.fn(),
    doStream: vi.fn(),
    doGenerateObject: vi.fn(),
  } as any;
}

/**
 * Creates a test memory system with in-memory providers
 */
export function createTestMemory(): MemorySystem {
  return new MemorySystem({
    providers: {
      kv: new InMemoryKeyValueProvider(),
      vector: new InMemoryVectorProvider(),
      graph: new InMemoryGraphProvider(),
    },
  });
}

/**
 * Creates a simple test context for validation
 */
export function createTestContext<T = any>(
  overrides: Partial<{
    type: string;
    schema: z.ZodTypeAny;
    memory: T;
    instructions: string;
  }> = {}
) {
  return context<T>({
    type: overrides.type || "test-context",
    schema: overrides.schema || z.object({ id: z.string() }),
    create: () => overrides.memory || ({} as T),
    instructions: overrides.instructions || "Test context instructions",
  });
}

/**
 * Creates a test action with configurable behavior
 */
export function createTestAction(
  overrides: Partial<{
    name: string;
    handler: ActionHandler;
    shouldThrow: boolean;
    delay: number;
  }> = {}
) {
  const {
    name = "test-action",
    shouldThrow = false,
    delay = 0,
    handler,
  } = overrides;

  const defaultHandler = async (args: any) => {
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    if (shouldThrow) {
      throw new Error("Test action error");
    }
    return { success: true, args };
  };

  const mockHandler = handler || vi.fn().mockImplementation(defaultHandler);

  return action({
    name,
    schema: z.object({ data: z.string().optional() }),
    handler: mockHandler as any, // Type assertion to handle complex generic types
  });
}

/**
 * Creates a test agent with minimal configuration
 */
export function createTestAgent<TContext extends AnyContext = AnyContext>(
  config: Partial<Config<TContext>> & {
    mockResponses?: string[];
    shouldThrowOnLLM?: boolean;
  } = {}
): Agent<TContext> {
  const { mockResponses, shouldThrowOnLLM, ...agentConfig } = config;

  const defaultConfig: Config<TContext> = {
    model: createMockLanguageModel({
      responses: mockResponses,
      shouldThrow: shouldThrowOnLLM,
    }),
    memory: createTestMemory(),
    contexts: [],
    actions: [],
    inputs: {
      text: {
        schema: z.string(),
        handler: async (content: string) => ({
          data: content,
          params: {}
        })
      }
    },
    outputs: {
      text: {
        schema: z.string(), 
        handler: async (data: string) => ({
          data,
          processed: true
        })
      }
    },
    logLevel: LogLevel.ERROR, // Suppress logs during testing
    ...agentConfig,
  };

  return createDreams(defaultConfig);
}

/**
 * Creates a completely silent test agent (no logging)
 */
export function createSilentTestAgent<TContext extends AnyContext = AnyContext>(
  config: Partial<Config<TContext>> & {
    mockResponses?: string[];
    shouldThrowOnLLM?: boolean;
  } = {}
): Agent<TContext> {
  return createTestAgent({
    logLevel: LogLevel.ERROR,
    ...config
  });
}

/**
 * Agent test assertions and utilities
 */
export class AgentTestHelper<TContext extends AnyContext = AnyContext> {
  constructor(public agent: Agent<TContext>) {}

  /**
   * Asserts that the agent is properly configured
   */
  expectProperConfiguration() {
    expect(this.agent).toBeDefined();
    expect(this.agent.model).toBeDefined();
    expect(this.agent.memory).toBeDefined();
    expect(this.agent.taskRunner).toBeDefined();
    expect(this.agent.logger).toBeDefined();
    expect(this.agent.registry).toBeDefined();
  }

  /**
   * Asserts that contexts are properly registered
   */
  expectContextRegistered(contextType: string) {
    expect(this.agent.registry.contexts.has(contextType)).toBe(true);
  }

  /**
   * Asserts that actions are properly registered
   */
  expectActionRegistered(actionName: string) {
    expect(this.agent.registry.actions.has(actionName)).toBe(true);
  }

  /**
   * Gets the mock model for verification
   */
  getMockModel() {
    return this.agent.model as any;
  }

  /**
   * Verifies LLM was called with expected parameters
   */
  expectLLMCalled(times: number = 1) {
    const mockModel = this.getMockModel();
    expect(mockModel.generateText).toHaveBeenCalledTimes(times);
  }

  /**
   * Gets call arguments from mock LLM
   */
  getLLMCallArgs(callIndex: number = 0) {
    const mockModel = this.getMockModel();
    return mockModel.generateText.mock.calls[callIndex];
  }
}

/**
 * Creates an agent test helper
 */
export function createAgentTestHelper<TContext extends AnyContext = AnyContext>(
  config?: Parameters<typeof createTestAgent<TContext>>[0]
): AgentTestHelper<TContext> {
  const agent = createSilentTestAgent<TContext>(config);
  return new AgentTestHelper(agent);
}

/**
 * Mock action call for testing engine routing
 */
export function createMockActionCall(
  overrides: Partial<ActionCall> = {}
): ActionCall {
  return {
    ref: "action_call",
    id: "test-call-id",
    name: "test-action",
    content: "test action call",
    data: { test: true },
    timestamp: Date.now(),
    processed: false,
    ...overrides,
  };
}

/**
 * Mock action result for testing
 */
export function createMockActionResult(
  overrides: Partial<ActionResult> = {}
): ActionResult {
  return {
    ref: "action_result",
    id: "test-result-id",
    callId: "test-call-id",
    name: "test-action",
    data: { success: true },
    timestamp: Date.now(),
    processed: false,
    ...overrides,
  };
}

/**
 * Waits for all pending promises in the event loop
 */
export async function waitForPendingPromises() {
  await new Promise((resolve) => process.nextTick(resolve));
  await new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Creates a context state snapshot for testing persistence
 */
export function createMockContextState(overrides: any = {}) {
  return {
    id: "test-context:test-key",
    key: "test-key",
    context: createTestContext(),
    args: { id: "test" },
    options: {},
    memory: {},
    settings: {},
    contexts: [],
    ...overrides,
  };
}

/**
 * Validation helpers for common test scenarios
 */
export const testValidation = {
  /**
   * Validates that an agent follows expected startup sequence
   */
  expectValidStartupSequence: (_mockModel: any, mockMemory: any) => {
    // Memory should be initialized
    expect(mockMemory.initialize).toHaveBeenCalled();
  },

  /**
   * Validates error handling behavior
   */
  expectGracefulErrorHandling: async (fn: () => Promise<any>) => {
    await expect(fn()).rejects.toThrow();
    // Should not crash the process
    expect(process.listenerCount("uncaughtException")).toBe(0);
  },
};
