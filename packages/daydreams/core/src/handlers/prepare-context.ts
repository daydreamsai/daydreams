import type {
  AnyAgent,
  ContextState,
  WorkingMemory,
  Input,
  OutputCtxRef,
  ActionCtxRef,
  ContextRef,
} from "../types";
import { prepareContextActions } from "./prepare-context-actions";
import { prepareOutput } from "./prepare-output";
import { resolve } from "../utils";

export async function prepareContext(
  {
    agent,
    ctxState,
    workingMemory,
    agentCtxState,
  }: {
    agent: AnyAgent;
    ctxState: ContextState;
    workingMemory: WorkingMemory;
    agentCtxState?: ContextState;
  },
  state: {
    inputs: Input[];
    outputs: OutputCtxRef[];
    actions: ActionCtxRef[];
    contexts: ContextState[];
  }
) {
  state.contexts.push(ctxState);

  await ctxState.context.loader?.(ctxState, agent);

  const inputs: Input[] = ctxState.context.inputs
    ? Object.entries(ctxState.context.inputs).map(([type, input]) => ({
        type,
        ...input,
      }))
    : [];

  state.inputs.push(...inputs);

  const outputs: OutputCtxRef[] = ctxState.context.outputs
    ? await Promise.all(
        Object.entries(await resolve(ctxState.context.outputs, ctxState)).map(
          ([name, output]) =>
            prepareOutput({
              output: {
                name,
                ...output,
              },
              context: ctxState.context,
              state: ctxState,
            })
        )
      ).then((r) => r.filter((a) => !!a))
    : [];

  state.outputs.push(...outputs);

  const actions = await prepareContextActions({
    agent,
    agentCtxState,
    context: ctxState.context,
    state: ctxState,
    workingMemory,
  });

  state.actions.push(...actions);

  const ctxRefs: ContextRef[] = [];

  if (ctxState.context.__composers) {
    for (const composer of ctxState.context.__composers) {
      ctxRefs.push(...composer(ctxState));
    }
  }

  // Parallelize context preparation for composed contexts
  if (ctxRefs.length > 0) {
    await Promise.all(
      ctxRefs.map(async ({ context, args }) => {
        const composedCtxState = await agent.getContext({ context, args });
        return prepareContext(
          {
            agent,
            ctxState: composedCtxState,
            workingMemory,
            agentCtxState,
          },
          state
        );
      })
    );
  }

  return state;
}
