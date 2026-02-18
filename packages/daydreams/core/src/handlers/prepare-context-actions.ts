import type {
  AnyAgent,
  AnyContext,
  ContextState,
  WorkingMemory,
  ActionCtxRef,
  Context,
} from "../types";
import { prepareAction } from "./prepare-action";

export async function prepareContextActions(params: {
  context: Context;
  state: ContextState<AnyContext>;
  workingMemory: WorkingMemory;
  agent: AnyAgent;
  agentCtxState: ContextState<AnyContext> | undefined;
}): Promise<readonly ActionCtxRef[]> {
  const { context, state } = params;
  const actions =
    typeof context.actions === "function"
      ? await Promise.try(context.actions, state)
      : context.actions ?? [];

  return Promise.all(
    actions.map((action) =>
      prepareAction({
        action,
        ...params,
      })
    )
  ).then((t) => t.filter((t) => !!t));
}
