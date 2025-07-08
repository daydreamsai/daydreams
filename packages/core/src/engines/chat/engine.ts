import { tool, type CoreMessage, type ToolSet } from "ai";
import { streamTextTask } from "@/tasks/llm";
import { formatContextState } from "@/engines/xml/formatters";
import { render } from "@/__prompt";
import { createLLMEngineFactory } from "../llm";
import type { LLMGenerateSettings } from "@/types/models";
import type { ActionCtxRef, OutputCtxRef } from "@/types/refs";

export const chatEngineFactory = createLLMEngineFactory({
  name: "chat",
  version: 1,
  create({ engine, controller, runner, wm, state, agent, ctx }) {
    // const { logger } = agent;

    async function createStep() {
      state.step++;
      const step = createStepLog({
        step: state.step,
        processed: false,
        data: {},
      });
      await engine.pushLog(step);
      return step;
    }

    return {
      async run() {
        controller.signal.throwIfAborted();

        const step = await runner.try("engine.createStep", createStep, {});

        let streamError: unknown | undefined = undefined;

        const unprocessed = [
          ...wm.data.chain.filter((i) => i.processed === false),
          ...state.chain.filter((i) => i.processed === false),
        ];

        const settings: LLMGenerateSettings = {
          ...ctx.settings.modelSettings,
          ...state.params?.settings,
        };

        const { model, config: modelConfig } =
          agent.models.resolveLanguageModel(
            state.params?.model ?? ctx.settings?.model!
          );

        // should never reach here without model

        if (!model) throw new Error("NO MODEL");

        const prompt = "";
        const contextsTemplate = "";

        const messages: CoreMessage[] = [
          {
            role: "system",
            content: prompt,
          },
          {
            role: "system",
            content: render(
              contextsTemplate,
              state.contexts.map(formatContextState)
            ),
          },

          // render working memory
        ];

        const outputToolSet = createOutputToolSet(state.outputs);
        const actionToolSet = createActionToolSet(state.actions);

        const { stream, getTextResponse } = await agent.tasks.enqueue(
          streamTextTask,
          {
            model,
            messages,
            logger: agent.logger,
            settings,
            onError: (error: unknown) => {
              streamError = error;
            },
            modelConfig,
            tools: {
              ...outputToolSet,
              ...actionToolSet,
            },
            toolCallStreaming: true,
          },
          {
            abortSignal: controller.signal,
          }
        );

        if (streamError) {
          throw streamError;
        }

        // const response = await getTextResponse();
        // stepRef.data.response = response;

        unprocessed.forEach((i) => {
          i.processed = true;
        });

        // logger.debug("agent:run", "Waiting for action calls to complete", {
        //   pendingCalls: state.promises.length,
        // });

        // return step;
      },
    };
  },
});

export function createActionToolSet(actions: ActionCtxRef[]): ToolSet {
  return Object.fromEntries(
    actions.map((action) => {
      const key = ["action", action.name].join(".");
      return [
        key,
        tool({
          id: key as any,
          parameters: action.schema as any,
          description: [action.description, action.instructions]
            .filter((t) => !t)
            .join("\n"),
          execute: async () => {},
        }),
      ] as const;
    })
  );
}

export function createOutputToolSet(outputs: OutputCtxRef[]): ToolSet {
  return Object.fromEntries(
    outputs.map((output) => {
      const key = ["output", output.name].join(".");
      return [
        key,
        tool({
          id: key as any,
          parameters: output.schema as any,
          description: [output.description, output.instructions]
            .filter((t) => !t)
            .join("\n"),
          execute: async () => {},
        }),
      ] as const;
    })
  );
}
