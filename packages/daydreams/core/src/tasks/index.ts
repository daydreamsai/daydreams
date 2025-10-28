import { streamText, type CoreMessage, type LanguageModel } from "ai";
import { task } from "../task";
import type {
  Action,
  ActionCallContext,
  AnyAction,
  AnyAgent,
  AnyContext,
  WorkingMemory,
  Log,
  LogChunk,
  AnyRef,
  Output,
} from "../types";
import type { Logger } from "../logger";
import { modelsResponseConfig, reasoningModels } from "../config";
import { generateText } from "ai";
import { createEngine } from "../engine";
import { createContextStreamHandler } from "../handlers";
import type { StackElement, StackElementChunk } from "../handlers";
import type { ResponseAdapter, PromptBuildResult } from "../types";
import { saveContextWorkingMemory } from "../context";

/**
 * Helper to extract model properties safely from LanguageModel union type
 */
function getModelInfo(model: LanguageModel): {
  modelId: string;
  provider: string;
} {
  if (typeof model === "string") {
    return { modelId: model, provider: "unknown" };
  }
  return {
    modelId: model.modelId || "unknown",
    provider: model.provider || "unknown",
  };
}

function getReasoningTokens(usage: unknown): number | undefined {
  if (usage && typeof usage === "object" && "reasoningTokens" in usage) {
    const v = (usage as { reasoningTokens?: unknown }).reasoningTokens;
    return typeof v === "number" ? v : undefined;
  }
  return undefined;
}
/**
 * Prepares a stream response by handling the stream result and parsing it.
 *
 * @param options - Configuration options
 * @param options.contextId - The ID of the context
 * @param options.step - The current step in the process
 * @param options.stream - The stream result to process
 * @param options.logger - The logger instance
 * @param options.task - The task context containing callId and debug function
 * @returns An object containing the parsed response promise and wrapped text stream
 */
// Stream wrapping handled by ResponseAdapter

type GenerateOptions = {
  prompt: string;
  workingMemory: WorkingMemory;
  logger: Logger;
  model: LanguageModel;
  streaming: boolean;
  onError: (error: unknown) => void;
  requestId?: string;
  userId?: string;
  sessionId?: string;
  contextSettings?: {
    modelSettings?: {
      temperature?: number;
      maxTokens?: number;
      topP?: number;
      topK?: number;
      stopSequences?: string[];
      providerOptions?: Record<string, any>;
      [key: string]: any;
    };
  };
  adapter: ResponseAdapter;
};

export const runGenerate = task({
  key: "agent:run:generate",
  handler: async (
    {
      prompt,
      workingMemory,
      model,
      streaming,
      onError,
      requestId,
      userId,
      sessionId,
      contextSettings,
      logger,
      adapter,
    }: GenerateOptions,
    { abortSignal }
  ) => {
    const { modelId, provider } = getModelInfo(model);
    const isReasoningModel = reasoningModels.includes(modelId);
    const modelSettings = contextSettings?.modelSettings || {};

    const messages: CoreMessage[] = [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: prompt,
          },
        ],
      },
    ];

    if (modelsResponseConfig[modelId]?.assist !== false)
      messages.push({
        role: "assistant",
        content: isReasoningModel
          ? modelsResponseConfig[modelId]?.thinkTag ?? "<think>"
          : "<response>",
      });

    if (workingMemory.currentImage) {
      messages[0].content = [
        ...messages[0].content,
        {
          type: "image",
          image: workingMemory.currentImage,
        },
      ] as CoreMessage["content"];
    }

    const startTime = Date.now();

    try {
      // Log action and model call start events
      logger.event("ACTION_START", {
        requestId,
        userId,
        sessionId,
        actionName: "generate_text",
      });

      logger.event("MODEL_CALL_START", {
        requestId,
        userId,
        sessionId,
        provider: provider,
        modelId: modelId,
        callType: streaming ? "stream" : "generate",
        actionName: "generate_text",
      });

      if (!streaming) {
        const response = await generateText({
          model,
          messages,
          temperature: modelSettings.temperature ?? undefined,
          maxTokens: modelSettings.maxTokens,
          topP: modelSettings.topP,
          topK: modelSettings.topK,
          stopSequences: modelSettings.stopSequences,
          providerOptions: modelSettings.providerOptions,
          ...modelSettings,
        });

        const endTime = Date.now();

        // Log model call complete event
        if (response.usage) {
          const tokenUsage = {
            input: response.usage.inputTokens ?? 0,
            output: response.usage.outputTokens ?? 0,
            total: response.usage.totalTokens ?? 0,
            reasoning: getReasoningTokens(response.usage),
          };

          logger.event("MODEL_CALL_COMPLETE", {
            requestId,
            userId,
            sessionId,
            provider: provider,
            modelId: modelId,
            callType: "generate",
            actionName: "generate_text",
            tokens: tokenUsage,
            duration: endTime - startTime,
          });
        }

        // Log action complete event
        logger.event("ACTION_COMPLETE", {
          requestId,
          userId,
          sessionId,
          actionName: "generate_text",
          duration: endTime - startTime,
        });

        let getTextResponse = async () => response.text;
        let stream = textToStream(response.text);

        return { getTextResponse, stream };
      } else {
        const stream = streamText({
          model,
          messages,
          stopSequences: modelSettings.stopSequences,
          temperature: modelSettings.temperature ?? undefined,
          maxTokens: modelSettings.maxTokens,
          topP: modelSettings.topP,
          topK: modelSettings.topK,
          abortSignal,
          providerOptions: modelSettings.providerOptions,
          onError: (event) => {
            onError(event.error);
          },
          ...modelSettings,
        });

        // Track streaming model call when it completes
        stream.usage
          .then(async (usage) => {
            const endTime = Date.now();

            // Log model call complete event for streaming
            if (usage) {
              const tokenUsage = {
                input: usage.inputTokens ?? 0,
                output: usage.outputTokens ?? 0,
                total: usage.totalTokens ?? 0,
                reasoning: getReasoningTokens(usage),
              };

              logger.event("MODEL_CALL_COMPLETE", {
                requestId,
                userId,
                sessionId,
                provider: provider,
                modelId: modelId,
                callType: "stream",
                actionName: "generate_text",
                tokens: tokenUsage,
                duration: endTime - startTime,
              });
            }

            // Log action complete event
            logger.event("ACTION_COMPLETE", {
              requestId,
              userId,
              sessionId,
              actionName: "generate_text",
              duration: endTime - startTime,
            });
          })
          .catch(async (error: any) => {
            const endTime = Date.now();

            // Log model call error event
            logger.event("MODEL_CALL_ERROR", {
              requestId,
              userId,
              sessionId,
              provider: provider,
              modelId: modelId,
              callType: "stream",
              actionName: "generate_text",
              duration: endTime - startTime,
              error: {
                message: error.message || "Stream failed",
                cause: error,
              },
            });

            // Log action error event
            logger.event("ACTION_ERROR", {
              requestId,
              userId,
              sessionId,
              actionName: "generate_text",
              duration: endTime - startTime,
              error: {
                message: error.message || "Stream failed",
                cause: error,
              },
            });
          });

        return adapter.prepareStream({ model, stream, isReasoningModel });
      }
    } catch (error) {
      const endTime = Date.now();

      // Log model call error event
      logger.event("MODEL_CALL_ERROR", {
        requestId,
        userId,
        sessionId,
        provider: provider,
        modelId: modelId,
        callType: streaming ? "stream" : "generate",
        actionName: "generate_text",
        duration: endTime - startTime,
        error: {
          message: error instanceof Error ? error.message : "Model call failed",
          cause: error,
        },
      });

      // Log action error event
      logger.event("ACTION_ERROR", {
        requestId,
        userId,
        sessionId,
        actionName: "generate_text",
        duration: endTime - startTime,
        error: {
          message:
            error instanceof Error ? error.message : "Generate action failed",
          cause: error,
        },
      });

      onError(error);
      throw error;
    }
  },
});

async function* textToStream(
  text: string,
  chunkSize = 10
): AsyncGenerator<string> {
  for (let i = 0; i < text.length; i += chunkSize) {
    const chunk = text.slice(i, i + chunkSize);
    yield chunk;
    // Optional: add a small delay to simulate streaming
    // await new Promise(resolve => setTimeout(resolve, 10));
  }
}

/**
 * Task that executes a complete agent context run
 * This replaces the direct agent.run() to provide proper concurrency control
 */
export const runAgentContext = task({
  key: "agent:run:context",
  concurrency: 1, // Only 1 execution per queue (per context)
  retry: false, // Context runs shouldn't retry
  handler: async (
    params: {
      agent: AnyAgent;
      context: AnyContext;
      args: unknown;
      outputs?: Record<string, Omit<Output<any, any, any, any>, "name">>;
      handlers?: Record<string, unknown>;
      requestId?: string;
      userId?: string;
      sessionId?: string;
      chain?: Log[];
      model?: LanguageModel;
    },
    { abortSignal }
  ) => {
    const {
      agent,
      context,
      args,
      outputs,
      handlers,
      requestId,
      userId,
      sessionId,
      chain,
    } = params;

    const model = params.model ?? context.model ?? agent.model;
    if (!model) throw new Error("no model");

    const startTime = Date.now();

    agent.logger.event("AGENT_START", {
      requestId,
      userId,
      sessionId,
      agentName: "agent",
      configuration: {
        contextType: context.type,
        hasArgs: !!args,
        hasCustomOutputs: !!outputs,
        hasHandlers: !!handlers,
        model: model,
      },
    });

    const ctxId = agent.getContextId({ context, args });

    // Get context state and working memory
    const ctxState = await agent.getContext({ context, args });
    const workingMemory = await agent.getWorkingMemory(ctxId);
    const agentCtxState = await agent.getAgentContext();

    // Create engine and streaming components

    // Create empty subscriptions for this execution
    const subscriptions = new Set<(ref: AnyRef, done: boolean) => void>();
    const chunkSubscriptions = new Set<(chunk: LogChunk) => void>();

    const engine = createEngine({
      agent,
      ctxState: ctxState,
      workingMemory,
      handlers,
      agentCtxState: agentCtxState,
      subscriptions,
      __chunkSubscriptions: chunkSubscriptions,
    });

    const { streamState, streamHandler, tags, __streamChunkHandler } =
      createContextStreamHandler({
        abortSignal,
        pushLog(log: Log, done: boolean) {
          engine.push(log, done, false);
        },
        __pushLogChunk(chunk: LogChunk) {
          engine.pushChunk(chunk);
        },
      });

    await engine.setParams({
      actions: undefined,
      outputs: outputs,
      contexts: undefined,
    });

    let stepRef = await engine.start();

    if (chain) {
      for (const log of chain) {
        await engine.push(log);
      }
    }

    await engine.settled();

    const { state } = engine;
    let maxSteps = 0;

    function getMaxSteps() {
      return state.contexts.reduce(
        (maxSteps, ctxState) =>
          Math.max(
            maxSteps,
            ctxState.settings.maxSteps ?? ctxState.context.maxSteps ?? 0
          ),
        5
      );
    }

    while ((maxSteps = getMaxSteps()) >= state.step) {
      try {
        if (state.step > 1) {
          stepRef = await engine.nextStep();
          streamState.index++;
        }

        const buildResult: PromptBuildResult = await agent.prompt.build({
          contexts: state.contexts,
          actions: state.actions,
          outputs: state.outputs,
          workingMemory,
          chainOfThoughtSize: 0,
          settings: {
            maxWorkingMemorySize: ctxState.settings.maxWorkingMemorySize,
          },
          agent,
        });

        const prompt = buildResult.prompt;

        agent.logger.trace("agent:run", "Prompt", {
          prompt: JSON.stringify(prompt),
        });

        stepRef.data.prompt = prompt;

        let streamError: unknown = null;

        const unprocessed = [
          ...workingMemory.inputs.filter((i) => i.processed === false),
          ...state.chain.filter((i) => i.processed === false),
        ];

        // Use runGenerate task with shared LLM queue
        const { stream, getTextResponse } = await agent.taskRunner.enqueueTask(
          runGenerate,
          {
            model,
            prompt,
            workingMemory,
            logger: agent.logger,
            streaming: true,
            contextSettings: ctxState.settings,
            requestId,
            userId,
            sessionId,
            adapter: agent.response,
            onError: (error: unknown) => {
              streamError = error;
            },
          },
          {
            abortSignal,
            queueKey: "llm", // Shared LLM queue
          }
        );

        await agent.response.handleStream({
          textStream: stream,
          index: streamState.index,
          pushLog(log, done) {
            engine.push(log, done, false);
          },
          pushChunk: (chunk) => engine.pushChunk(chunk),
          abortSignal,
          defaultHandlers: {
            tags,
            streamHandler: (el: unknown) => streamHandler(el as StackElement),
            __streamChunkHandler: __streamChunkHandler
              ? (chunk: unknown) =>
                  __streamChunkHandler(chunk as StackElementChunk)
              : undefined,
          },
        });

        if (streamError) {
          throw streamError;
        }

        const response = await getTextResponse();

        agent.logger.trace("agent:run", "Response", {
          response,
        });

        stepRef.data.response = response;

        unprocessed.forEach((i) => {
          (i as { processed: boolean }).processed = true;
        });

        await engine.settled();
        stepRef.processed = true;

        // Save working memory
        await saveContextWorkingMemory(agent, ctxState.id, workingMemory);

        await Promise.all(
          state.contexts.map((state) =>
            state.context.onStep?.(
              {
                ...state,
                workingMemory,
              },
              agent
            )
          )
        );

        await Promise.all(
          state.contexts.map((state) => agent.saveContext(state))
        );

        if (!engine.shouldContinue()) break;

        state.step++;
      } catch (error) {
        agent.logger.error("agent:run", "Step execution failed", {
          error,
          step: state.step,
          contextId: ctxState.id,
        });

        await Promise.allSettled([
          saveContextWorkingMemory(agent, ctxState.id, workingMemory),
          ...state.contexts.map((state) => agent.saveContext(state)),
        ]);

        if (context.onError) {
          try {
            await context.onError(
              error,
              {
                ...ctxState,
                workingMemory,
              },
              agent
            );
          } catch (error) {
            break;
          }
        } else {
          break;
        }
      }
    }

    await Promise.all(
      state.contexts.map((state) =>
        state.context.onRun?.(
          {
            ...state,
            workingMemory,
          },
          agent
        )
      )
    );

    await Promise.all(state.contexts.map((state) => agent.saveContext(state)));

    const executionTime = Date.now() - startTime;

    // Log agent complete event
    agent.logger.event("AGENT_COMPLETE", {
      requestId,
      userId,
      sessionId,
      agentName: "agent",
      executionTime,
    });

    agent.logger.info("agent:run", "Run completed", {
      contextId: ctxState.id,
      chainLength: state.chain.length,
      executionTime,
    });

    return state.chain;
  },
});

/**
 * Task that executes an action with the given context and parameters.
 *
 * @param options - Configuration options
 * @param options.ctx - The agent context with memory
 * @param options.action - The action to execute
 * @param options.call - The action call details
 * @param options.agent - The agent instance
 * @param options.logger - The logger instance
 * @returns The result of the action execution
 * @throws Will throw an error if the action execution fails
 */
export const runAction = task({
  key: "agent:run:action",
  handler: async <TContext extends AnyContext>({
    ctx,
    action,
    agent,
    logger,
    requestId,
    userId,
    sessionId,
  }: {
    ctx: ActionCallContext<any, TContext>;
    action: AnyAction;
    agent: AnyAgent;
    logger: Logger;
    requestId?: string;
    userId?: string;
    sessionId?: string;
  }) => {
    logger.info(
      "agent:action_call:" + ctx.call.id,
      ctx.call.name,
      JSON.stringify(ctx.call.data)
    );

    const startTime = Date.now();

    // Log action start event
    logger.event("ACTION_START", {
      requestId,
      userId,
      sessionId,
      actionName: ctx.call.name,
    });

    try {
      const result =
        action.schema === undefined
          ? await (action as Action<undefined>).handler(
              ctx as unknown as ActionCallContext<undefined, AnyContext>,
              agent
            )
          : await (action.handler as any)(ctx.call.data, ctx, agent);

      logger.debug("agent:action_result:" + ctx.call.id, ctx.call.name, result);

      // Log action complete event
      logger.event("ACTION_COMPLETE", {
        requestId,
        userId,
        sessionId,
        actionName: ctx.call.name,
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorDetails = {
        actionName: ctx.call.name,
        callId: ctx.call.id,
        error: errorMessage,
        errorStack: error instanceof Error ? error.stack : undefined,
        callData: ctx.call.data,
      };

      logger.error(
        "agent:action",
        `Action '${ctx.call.name}' failed: ${errorMessage}`,
        errorDetails
      );

      // Log action error event
      logger.event("ACTION_ERROR", {
        requestId,
        userId,
        sessionId,
        actionName: ctx.call.name,
        duration: Date.now() - startTime,
        error: {
          message: errorMessage,
          cause: error,
        },
      });

      if (action.onError) {
        return await action.onError(error, ctx as any, agent);
      } else {
        throw error;
      }
    }
  },
});
