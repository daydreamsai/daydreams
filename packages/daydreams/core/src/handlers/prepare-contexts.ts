import type {
  AnyAgent,
  AnyAction,
  ContextState,
  WorkingMemory,
  Output,
  InputConfig,
  Input,
  ContextRef,
  OutputCtxRef,
} from "../types";
import { prepareContext } from "./prepare-context";
import { prepareAction } from "./prepare-action";
import { prepareOutput } from "./prepare-output";

export async function prepareContexts({
  agent,
  ctxState,
  agentCtxState,
  workingMemory,
  params,
}: {
  agent: AnyAgent;
  ctxState: ContextState;
  agentCtxState?: ContextState;
  workingMemory: WorkingMemory;
  params?: {
    outputs?: Record<string, Omit<Output, "name">>;
    inputs?: Record<string, InputConfig>;
    actions?: AnyAction[];
    contexts?: ContextRef[];
  };
}) {
  await agentCtxState?.context.loader?.(agentCtxState, agent);

  const inputs: Input[] = Object.entries({
    ...agent.inputs,
    ...(params?.inputs ?? {}),
  }).map(([type, input]) => ({
    type,
    ...input,
  }));

  const outputs: OutputCtxRef[] = await Promise.all(
    Object.entries({
      ...agent.outputs,
      ...(params?.outputs ?? {}),
    }).map(([name, output]) =>
      prepareOutput({
        output: {
          name,
          ...output,
        },
        context: ctxState.context,
        state: ctxState,
      })
    )
  ).then((r) => r.filter((a) => !!a));

  const actions = await Promise.all(
    [agent.actions, params?.actions]
      .filter((t) => !!t)
      .flat()
      .map((action: AnyAction) =>
        prepareAction({
          action,
          agent,
          agentCtxState,
          context: ctxState.context,
          state: ctxState,
          workingMemory,
        })
      )
  ).then((r) => r.filter((a) => !!a));

  const contexts: ContextState[] = agentCtxState ? [agentCtxState] : [];

  const state = {
    inputs,
    outputs,
    actions,
    contexts,
  };

  await prepareContext(
    { agent, ctxState, workingMemory, agentCtxState },
    state
  );

  if (params?.contexts) {
    // Parallelize context preparation for better performance
    await Promise.all(
      params.contexts.map(async (ctxRef) => {
        const ctxState = await agent.getContext(ctxRef);
        return prepareContext(
          {
            agent,
            ctxState,
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
