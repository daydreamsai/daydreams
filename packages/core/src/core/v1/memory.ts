import { formatContextLog } from "./formatters";
import type { MemoryStore, WorkingMemory } from "./types";

export function createContextHandler<T>(
  memoryCreator: (contextId: string) => T,
  renderContext: (context: T) => string | string[]
) {
  return (memory: MemoryStore) => {
    return {
      get: async (contextId: string) => {
        const data = await memory.get<T>(contextId);
        return {
          id: contextId,
          memory: data ? data : memoryCreator(contextId),
        };
      },
      save: async (contextId: string, data: T) => {
        await memory.set(contextId, data);
      },
      render: renderContext,
    };
  };
}

export function defaultContextMemory(): WorkingMemory {
  return {
    inputs: [],
    outputs: [],
    thoughts: [],
    calls: [],
    results: [],
  };
}

export function defaultContextRender(memory: WorkingMemory) {
  return [
    ...memory.inputs.filter((i) => i.processed === true),
    ...memory.outputs,
    ...memory.calls,
    ...memory.results.filter((i) => i.processed === true),
  ].map((i) => formatContextLog(i));
}

export const getOrCreateConversationMemory = createContextHandler(
  defaultContextMemory,
  defaultContextRender
);

export function createMemoryStore(): MemoryStore {
  const data = new Map<string, any>();
  return {
    async get(key: string) {
      return data.get(key);
    },
    async clear() {
      data.clear();
    },
    async delete(key: string) {
      data.delete(key);
    },
    async set(key: string, value: any) {
      data.set(key, value);
    },
  };
}
