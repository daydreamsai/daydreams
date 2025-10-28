import type { AnyAgent, AnyContext, ContextState } from "../types";
import type { ContextStateSnapshot } from "../types";

/**
 * Loads context state metadata from storage
 * @param agent - Agent instance for storage access
 * @param context - Context definition
 * @param contextId - Unique identifier for the context
 * @returns Promise resolving to context state metadata or null if not found
 * @todo Implement agent model resolution for loaded contexts
 */
export async function loadContextState(
  agent: AnyAgent,
  context: AnyContext,
  contextId: string
): Promise<Omit<ContextState, "options" | "memory"> | null> {
  const state = await agent.memory.kv.get<ContextStateSnapshot>(
    `context:${contextId}`
  );

  if (!state) return null;

  return {
    ...state,
    context,
    settings: {
      ...state?.settings,
      // TODO: Implement agent model resolution
      model: undefined,
    },
  };
}
