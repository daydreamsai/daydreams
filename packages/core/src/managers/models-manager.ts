import type { ProviderV1 } from "@ai-sdk/provider";
import type {
  ModelManager,
  ModelKey,
  LanguageModelConfig,
  ImageModelConfig,
  TextEmbeddingModelConfig,
} from "@/types/models";

export function createModelsManager(): ModelManager {
  const providers = new Map<string, ProviderV1>();

  const llmsConfigs = new Map<ModelKey, LanguageModelConfig>();
  const imageModelsConfigs = new Map<ModelKey, ImageModelConfig>();
  const textEmbeddingModelConfigs = new Map<
    ModelKey,
    TextEmbeddingModelConfig
  >();

  return {
    resolveLanguageModel(model) {
      if (typeof model === "string") return this.languageModel(model);
      return {
        model,
        config: llmsConfigs.get(model.modelId as ModelKey),
      };
    },

    languageModel(modelKey) {
      const [provider, modelId] = modelKey.split(":");
      const model = providers.get(provider)!.languageModel(modelId);
      if (!model) throw new Error("invalid model");
      return { model, config: llmsConfigs.get(modelKey) };
    },

    textEmbeddingModel(modelKey) {
      const [provider, modelId] = modelKey.split(":");
      const model = providers.get(provider)!.textEmbeddingModel(modelId);
      return { model, config: textEmbeddingModelConfigs.get(modelKey) };
    },

    imageModel(modelKey) {
      const [provider, modelId] = modelKey.split(":");
      const model = providers.get(provider)!.imageModel?.(modelId);
      if (!model) throw new Error("invalid model");
      return { model, config: imageModelsConfigs.get(modelKey) };
    },
  };
}
