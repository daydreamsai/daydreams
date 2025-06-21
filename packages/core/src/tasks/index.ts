import {
  streamText,
  type CoreMessage,
  type LanguageModelV1,
  type StreamTextResult,
  type ToolSet,
} from "ai";
import { task } from "../task";
import type {
  Action,
  ActionCallContext,
  AnyAction,
  AnyAgent,
  AnyContext,
  WorkingMemory,
} from "../types";
import type { Logger } from "../logger";
import { wrapStream } from "../streaming";
import { modelsResponseConfig, reasoningModels } from "../configs";
import { generateText } from "ai";
import { type RequestContext } from "../tracking";
import { getRequestTracker } from "../tracking/tracker";
import { LogEventType, StructuredLogger } from "../logging-events";
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
function prepareStreamResponse({
  model,
  stream,
  isReasoningModel,
}: {
  model: LanguageModelV1;
  stream: StreamTextResult<ToolSet, never>;
  isReasoningModel: boolean;
}) {
  const prefix =
    modelsResponseConfig[model.modelId]?.prefix ??
    (isReasoningModel
      ? modelsResponseConfig[model.modelId]?.thinkTag ?? "<think>"
      : "<response>");
  const suffix = "</response>";
  return {
    getTextResponse: async () => {
      const result = await stream.text;
      const text = prefix + result + suffix;
      return text;
    },
    stream: wrapStream(stream.textStream, prefix, suffix),
  };
}

type GenerateOptions = {
  prompt: string;
  workingMemory: WorkingMemory;
  logger: Logger;
  structuredLogger?: StructuredLogger;
  model: LanguageModelV1;
  streaming: boolean;
  onError: (error: unknown) => void;
  requestContext?: RequestContext;
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
      requestContext,
      contextSettings,
      structuredLogger,
    }: GenerateOptions,
    { abortSignal }
  ) => {
    const isReasoningModel = reasoningModels.includes(model.modelId);
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

    if (modelsResponseConfig[model.modelId]?.assist !== false)
      messages.push({
        role: "assistant",
        content: isReasoningModel
          ? modelsResponseConfig[model.modelId]?.thinkTag ?? "<think>"
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

    const tracker = getRequestTracker();
    const startTime = Date.now();
    let modelCallId: string | undefined;

    // Start context and action tracking if requestContext is provided
    let contextTrackingContext = requestContext;
    let actionTrackingContext = requestContext;

    if (requestContext && requestContext.trackingEnabled) {
      // Start context tracking for the "generate" context
      contextTrackingContext = await tracker.startContextTracking(
        requestContext,
        `generate-${Date.now()}`, // Unique context ID
        "generate"
      );

      // Start action tracking for the "generate" action
      actionTrackingContext = await tracker.startActionCall(
        contextTrackingContext,
        "generate_text"
      );
    }

    try {
      // Log model call start event
      if (structuredLogger && actionTrackingContext) {
        structuredLogger.logEvent({
          eventType: LogEventType.MODEL_CALL_START,
          timestamp: startTime,
          requestContext: actionTrackingContext,
          provider: model.provider || "unknown",
          modelId: model.modelId,
          callType: streaming ? "stream" : "generate",
          inputTokens: undefined, // Not available before the call
        });
      }

      if (!streaming) {
        const response = await generateText({
          model,
          messages,
          temperature: modelSettings.temperature ?? 0.2,
          maxTokens: modelSettings.maxTokens,
          topP: modelSettings.topP,
          topK: modelSettings.topK,
          stopSequences: modelSettings.stopSequences,
          providerOptions: modelSettings.providerOptions,
          ...modelSettings,
        });

        const endTime = Date.now();

        // Track the model call
        if (actionTrackingContext && actionTrackingContext.trackingEnabled) {
          modelCallId = await tracker.trackModelCall(
            actionTrackingContext,
            "generate",
            model.modelId,
            model.provider || "unknown",
            {
              tokenUsage: response.usage
                ? {
                    inputTokens: response.usage.promptTokens,
                    outputTokens: response.usage.completionTokens,
                    totalTokens: response.usage.totalTokens,
                    reasoningTokens: (response.usage as any).reasoningTokens,
                  }
                : undefined,
              metrics: {
                modelId: model.modelId,
                provider: model.provider || "unknown",
                totalTime: endTime - startTime,
                tokensPerSecond: response.usage
                  ? response.usage.completionTokens /
                    ((endTime - startTime) / 1000)
                  : undefined,
              },
            }
          );
        }

        // Log structured model call complete event
        if (structuredLogger && actionTrackingContext && response.usage) {
          const tokenUsage = {
            inputTokens: response.usage.promptTokens,
            outputTokens: response.usage.completionTokens,
            totalTokens: response.usage.totalTokens,
            reasoningTokens: (response.usage as any).reasoningTokens,
          };

          // Add cost estimation if tracking is enabled
          const tracker = getRequestTracker();
          const config = tracker.getConfig();
          if (config.trackCosts && config.costEstimation) {
            const { estimateCost } = await import("../tracking");
            // Try multiple provider key combinations for better matching
            const providerKeys = [
              `${model.provider}/${model.modelId}`, // e.g., "openrouter.chat/google/gemini-2.5-pro"
              model.provider || "unknown",          // e.g., "openrouter.chat"
              model.modelId.split('/')[0]            // e.g., "google"
            ];
            
            let cost = 0;
            for (const providerKey of providerKeys) {
              cost = estimateCost(tokenUsage, providerKey, config.costEstimation);
              if (cost > 0) break; // Found a matching cost configuration
            }
            (tokenUsage as any).estimatedCost = cost;
          }

          structuredLogger.logEvent({
            eventType: LogEventType.MODEL_CALL_COMPLETE,
            timestamp: endTime,
            requestContext: actionTrackingContext,
            provider: model.provider || "unknown",
            modelId: model.modelId,
            callType: "generate",
            tokenUsage,
            metrics: {
              modelId: model.modelId,
              provider: model.provider || "unknown",
              totalTime: endTime - startTime,
              tokensPerSecond:
                response.usage.completionTokens /
                ((endTime - startTime) / 1000),
            },
          });
        }

        let getTextResponse = async () => response.text;
        let stream = textToStream(response.text);

        return { getTextResponse, stream };
      } else {
        const stream = streamText({
          model,
          messages,
          stopSequences: modelSettings.stopSequences ?? ["\n</response>"],
          temperature: modelSettings.temperature ?? 0.5,
          maxTokens: modelSettings.maxTokens,
          topP: modelSettings.topP,
          topK: modelSettings.topK,
          abortSignal,
          // experimental_transform: smoothStream({
          //   chunking: "word",
          // }),
          providerOptions: modelSettings.providerOptions || {
            openrouter: {
              reasoning: {
                max_tokens: 32768,
              },
            },
          },
          onError: (event) => {
            onError(event.error);
          },
          ...modelSettings,
        });

        // Track streaming model call when it completes
        if (actionTrackingContext && actionTrackingContext.trackingEnabled) {
          // Track after stream finishes - we'll use a simpler approach
          stream.usage
            .then(async (usage) => {
              const endTime = Date.now();

              await tracker.trackModelCall(
                actionTrackingContext,
                "stream",
                model.modelId,
                model.provider || "unknown",
                {
                  tokenUsage: usage
                    ? {
                        inputTokens: usage.promptTokens,
                        outputTokens: usage.completionTokens,
                        totalTokens: usage.totalTokens,
                        reasoningTokens: (usage as any).reasoningTokens,
                      }
                    : undefined,
                  metrics: {
                    modelId: model.modelId,
                    provider: model.provider || "unknown",
                    totalTime: endTime - startTime,
                    tokensPerSecond: usage
                      ? usage.completionTokens / ((endTime - startTime) / 1000)
                      : undefined,
                  },
                }
              );

              // Log structured model call complete event for streaming
              if (structuredLogger && actionTrackingContext && usage) {
                const tokenUsage = {
                  inputTokens: usage.promptTokens,
                  outputTokens: usage.completionTokens,
                  totalTokens: usage.totalTokens,
                  reasoningTokens: (usage as any).reasoningTokens,
                };

                // Add cost estimation if tracking is enabled
                const tracker = getRequestTracker();
                const config = tracker.getConfig();
                if (config.trackCosts && config.costEstimation) {
                  const { estimateCost } = await import("../tracking");
                  // Try multiple provider key combinations for better matching
                  const providerKeys = [
                    `${model.provider}/${model.modelId}`, // e.g., "openrouter.chat/google/gemini-2.5-pro"
                    model.provider || "unknown",          // e.g., "openrouter.chat"
                    model.modelId.split('/')[0]            // e.g., "google"
                  ];
                  
                  let cost = 0;
                  for (const providerKey of providerKeys) {
                    cost = estimateCost(tokenUsage, providerKey, config.costEstimation);
                    if (cost > 0) break; // Found a matching cost configuration
                  }
                  (tokenUsage as any).estimatedCost = cost;
                }

                structuredLogger.logEvent({
                  eventType: LogEventType.MODEL_CALL_COMPLETE,
                  timestamp: endTime,
                  requestContext: actionTrackingContext,
                  provider: model.provider || "unknown",
                  modelId: model.modelId,
                  callType: "stream",
                  tokenUsage,
                  metrics: {
                    modelId: model.modelId,
                    provider: model.provider || "unknown",
                    totalTime: endTime - startTime,
                    tokensPerSecond:
                      usage.completionTokens / ((endTime - startTime) / 1000),
                  },
                });
              }

              // Complete action tracking for successful streaming
              if (
                actionTrackingContext &&
                actionTrackingContext.actionCallId &&
                actionTrackingContext.trackingEnabled
              ) {
                await tracker.completeActionCall(
                  actionTrackingContext.actionCallId,
                  "completed"
                );
              }
            })
            .catch(async (error: any) => {
              // Track failed streaming call
              if (
                actionTrackingContext &&
                actionTrackingContext.trackingEnabled
              ) {
                await tracker.trackModelCall(
                  actionTrackingContext,
                  "stream",
                  model.modelId,
                  model.provider || "unknown",
                  {
                    error: {
                      message: error.message || "Stream failed",
                      cause: error,
                    },
                    metrics: {
                      modelId: model.modelId,
                      provider: model.provider || "unknown",
                      totalTime: Date.now() - startTime,
                    },
                  }
                );
              }

              // Complete action tracking for failed streaming
              if (
                actionTrackingContext &&
                actionTrackingContext.actionCallId &&
                actionTrackingContext.trackingEnabled
              ) {
                await tracker.completeActionCall(
                  actionTrackingContext.actionCallId,
                  "failed",
                  {
                    message: error.message || "Stream failed",
                    cause: error,
                  }
                );
              }
            });
        }

        return prepareStreamResponse({
          model,
          stream,
          isReasoningModel,
        });
      }
    } catch (error) {
      // Track failed model call
      if (actionTrackingContext && actionTrackingContext.trackingEnabled) {
        const endTime = Date.now();
        await tracker.trackModelCall(
          actionTrackingContext,
          streaming ? "stream" : "generate",
          model.modelId,
          model.provider || "unknown",
          {
            error: {
              message:
                error instanceof Error ? error.message : "Model call failed",
              cause: error,
            },
            metrics: {
              modelId: model.modelId,
              provider: model.provider || "unknown",
              totalTime: endTime - startTime,
            },
          }
        );
      }

      // Log structured model call error event
      if (structuredLogger && actionTrackingContext) {
        structuredLogger.logEvent({
          eventType: LogEventType.MODEL_CALL_ERROR,
          timestamp: Date.now(),
          requestContext: actionTrackingContext,
          provider: model.provider || "unknown",
          modelId: model.modelId,
          callType: streaming ? "stream" : "generate",
          error: {
            message:
              error instanceof Error ? error.message : "Model call failed",
            cause: error,
          },
        });
      }

      // Complete action and context tracking with error
      if (
        actionTrackingContext &&
        actionTrackingContext.actionCallId &&
        actionTrackingContext.trackingEnabled
      ) {
        await tracker.completeActionCall(
          actionTrackingContext.actionCallId,
          "failed",
          {
            message:
              error instanceof Error ? error.message : "Generate action failed",
            cause: error,
          }
        );
      }

      onError(error);
      throw error;
    } finally {
      // Complete action and context tracking for non-streaming calls
      if (
        !streaming &&
        actionTrackingContext &&
        actionTrackingContext.actionCallId &&
        actionTrackingContext.trackingEnabled
      ) {
        await tracker.completeActionCall(
          actionTrackingContext.actionCallId,
          "completed"
        );
      }
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
  }: {
    ctx: ActionCallContext<any, TContext>;
    action: AnyAction;
    agent: AnyAgent;
    logger: Logger;
  }) => {
    logger.info(
      "agent:action_call:" + ctx.call.id,
      ctx.call.name,
      JSON.stringify(ctx.call.data)
    );

    try {
      const result =
        action.schema === undefined
          ? await Promise.try((action as Action<undefined>).handler, ctx, agent)
          : await Promise.try(action.handler as any, ctx.call.data, ctx, agent);

      logger.debug("agent:action_result:" + ctx.call.id, ctx.call.name, result);

      return result;
    } catch (error) {
      logger.error("agent:action", "ACTION_FAILED", { error });

      if (action.onError) {
        return await Promise.try(action.onError, error, ctx, agent);
      } else {
        throw error;
      }
    }
  },
});
