import {
  streamText,
  type CoreMessage,
  type LanguageModelV1,
  type StreamTextResult,
  type ToolSet,
} from "ai";
import type { LanguageModelConfig, LLMGenerateSettings } from "@/types/models";
import type { Logger } from "@/types/managers";
import { wrapStream } from "../utils";
import { task } from "@/definitions";

export type StreamTextParams = {
  messages: CoreMessage[];
  logger: Logger;
  model: LanguageModelV1;
  onError: (error: unknown) => void;
  settings?: LLMGenerateSettings;
  modelConfig?: LanguageModelConfig;

  tools: ToolSet | undefined;
  toolCallStreaming?: boolean;
};

function prepareStreamResponse({
  stream,
  prefix,
  suffix,
}: {
  stream: StreamTextResult<any, never>;
  prefix?: string;
  suffix?: string;
}) {
  return {
    getTextResponse: async () => {
      const result = await stream.text;
      const text = prefix + result + suffix;
      return text;
    },
    stream: wrapStream(stream.textStream, prefix, suffix),
  };
}

export type StreamTextTask = typeof streamTextTask;

export const streamTextTask = task({
  name: "llm:streamText",
  handler: async function llmStreamText(
    {
      messages,
      model,
      settings,
      modelConfig,
      onError,
      logger,
      ...params
    }: StreamTextParams,
    { abortSignal }
  ) {
    let prefix: string | undefined;
    let suffix: string | undefined;

    if (modelConfig?.assist !== false) {
      prefix = modelConfig?.prefix ?? "<response>";

      if (modelConfig?.isReasoningModel) {
        prefix = modelConfig?.reasoningTag ?? "<think>";
      }

      messages.push({
        role: "assistant",
        content: prefix,
      });
    }

    let stopSequences: string[] | undefined = undefined;

    if (modelConfig?.stopAssist !== false) {
      suffix = modelConfig?.suffix ?? "</response>";
      if (suffix) stopSequences = [suffix];
    }

    const stream = streamText({
      ...params,
      ...settings,
      model,
      messages,
      abortSignal,
      stopSequences,
      maxSteps: 1,
      onError: (event) => {
        console.log("error");
        onError(event.error);
      },
    });

    return prepareStreamResponse({
      stream,
      prefix,
      suffix,
    });
  },
});
