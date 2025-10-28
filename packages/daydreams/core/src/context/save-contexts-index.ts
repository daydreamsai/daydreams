import type { AnyAgent } from "../types";

/**
 * Saves the index of all active context IDs to storage
 * @param agent - Agent instance for storage access
 * @param contextIds - Set of active context IDs
 * @returns Promise resolving when index is saved
 */
export async function saveContextsIndex(
  agent: AnyAgent,
  contextIds: Set<string>
) {
  await agent.memory.kv.set<string[]>(
    "contexts",
    Array.from(contextIds.values())
  );
}
