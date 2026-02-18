import type {
  AnyAgent,
  AnyContext,
  ContextState,
  WorkingMemory,
  OutputCtxRef,
  Context,
} from "../types";
import { prepareOutput } from "./prepare-output";

export async function prepareContextOutputs(params: {
  context: Context;
  state: ContextState<AnyContext>;
  workingMemory: WorkingMemory;
  agent: AnyAgent;
  agentCtxState: ContextState<AnyContext> | undefined;
}): Promise<readonly OutputCtxRef[]> {
  return params.context.outputs
    ? Promise.all(
        Object.entries(params.context.outputs).map(([name, output]) =>
          prepareOutput({
            output: {
              name,
              ...output,
            },
            ...params,
          })
        )
      ).then((t) => t.filter((t) => !!t))
    : [];
}
