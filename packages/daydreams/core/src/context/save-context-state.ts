import type { AnyAgent, ContextState } from "../types";
import type { ContextStateSnapshot } from "../types";

/**
 * Persists context state and memory to storage
 *
 * Saves both the context metadata (settings, args, etc.) and the context's
 * memory data. Uses custom save function if provided by the context, otherwise
 * saves memory to default key-value storage.
 *
 * @param agent - Agent instance for storage access
 * @param state - Context state to save
 * @returns Promise resolving when save is complete
 */
export async function saveContextState(agent: AnyAgent, state: ContextState) {
  const { id, context, key, args, settings, contexts } = state;

  agent.logger.event("CONTEXT_UPDATE", {
    contextType: context.type,
    contextId: id,
    updateType: "state",
  });

  await agent.memory.kv.set<ContextStateSnapshot>(`context:${id}`, {
    id,
    type: context.type,
    key,
    args,
    settings: {
      ...settings,
      model:
        typeof settings.model === "string"
          ? settings.model
          : settings.model?.modelId,
    },
    contexts,
  });

  if (state.context.save) {
    await state.context.save(state);
  } else {
    await agent.memory.kv.set<any>(`memory:${id}`, state.memory);
  }
}
