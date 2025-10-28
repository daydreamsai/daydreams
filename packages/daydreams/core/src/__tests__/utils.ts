import { expect, vi, type MockedFunction } from "vitest";
import { TaskRunner } from "../task";
import { Logger } from "../logger";

/**
 * Test utilities for the core package
 */

/**
 * Creates a delay for testing async operations
 */
export const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Creates a mock task runner with controllable execution
 */
export function createMockTaskRunner(concurrency = 2) {
  const runner = new TaskRunner(concurrency, new Logger());
  const mockEnqueueTask = vi.spyOn(runner, "enqueueTask");

  return {
    runner,
    mockEnqueueTask,
  };
}

/**
 * Creates a mock debug function that tracks calls
 */
export function createMockDebug() {
  return vi.fn();
}

/**
 * Creates an execution tracker for testing async operations
 */
export class ExecutionTracker {
  private order: number[] = [];
  private running = new Set<number>();
  private maxConcurrent = 0;
  private completed = 0;

  track(id: number) {
    this.running.add(id);
    this.maxConcurrent = Math.max(this.maxConcurrent, this.running.size);
  }

  complete(id: number) {
    this.running.delete(id);
    this.order.push(id);
    this.completed++;
  }

  get executionOrder() {
    return [...this.order];
  }

  get maxConcurrency() {
    return this.maxConcurrent;
  }

  get completedCount() {
    return this.completed;
  }

  get currentlyRunning() {
    return this.running.size;
  }

  reset() {
    this.order = [];
    this.running.clear();
    this.maxConcurrent = 0;
    this.completed = 0;
  }
}

/**
 * Mock console methods for testing logging
 */
export function mockConsole() {
  const originalConsole = { ...console };

  const mocks = {
    log: vi.spyOn(console, "log").mockImplementation(() => {}),
    error: vi.spyOn(console, "error").mockImplementation(() => {}),
    warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
    debug: vi.spyOn(console, "debug").mockImplementation(() => {}),
    info: vi.spyOn(console, "info").mockImplementation(() => {}),
  };

  const restore = () => {
    Object.assign(console, originalConsole);
  };

  return { mocks, restore };
}

/**
 * Creates a promise that can be resolved/rejected externally
 */
export function createDeferredPromise<T = void>() {
  let resolve: (value: T | PromiseLike<T>) => void;
  let reject: (reason?: any) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return {
    promise,
    resolve: resolve!,
    reject: reject!,
  };
}

/**
 * Test data generators
 */
export const testData = {
  simpleXml: "<test>content</test>",
  xmlWithAttributes: '<test id="123" class="main">content</test>',
  nestedXml: "<parent><child>content</child></parent>",
  selfClosingXml: "<parent><child/></parent>",
  complexXml: `
    <output>
      <action name="test"/>
      <analysis msgId="123">
        This is content
      </analysis>
      <response msgId="456">
        <nested>data</nested>
      </response>
    </output>
  `,
};

/**
 * Custom matchers and assertions
 */
export const assertions = {
  /**
   * Asserts that an array contains items in the expected order
   */
  expectOrderedExecution: (actual: number[], expected: number[]) => {
    expect(actual).toEqual(expected);
  },

  /**
   * Asserts that a mock was called with specific parameters
   */
  expectMockCalledWith: (mock: MockedFunction<any>, ...args: any[]) => {
    expect(mock).toHaveBeenCalledWith(...args);
  },

  /**
   * Asserts that a promise rejects with a specific error
   */
  expectRejection: async (promise: Promise<any>, expectedError: string) => {
    await expect(promise).rejects.toThrow(expectedError);
  },
};
