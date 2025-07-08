import type { AnyAgent } from "@/types/agent";
import type { Input } from "@/types/components";
import { type ContextManager, type ContextState } from "@/types/context";
import type { Engine } from "@/types/engine";
import type { WorkingMemoryCtx } from "@/types/wm";
import type { OutputCtxRef } from "@/types/refs";
import { resolve } from "@/utils";
import { prepareOutput } from "./output";
import { prepareAction, prepareActions } from "./action";
import type { LLMEngineComponents } from "../llm";

export async function prepareContext({
  agent,
  ctx,
  wm,
  engine,
}: {
  agent: AnyAgent;
  ctx: ContextState;
  wm: WorkingMemoryCtx;
  engine: Engine;
}) {
  const ctxs = agent.container.resolve<ContextManager>("ctxs");

  const components: LLMEngineComponents = {
    actions: [],
    inputs: [],
    outputs: [],
    contexts: [],
    tools: [],
  };

  ctx.components = components;

  await ctx.context.loader?.(ctx, agent);

  const uses =
    ctx.context.uses && typeof ctx.context.uses === "function"
      ? await ctx.context.uses(ctx, agent)
      : (ctx.context.uses ?? {});

  const inputs: Input[] = uses.inputs
    ? Object.entries(await resolve(uses.inputs, [ctx, agent])).map(
        ([name, input]) => ({
          name,
          ...input,
        })
      )
    : [];

  components.inputs.push(...inputs);

  const outputs = uses.outputs ? await resolve(uses.outputs, [ctx, agent]) : {};
  const outputRefs = await Promise.all(
    Object.entries(outputs).map(([name, output]) =>
      prepareOutput({
        output: {
          name,
          ...output,
        },
        context: ctx.context,
        ctx,
        wm,
        engine,
      })
    )
  ).then((refs) => refs.filter((ref) => !!ref));

  components.outputs.push(...outputRefs);

  const actions = uses.actions ? await resolve(uses.actions, [ctx, agent]) : [];
  const actionRefs = await prepareActions({
    agent,
    context: ctx.context,
    ctx: ctx,
    wm,
    engine,
    actions,
  });

  components.actions.push(...actionRefs);

  for (const { context, args } of uses.contexts ?? []) {
    const ctx = await ctxs.get({ context, args });
    await prepareContext({
      agent,
      ctx: ctx,
      wm,
      engine,
    });
    components.contexts.push(ctx);
  }
}

export async function prepareContexts<
  Components extends LLMEngineComponents = LLMEngineComponents,
>({
  components,
  agent,
  ...params
}: {
  agent: AnyAgent;
  ctx: ContextState;
  wm: WorkingMemoryCtx;
  components?: Partial<Components>;
  engine: Engine;
}) {
  const ctxs = agent.container.resolve<ContextManager>("ctxs");
  // await agentCtxState?.context.loader?.(agentCtxState, agent);
  const context = params.ctx.context;
  const inputs = components?.inputs ?? [];
  // const inputs: Input[] = Object.entries({
  //   // ...agent.inputs,
  //   ...(components?.inputs ?? {}),
  // }).map(([name, input]) => ({
  //   name,
  //   ...input,
  // }));

  const outputs: OutputCtxRef[] = components?.outputs
    ? await Promise.all(
        components.outputs.map((outputRef) =>
          prepareOutput({
            output: outputRef.output,
            context,
            ...params,
          })
        )
      ).then((r) => r.filter((a) => !!a))
    : [];

  const actions = await Promise.all(
    [
      // agent.actions,
      components?.actions,
    ]
      .filter((t) => !!t)
      .flat()
      .map((actionRef) =>
        prepareAction({
          action: actionRef.action,
          agent,
          context,
          ...params,
        })
      )
  ).then((r) => r.filter((a) => !!a));

  const contexts: ContextState[] = [];

  const state = {
    inputs,
    outputs,
    actions,
    contexts,
  };

  await prepareContext({ agent, ...params });

  if (components?.contexts) {
    for (const ctxRef of components?.contexts) {
      const child = await ctxs.get(ctxRef);
      await prepareContext({
        agent,
        ctx: child,
        wm: params.wm,
        engine: params.engine,
      });
    }
  }

  return state;
}
