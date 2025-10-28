import type { AnyAgent } from "../types";
import type { WorkingMemory } from "../memory";

/**
 * Persists working memory for a context to storage
 * @param agent - Agent instance for memory access
 * @param contextId - Unique identifier for the context
 * @param workingMemory - Working memory object to save
 * @returns Promise resolving when save is complete
 */
export async function saveContextWorkingMemory(
  agent: AnyAgent,
  contextId: string,
  workingMemory: WorkingMemory
) {
  // Use WorkingMemoryImpl directly with just contextId - it handles the key internally
  return await agent.memory.working.set(contextId, workingMemory);
}
