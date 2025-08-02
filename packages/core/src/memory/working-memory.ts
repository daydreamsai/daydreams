import type { AnyRef, AgentContext, AnyContext, AnyAgent, WorkingMemory } from "../types";
import type {
  IWorkingMemory,
  WorkingMemoryData,
  PushOptions,
  Memory,
  MemoryManager,
} from "./types";

export class WorkingMemoryImpl implements IWorkingMemory {
  constructor(private memory: Memory) {}

  async create(contextId: string): Promise<WorkingMemoryData> {
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
    await this.memory.kv.set(`working-memory:${contextId}`, data);
  }

  async push<TContext extends AnyContext = AnyContext>(
    contextId: string,
    entry: AnyRef,
    ctx: AgentContext<TContext>,
    agent: AnyAgent,
    options?: PushOptions
  ): Promise<void> {
    let data = await this.get(contextId);

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

    // Check memory pressure if manager provided AFTER adding the entry
    if (options?.memoryManager) {
      const shouldPrune = await this.shouldPrune(
        ctx,
        data,
        entry,
        agent,
        options.memoryManager
      );
      if (shouldPrune) {
        data = await this.handleMemoryPressure(contextId, ctx, data, agent, options.memoryManager);
      }
    }

    // Save updated data
    await this.set(contextId, data);

    // Emit event
    await this.memory.lifecycle.emit("workingMemory.updated", {
      contextId,
      entry,
      size: this.calculateSize(data),
    });
  }

  async clear(contextId: string): Promise<void> {
    await this.create(contextId);
  }

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

  private async shouldPrune<TContext extends AnyContext = AnyContext>(
    ctx: AgentContext<TContext>,
    data: WorkingMemoryData,
    entry: AnyRef,
    agent: AnyAgent,
    manager: MemoryManager<TContext>
  ): Promise<boolean> {
    if (manager.shouldPrune) {
      return manager.shouldPrune(ctx, data as WorkingMemory, entry, agent);
    }

    // Default size-based pruning
    const currentSize = this.calculateSize(data);
    return currentSize >= (manager.maxSize || 1000);
  }

  private async handleMemoryPressure<TContext extends AnyContext = AnyContext>(
    contextId: string,
    ctx: AgentContext<TContext>,
    data: WorkingMemoryData,
    agent: AnyAgent,
    manager: MemoryManager<TContext>
  ): Promise<WorkingMemoryData> {
    if (manager.onMemoryPressure) {
      const pruned = await manager.onMemoryPressure(ctx, data as WorkingMemory, agent);
      return pruned as WorkingMemoryData;
    }

    // Default FIFO pruning
    const strategy = manager.strategy || "fifo";

    switch (strategy) {
      case "fifo":
        // Keep most recent entries
        const keepRecent = Math.floor((manager.maxSize || 1000) * 0.7);
        data.inputs = data.inputs.slice(-keepRecent);
        data.outputs = data.outputs.slice(-keepRecent);
        data.thoughts = data.thoughts.slice(-keepRecent);
        data.calls = data.calls.slice(-keepRecent);
        data.results = data.results.slice(-keepRecent);
        break;

      case "smart":
        // Compress old entries if compression function provided
        if (manager.compress) {
          const oldEntries = [
            ...data.inputs.slice(0, -10),
            ...data.outputs.slice(0, -10),
          ];

          if (oldEntries.length > 0) {
            const compressed = await manager.compress(ctx, oldEntries, agent);

            // Store compressed version
            await this.memory.episodes.store({
              id: `compression:${contextId}:${Date.now()}`,
              type: "compression",
              summary: compressed,
              context: contextId,
              timestamp: Date.now(),
              metadata: {
                originalCount: oldEntries.length,
              },
            });

            // Remove compressed entries
            data.inputs = data.inputs.slice(-10);
            data.outputs = data.outputs.slice(-10);
          }
        }
        break;
    }

    return data;
  }

  private calculateSize(data: WorkingMemoryData): number {
    return (
      data.inputs.length +
      data.outputs.length +
      data.thoughts.length +
      data.calls.length +
      data.results.length +
      data.events.length +
      data.steps.length +
      data.runs.length
    );
  }
}
