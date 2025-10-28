import type { AnyAgent } from "../types";

/**
 * Retrieves working memory for a context, creating it if it doesn't exist
 * @param agent - Agent instance for memory access
 * @param contextId - Unique identifier for the context
 * @returns Promise resolving to the working memory object
 */
export async function getContextWorkingMemory(
  agent: AnyAgent,
  contextId: string
) {
  // Use WorkingMemoryImpl directly with just contextId - it handles the key internally
  let workingMemory = await agent.memory.working.get(contextId);

  if (!workingMemory) {
    workingMemory = await agent.memory.working.create(contextId);
  }

  return workingMemory;
}
