import type { AnyAgent } from "../types";

/**
 * Deletes all data associated with a context from storage
 * @param agent - Agent instance for storage access
 * @param contextId - Unique identifier for the context to delete
 * @returns Promise resolving when deletion is complete
 */
export async function deleteContext(agent: AnyAgent, contextId: string) {
  await agent.memory.kv.delete(`context:${contextId}`);
  await agent.memory.kv.delete(`memory:${contextId}`);
  await agent.memory.working.clear(contextId);
}
