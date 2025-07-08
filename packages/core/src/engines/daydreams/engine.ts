import type { CoreMessage } from "ai";
import { createStreamHandler, handleStream } from "./streaming";
import { mainPrompt, templateSections } from "./prompt";
import { streamTextTask } from "@/tasks/llm";
import { createLLMEngineFactory } from "../llm";
import type {
  LanguageModel,
  LLMGenerateSettings,
  ModelManager,
} from "@/types/models";
import { TaskManager } from "@/managers/tasks";
import type { Logger } from "@/types/managers";
import { render } from "@/__prompt";
import { workingMemories } from "@/wm";

export const createDaydreamsEngine = createLLMEngineFactory({
  name: "daydreams",
  version: 1,
  create({ state, agent, controller, ctx, engine, router, runner, wm }) {
    const {
      state: streamState,
      streamHandler,
      tags,
    } = createStreamHandler({
      abortSignal: controller.signal,
      onMemoryChunk(chunk) {
        // console.log({ chunk });
        engine.pushChunk(chunk);
      },
    });

    const logger = agent.container.resolve<Logger>("logger");
    const models = agent.container.resolve<ModelManager>("models");
    const tasks = agent.container.resolve<TaskManager>("tasks");

    return {
      async prepareStep() {},

      async runStep() {
        const queue = state.__queue;
        state.__queue = [];

        const stepMemory = workingMemories.step({
          step: (state.currentStep?.content.step ?? 0) + 1,
        });

        state.steps.push(stepMemory);
        state.currentStep = stepMemory;

        stepMemory.parent = { id: state.run!.id, kind: state.run!.kind };

        queue.forEach((mem) => {
          if (!mem.parent) {
            mem.parent = {
              kind: stepMemory.kind,
              id: stepMemory.id,
            };

            stepMemory.children.push({ id: mem.id, kind: mem.kind });
          }
        });

        await engine.pushMemories([stepMemory, ...queue]);

        try {
          console.log("run ctx");
          await ctx.context.run?.(state.chain, {
            ctx,
            engine,
            wm,
          });
        } catch (error) {
          console.log({ error });
        }
        // console.log("after run ctx");

        controller.signal.throwIfAborted();

        let content = await ctx.context.render?.(
          {
            chain: state.chain,
            components: state.components,
          },
          {
            ctx,
            engine,
            wm,
          }
        );

        // console.log(content);

        const prompt = content
          ? render(mainPrompt.template, {
              ...templateSections,
              content,
            })
          : mainPrompt.render(
              mainPrompt.formatter({
                actions: state.components.actions.map((ref) => ref.action),
                outputs: state.components.outputs.map((ref) => ref.output),
                contexts: state.components.contexts,
                memories: wm.data.memories,
                updates: state.chain,
                maxWorkingMemorySize: ctx.settings.maxWorkingMemorySize,
              })
            );

        // console.log(content);

        // const prompt = mainPrompt.render(promptData);
        let streamError: unknown | undefined = undefined;

        const settings: LLMGenerateSettings = {
          ...ctx.settings.modelSettings,
          ...state.params?.settings,
        };

        let model = agent.container.resolve<LanguageModel>("model");

        // const { model, config: modelConfig } = models
        //   .resolveLanguageModel
        //   // state.params?.model ?? ctx.settings?.model!
        //   ();

        // should never reach here without model

        if (!model) throw new Error("NO MODEL");

        const messages: CoreMessage[] = [
          {
            role: "user",
            content: prompt,
          },
        ];

        const { stream, getTextResponse } = await tasks.enqueue(
          streamTextTask,
          {
            model,
            messages,
            logger,
            settings,
            onError: (error: unknown) => {
              streamError = error;
            },
            modelConfig: undefined,
            tools: undefined,
          },
          {
            abortSignal: controller.signal,
          }
        );

        await handleStream(stream, streamState.index, tags, streamHandler);

        const response = await getTextResponse();
        console.log(prompt);
        console.log(response);

        if (streamError) {
          console.log({ streamError });
          throw streamError;
        }
      },

      async run() {
        if (state.running) return;
        state.running = true;

        const runMemory = workingMemories.run({});
        state.run = runMemory;

        await engine.push(runMemory);

        await engine.settled();

        try {
          while (engine.isRunning()) {
            console.log("run");
            controller.signal.throwIfAborted();
            await runner.run("engine.runStep", engine.runStep, {});
            await engine.settled();

            // if (!engine.shouldContinue()) {
            //   await engine.stop();
            // }

            if (state.steps.length > 2) await engine.stop();
          }
        } catch (error) {
          console.log({ error });
          await engine.stop();
        }

        state.defer.resolve(state.chain);
      },
    };
  },
});
