import type {
  AnyContext,
  AnyOutput,
  ContextState,
  OutputCtxRef,
} from "../types";

export async function prepareOutput({
  output,
  context,
  state,
}: {
  output: AnyOutput;
  context: AnyContext;
  state: ContextState<AnyContext>;
}): Promise<OutputCtxRef | undefined> {
  if (output.context && output.context.type !== context.type) return undefined;

  const enabled = output.enabled ? output.enabled(state) : true;

  return enabled
    ? {
        ...output,
        ctxRef: {
          type: state.context.type,
          id: state.id,
          key: state.key,
        },
      }
    : undefined;
}
