import type { ContextState } from "../types";

/**
 * Retrieves context metadata for a given context ID
 * @param contexts - Map of loaded context states
 * @param contextId - Context ID to retrieve data for
 * @returns Context metadata object
 */
function getContextData(
  contexts: Map<string, ContextState>,
  contextId: string
) {
  if (contexts.has(contextId)) {
    const state = contexts.get(contextId)!;
    return {
      id: contextId,
      type: state.context.type,
      key: state.key,
      args: state.args,
      settings: state.settings,
    };
  }

  const [type, key] = contextId.split(":");

  return {
    id: contextId,
    type,
    key,
  };
}

/**
 * Retrieves metadata for all active contexts
 * @param contextIds - Set of context IDs to retrieve
 * @param contexts - Map of loaded context states
 * @returns Array of context metadata objects
 */
export function getContexts(
  contextIds: Set<string>,
  contexts: Map<string, ContextState>
) {
  return Array.from(contextIds.values())
    .filter((t) => !!t)
    .map((id) => getContextData(contexts, id));
}
