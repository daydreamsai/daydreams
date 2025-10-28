import { z, type ZodRawShape } from "zod";
import type {
  AnyAction,
  AnyAgent,
  AnyContext,
  Context,
  ContextConfig,
  ContextSettings,
  ContextState,
  InferSchemaArguments,
} from "../types";

import type { Logger } from "../logger";
import { tryAsync } from "../utils";

export function context<
  TMemory = any,
  Args extends z.ZodTypeAny | ZodRawShape = any,
  Ctx = any,
  Actions extends AnyAction[] = AnyAction[],
  Events extends Record<string, z.ZodTypeAny | z.ZodRawShape> = Record<
    string,
    z.ZodTypeAny | z.ZodRawShape
  >
>(
  config: ContextConfig<TMemory, Args, Ctx, Actions, Events>
): Context<TMemory, Args, Ctx, Actions, Events> {
  const ctx: Context<TMemory, Args, Ctx, Actions, Events> = {
    ...config,
    setActions(actions) {
      Object.assign(ctx, { actions });
      return ctx as any;
    },
    setInputs(inputs) {
      ctx.inputs = inputs;
      return ctx;
    },
    setOutputs(outputs) {
      ctx.outputs = outputs;
      return ctx;
    },
    use(composer) {
      ctx.__composers = ctx.__composers?.concat(composer) ?? [composer];
      return ctx;
    },
  };

  return ctx;
}

// =============================================================================
// CONTEXT STATE MANAGEMENT
// =============================================================================

/**
 * Generates a unique context identifier from context definition and arguments
 * @template TContext - The context type
 * @param context - Context definition
 * @param args - Context arguments conforming to the context's schema
 * @returns Unique context identifier string (type:key or just type)
 */
export function getContextId<TContext extends AnyContext>(
  context: TContext,
  args: z.infer<TContext["schema"]>
) {
  const key = context.key ? context.key(args) : undefined;
  return key ? [context.type, key].join(":") : context.type;
}

/**
 * Creates a new context state instance with initialized memory and configuration
 *
 * This function handles the complete setup of a context state including:
 * - ID generation and key resolution
 * - Settings configuration and merging
 * - Memory initialization (loading existing or creating new)
 * - Options setup through context.setup function
 * - Structured logging of context creation
 *
 * @template TContext - The context type
 * @param params - Configuration object for context state creation
 * @param params.agent - Agent instance
 * @param params.context - Context definition
 * @param params.args - Context arguments
 * @param params.contexts - Array of related context IDs (default: [])
 * @param params.settings - Initial context settings (default: {})
 * @returns Promise resolving to the new context state
 */
export async function createContextState<TContext extends AnyContext>({
  agent,
  context,
  args,
  contexts = [],
  settings: initialSettings = {},
}: {
  agent: AnyAgent;
  context: TContext;
  args: InferSchemaArguments<TContext["schema"]>;
  contexts?: string[];
  settings?: ContextSettings;
}): Promise<ContextState<TContext>> {
  const key = context.key ? context.key(args) : undefined;
  const id = key ? [context.type, key].join(":") : context.type;

  agent.logger.event("CONTEXT_CREATE", {
    contextType: context.type,
    contextId: id,
  });

  const settings: ContextSettings = {
    model: context.model,
    maxSteps: context.maxSteps,
    maxWorkingMemorySize: context.maxWorkingMemorySize,
    modelSettings: {
      ...(agent.modelSettings || {}),
      ...(context.modelSettings || {}),
      ...(initialSettings.modelSettings || {}),
    },
    ...initialSettings,
  };

  const options = context.setup
    ? await context.setup(args, settings, agent)
    : {};

  const memory =
    (context.load
      ? await context.load(id, { options, settings })
      : await agent.memory.kv.get(`memory:${id}`)) ??
    (context.create
      ? await tryAsync(
          context.create,
          { key, args, id, options, settings },
          agent
        )
      : {});

  return {
    id,
    key,
    args,
    options,
    context,
    memory,
    settings,
    contexts,
  };
}
