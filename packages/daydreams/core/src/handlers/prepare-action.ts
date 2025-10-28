import type {
  AnyAction,
  AnyContext,
  ContextState,
  WorkingMemory,
  ActionCtxRef,
  AnyAgent,
} from "../types";

export async function prepareAction({
  action,
  context,
  state,
  workingMemory,
  agent,
  agentCtxState,
}: {
  action: AnyAction;
  context: AnyContext;
  state: ContextState<AnyContext>;
  workingMemory: WorkingMemory;
  agent: AnyAgent;
  agentCtxState: ContextState<AnyContext> | undefined;
}): Promise<ActionCtxRef | undefined> {
  if (action.context && action.context.type !== context.type) return undefined;

  let actionMemory: unknown = undefined;

  if (action.actionState) {
    actionMemory =
      (await agent.memory.kv.get(action.actionState.key)) ??
      action.actionState.create();
  }

  const enabled = action.enabled
    ? action.enabled({
        ...state,
        context,
        workingMemory,
        actionMemory,
        agentMemory: agentCtxState?.memory,
      })
    : true;

  if (action.enabled && action.actionState && actionMemory) {
    await agent.memory.kv.set(action.actionState.key, actionMemory);
  }

  return enabled
    ? {
        ...action,
        ctxRef: {
          type: state.context.type,
          id: state.id,
          key: state.key,
        },
      }
    : undefined;
}
