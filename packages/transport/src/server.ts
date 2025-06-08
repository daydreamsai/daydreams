import type { AnyAgent, AnyContext, LanguageModelV1 } from "@daydreamsai/core";
import type { Handlers } from "./types";

export type Server = Handlers;

function resolveContext(agent: AnyAgent, type: string): AnyContext {
  const context = agent.registry.contexts.get(type);
  if (!context) throw new Error("invalid context type: " + type);
  return context;
}

export function createServerHandlers(agent: AnyAgent): Handlers {
  return {
    async getContext(params) {
      const context = resolveContext(agent, params.context);
      const ctx = await agent.getContext({
        context,
        args: params.args,
      });
      const { id, key, memory, settings, contexts } = ctx;
      return {
        id,
        context: {
          type: context.type,
        },
        key,
        memory,
        settings,
        contexts,
      };
    },
    async getContextById(contextId) {
      const ctx = await agent.getContextById(contextId);
      if (!ctx) return null;

      const { id, context, key, memory, settings, contexts } = ctx;

      return {
        id,
        context: {
          type: context.type,
        },
        key,
        memory,
        settings,
        contexts,
      };
    },

    async deleteContext(contextId) {
      return agent.deleteContext(contextId);
    },

    async getWorkingMemory(contextId) {
      return agent.getWorkingMemory(contextId);
    },

    async saveContext(contextId, state) {
      const ctx = await agent.getContextById(contextId);
      if (!ctx) return false;
      return await agent.saveContext({
        ...ctx,
        ...state,
      });
    },

    async run(params) {
      const context = resolveContext(agent, params.context.type);

      let model: LanguageModelV1 | undefined = undefined;
      if (params.model) {
        if (!agent.registry.models.has(params.model))
          throw new Error("model not registered");

        model = agent.registry.models.get(params.model)!;
      }

      const { chain, abortSignal } = params;

      await agent.run({
        context,
        args: params.context.args,
        chain,
        model,
        abortSignal,
      });
    },

    async send(params) {
      const context = resolveContext(agent, params.context.type);

      let model: LanguageModelV1 | undefined = undefined;
      if (params.model) {
        if (!agent.registry.models.has(params.model))
          throw new Error("model not registered");

        model = agent.registry.models.get(params.model)!;
      }

      const { input, abortSignal } = params;

      await agent.send({
        context,
        args: params.context.args,
        input,
        model,
        abortSignal,
      });
    },
  };
}
