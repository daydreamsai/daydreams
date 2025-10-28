import type { AnyRef, AgentContext, AnyContext, AnyAgent } from "../types";
import type {
  IWorkingMemory,
  WorkingMemoryData,
  PushOptions,
  Memory,
} from "./types";
import { contextLockManager } from "./context-lock-manager";

export class WorkingMemoryImpl implements IWorkingMemory {
  constructor(private memory: Memory) {}

  async create(contextId: string): Promise<WorkingMemoryData> {
    return contextLockManager.withLock(contextId, async () => {
      // Check if already exists to avoid race condition
      const existing = await this.memory.kv.get<WorkingMemoryData>(
        `working-memory:${contextId}`
      );
      if (existing) {
        return existing;
      }

      const data: WorkingMemoryData = {
        inputs: [],
        outputs: [],
        thoughts: [],
        calls: [],
        results: [],
        events: [],
        steps: [],
        runs: [],
      };

      await this.memory.kv.set(`working-memory:${contextId}`, data);
      return data;
    });
  }

  async get(contextId: string): Promise<WorkingMemoryData> {
    const data = await this.memory.kv.get<WorkingMemoryData>(
      `working-memory:${contextId}`
    );

    if (!data) {
      // Auto-create if not exists
      return this.create(contextId);
    }

    return data;
  }

  async set(contextId: string, data: WorkingMemoryData): Promise<void> {
    return contextLockManager.withLock(contextId, async () => {
      await this.memory.kv.set(`working-memory:${contextId}`, data);
    });
  }

  async push<TContext extends AnyContext = AnyContext>(
    contextId: string,
    entry: AnyRef,
    ctx: AgentContext<TContext>,
    agent: AnyAgent,
    options?: PushOptions
  ): Promise<void> {
    return contextLockManager.withLock(contextId, async () => {
      // Re-fetch data inside lock to ensure consistency
      let data = await this.memory.kv.get<WorkingMemoryData>(
        `working-memory:${contextId}`
      );

      if (!data) {
        data = {
          inputs: [],
          outputs: [],
          thoughts: [],
          calls: [],
          results: [],
          events: [],
          steps: [],
          runs: [],
        };
      }

      // Add entry to appropriate array based on ref type
      switch (entry.ref) {
        case "input":
          data.inputs.push(entry as any);
          break;
        case "output":
          data.outputs.push(entry as any);
          break;
        case "thought":
          data.thoughts.push(entry as any);
          break;
        case "action_call":
          data.calls.push(entry as any);
          break;
        case "action_result":
          data.results.push(entry as any);
          break;
        case "event":
          data.events.push(entry as any);
          break;
        case "step":
          data.steps.push(entry as any);
          break;
        case "run":
          data.runs.push(entry as any);
          break;
        default:
          // Add to events as fallback
          data.events.push(entry as any);
      }

      // Save updated data
      await this.memory.kv.set(`working-memory:${contextId}`, data);
    });
  }

  async clear(contextId: string): Promise<void> {
    return contextLockManager.withLock(contextId, async () => {
      const data: WorkingMemoryData = {
        inputs: [],
        outputs: [],
        thoughts: [],
        calls: [],
        results: [],
        events: [],
        steps: [],
        runs: [],
      };
      await this.memory.kv.set(`working-memory:${contextId}`, data);
    });
  }

  // TODO:
  async summarize(contextId: string): Promise<string> {
    const data = await this.get(contextId);

    // Simple summarization for now
    const summary = {
      inputs: data.inputs.length,
      outputs: data.outputs.length,
      thoughts: data.thoughts.length,
      calls: data.calls.length,
      results: data.results.length,
      events: data.events.length,
      steps: data.steps.length,
      runs: data.runs.length,
    };

    return `Working memory contains: ${JSON.stringify(summary)}`;
  }
}
