import type { BaseMemory } from "@daydreamsai/core";
import type { LanguageModelV1 } from "ai";
import { createSupabaseMemoryStore } from "./memory-store";
import { createSupabaseVectorStore } from "./vector-store";
import type { TextEmbeddingModel } from "./vector-store";

/**
 * Configuration for creating a Supabase-backed memory system
 */
export interface SupabaseMemoryConfig {
  /** Supabase URL */
  url: string;
  /** Supabase API key */
  key: string;
  /** Table name for storing memory data */
  memoryTableName?: string;
  /** Table name for storing vector embeddings */
  vectorTableName?: string;
  /** Optional embedding model for generating vector embeddings */
  vectorModel?: TextEmbeddingModel | LanguageModelV1;
}

/**
 * Adapts a TextEmbeddingModel to the LanguageModelV1 interface expected by BaseMemory
 * This is a compatibility layer to make our TextEmbeddingModel work with the core package
 * @param embeddingModel - The TextEmbeddingModel to adapt
 * @returns A LanguageModelV1 compatible object that delegates to the TextEmbeddingModel
 */
function adaptEmbeddingModel(
  embeddingModel: TextEmbeddingModel
): LanguageModelV1 {
  return {
    specificationVersion: "v1",
    provider: embeddingModel.provider,
    modelId: embeddingModel.modelId,
    defaultObjectGenerationMode: undefined,

    // These methods are required by LanguageModelV1 but not used for embeddings
    doGenerate: async () => {
      throw new Error("Not implemented - this adapter is for embeddings only");
    },

    doStream: async () => {
      throw new Error("Not implemented - this adapter is for embeddings only");
    },
  };
}

/**
 * Creates a complete memory system backed by Supabase
 *
 * This includes both a MemoryStore for conversation data and a VectorStore for embeddings.
 *
 * @param config - Configuration for the Supabase memory system
 * @returns A BaseMemory implementation using Supabase
 */
export function createSupabaseBaseMemory(
  config: SupabaseMemoryConfig
): BaseMemory {
  const {
    url,
    key,
    memoryTableName = "memory",
    vectorTableName = "embeddings",
    vectorModel,
  } = config;

  // Create the memory store
  const store = createSupabaseMemoryStore({
    url,
    key,
    tableName: memoryTableName,
  });

  // Determine if the provided model is a TextEmbeddingModel or LanguageModelV1
  const isTextEmbeddingModel =
    vectorModel &&
    "generateEmbeddings" in vectorModel &&
    typeof vectorModel.generateEmbeddings === "function";

  // Create the vector store with the appropriate embedding model
  const vector = createSupabaseVectorStore(
    {
      url,
      key,
      tableName: vectorTableName,
      embeddingColumnName: "embedding",
      contentColumnName: "content",
      metadataColumnName: "metadata",
    },
    isTextEmbeddingModel ? (vectorModel as TextEmbeddingModel) : undefined
  );

  // Return the complete memory system with the appropriate vectorModel
  return {
    store,
    vector,
    // Adapt TextEmbeddingModel to LanguageModelV1 if needed
    vectorModel: isTextEmbeddingModel
      ? adaptEmbeddingModel(vectorModel as TextEmbeddingModel)
      : (vectorModel as LanguageModelV1 | undefined),
  };
}
