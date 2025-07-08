import type { EmbeddingModelV1, ImageModelV1 } from "@ai-sdk/provider";
import type { LanguageModelV1, LanguageModelV1CallOptions } from "ai";

export type LLMGenerateSettings = Pick<
  LanguageModelV1CallOptions,
  | "maxTokens"
  | "temperature"
  | "topP"
  | "topK"
  | "presencePenalty"
  | "frequencyPenalty"
  | "seed"
  | "headers"
  | "providerMetadata"
>;

export type LanguageModel = LanguageModelV1;

export type LanguageModelConfig = Partial<{
  assist: boolean;
  stopAssist: boolean;
  prefix: string;
  suffix: string;
  isReasoningModel: boolean;
  reasoningTag: string;
}>;

export type TextEmbeddingModelConfig = Partial<{}>;
export type ImageModelConfig = Partial<{}>;

export type ModelKey<
  Provider extends string = string,
  Model extends string = string,
> = `${Provider}:${Model}`;

export interface ModelManager {
  resolveLanguageModel(model: ModelKey | LanguageModel): {
    model: LanguageModel;
    config: LanguageModelConfig | undefined;
  };

  languageModel(modelKey: ModelKey): {
    model: LanguageModel;
    config: LanguageModelConfig | undefined;
  };
  textEmbeddingModel(modelKey: ModelKey): {
    model: EmbeddingModelV1<string>;
    config: TextEmbeddingModelConfig | undefined;
  };
  imageModel(modelKey: ModelKey): {
    model: ImageModelV1;
    config: ImageModelConfig | undefined;
  };
}
