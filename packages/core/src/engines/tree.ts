import type { Action } from "@/types/action";
import type { AnyAgent } from "@/types/agent";
import type { Input, Output } from "@/types/components";
import type {
  AnyContext,
  Context,
  ContextResolver,
  ContextState,
} from "@/types/context";
import type { AnySystem, SystemRef, SystemRefs } from "@/types/system";
import { resolve } from "@/utils";

type ContextTreeComponents = {
  inputs: Input[];
  outputs: Output[];
  actions: Action[];
};

type ContextTreeRoot<TContext extends AnyContext = AnyContext> = {
  systems: SystemRef[];
  node: ContextTreeNode<TContext> | undefined;
};

export type ContextTreeNode<TContext extends AnyContext = AnyContext> = {
  ctx: ContextState<TContext>;
  parent: ContextTreeNode | ContextTreeRoot;
  systems: SystemRef[];
  components: Partial<ContextTreeComponents>;
  children: ContextTreeNode[] | undefined;
};

async function contextRecordResolver<
  TResolver extends
    | ContextResolver<Record<string, any>, AnyContext>
    | undefined,
>(resolver: TResolver, ctx: ContextState<AnyContext>, agent: AnyAgent) {
  if (!resolver) return [];
  const record = await resolve(resolver, [ctx, agent]);
  return Object.entries(record).map(([name, item]) => ({
    name,
    ...item,
  }));
}

export async function createContextTreeRoot<
  TContext extends Context,
  TSystems extends AnySystem[] = AnySystem[],
>({
  ctx,
  agent,
  systems,
}: {
  ctx: ContextState<TContext>;
  agent: AnyAgent;
  systems: SystemRefs<TSystems>;
}) {
  const root: ContextTreeRoot = {
    systems,
    node: undefined,
  };

  root.node = await createContextNode({ ctx, agent, parent: root });

  return root;
}

export async function createContextNode<TContext extends Context>({
  ctx,
  agent,
  parent,
}: {
  ctx: ContextState<TContext>;
  agent: AnyAgent;
  parent: ContextTreeNode | ContextTreeRoot;
}): Promise<ContextTreeNode<TContext>> {
  const systems = await resolve(ctx.context.systems, [ctx, agent], []);

  const node: ContextTreeNode<TContext> = {
    ctx,
    parent,
    components: {},
    systems,
    children: undefined,
  };

  return node;
}

export async function resolveNodeChildren<TContext extends Context>({
  node,
  agent,
}: {
  node: ContextTreeNode<TContext>;
  agent: AnyAgent;
}): Promise<ContextTreeNode<TContext>> {
  const childrenRefs = await resolve(
    node.ctx.context.uses,
    [node.ctx, agent],
    []
  );

  const children = await Promise.all(
    childrenRefs.map(async (children) =>
      createContextNode({
        ctx: await agent.ctxs.get(children),
        agent,
        parent: node,
      })
    )
  );
  node.children = children;
  return node;
}

export async function resolveNodeComponents<TContext extends Context>({
  node,
  agent,
}: {
  node: ContextTreeNode<TContext>;
  agent: AnyAgent;
}) {
  const context = node.ctx.context;

  node.components = {
    inputs: await contextRecordResolver(context.inputs, node.ctx, agent),
    outputs: await contextRecordResolver(context.outputs, node.ctx, agent),
    actions: await resolve(context.actions, [node.ctx, agent], []),
  };

  return node;
}
