import { type VectorStore } from "@daydreamsai/core";
import { SupabaseVectorStore } from "./supabase";
import type { SupabaseVectorStoreConfig } from "./types";

/**
 * Interface for text embedding models
 */
export interface TextEmbeddingModel {
  /**
   * Provider name for the embedding model
   */
  provider: string;

  /**
   * Model ID for the embedding model
   */
  modelId: string;

  /**
   * Generates embeddings for an array of text strings
   * @param texts - Array of text strings to embed
   * @returns Promise resolving to a 2D array of embeddings
   */
  generateEmbeddings(texts: string[]): Promise<number[][]>;
}

/**
 * Creates a default OpenAI embedding provider
 * @param apiKey - OpenAI API key (defaults to process.env.OPENAI_API_KEY)
 * @param model - OpenAI embedding model to use (defaults to text-embedding-3-small)
 * @returns A TextEmbeddingModel implementation for generating embeddings
 */
export function createOpenAIEmbeddingProvider(
  apiKey: string = process.env.OPENAI_API_KEY || "",
  model: string = "text-embedding-3-small"
): TextEmbeddingModel {
  return {
    provider: "openai",
    modelId: model,

    async generateEmbeddings(texts: string[]): Promise<number[][]> {
      if (!apiKey) {
        throw new Error("OpenAI API key is required for embedding generation");
      }

      try {
        // Use fetch directly to avoid requiring the OpenAI SDK as a dependency
        const response = await fetch("https://api.openai.com/v1/embeddings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            input: texts,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(`OpenAI API error: ${JSON.stringify(error)}`);
        }

        const data = await response.json();
        return data.data.map((item: any) => item.embedding);
      } catch (error) {
        console.error("Error generating embeddings:", error);
        throw error;
      }
    },
  };
}

/**
 * Creates a Supabase vector store that implements the core VectorStore interface
 *
 * @param config - Configuration for the Supabase vector store
 * @param embeddingProvider - Optional embedding provider (defaults to OpenAI if API key is available)
 * @returns A VectorStore implementation using Supabase with pgvector
 */
export function createSupabaseVectorStore(
  config: SupabaseVectorStoreConfig,
  embeddingProvider?: TextEmbeddingModel
): VectorStore {
  // Create the underlying SupabaseVectorStore
  const supabaseStore = SupabaseVectorStore.fromConfig(config);

  // Initialize the store with default dimensions
  // This is done asynchronously, but we don't await it here
  // to match the synchronous nature of the factory function
  supabaseStore.initialize().catch(console.error);

  // Use provided embedding provider or create a default one if OpenAI API key is available
  const embedder =
    embeddingProvider ||
    (process.env.OPENAI_API_KEY ? createOpenAIEmbeddingProvider() : undefined);

  return {
    connection: config.url,

    /**
     * Adds or updates data in the vector store
     * @param contextId - Unique identifier for the context
     * @param data - Data to add or update
     */
    async upsert(contextId: string, data: any[]): Promise<void> {
      // Generate embeddings if needed and if we have an embedding provider
      let dataWithEmbeddings = [...data];

      if (embedder) {
        const itemsNeedingEmbeddings = data.filter(
          (item) =>
            !item.embedding ||
            !Array.isArray(item.embedding) ||
            item.embedding.length === 0
        );

        if (itemsNeedingEmbeddings.length > 0) {
          const textsToEmbed = itemsNeedingEmbeddings.map(
            (item) => item.content || item.text || JSON.stringify(item)
          );
          const embeddings = await embedder.generateEmbeddings(textsToEmbed);

          // Update items with their embeddings
          let embeddingIndex = 0;
          dataWithEmbeddings = data.map((item) => {
            if (
              !item.embedding ||
              !Array.isArray(item.embedding) ||
              item.embedding.length === 0
            ) {
              return {
                ...item,
                embedding: embeddings[embeddingIndex++],
              };
            }
            return item;
          });
        }
      }

      // Convert the data to the format expected by SupabaseVectorStore
      const records = dataWithEmbeddings.map((item, index) => {
        // If the item already has an embedding, use it
        const embedding = item.embedding || [];

        return {
          id: item.id || `${contextId}-${index}`,
          content: item.content || item.text || JSON.stringify(item),
          embedding: embedding,
          metadata: {
            contextId,
            ...item.metadata,
          },
        };
      });

      await supabaseStore.addVectors(records);
    },

    /**
     * Searches the vector store for similar data
     * @param contextId - Context to search within
     * @param query - Query text to search for or query object with embedding
     * @returns Array of matching documents
     */
    async query(contextId: string, query: any): Promise<any[]> {
      // This implementation assumes that embeddings are generated elsewhere
      // and passed in the query parameter as an object with an embedding property
      const queryObj = typeof query === "string" ? { text: query } : query;

      // If we have an embedding in the query object, use it for similarity search
      if (queryObj.embedding && Array.isArray(queryObj.embedding)) {
        const results = await supabaseStore.similaritySearch(
          queryObj.embedding,
          {
            filter: {
              metadata: { contextId },
            },
            matchThreshold: queryObj.threshold || 0.5,
            maxResults: queryObj.limit || 10,
          }
        );

        return results.map((result) => ({
          ...result,
          text: result.content,
          score: result.similarity,
        }));
      }

      // If no embedding is provided but we have an embedding provider, generate one
      if (embedder && queryObj.text) {
        try {
          const [embedding] = await embedder.generateEmbeddings([
            queryObj.text,
          ]);

          const results = await supabaseStore.similaritySearch(embedding, {
            filter: {
              metadata: { contextId },
            },
            matchThreshold: queryObj.threshold || 0.5,
            maxResults: queryObj.limit || 10,
          });

          return results.map((result) => ({
            ...result,
            text: result.content,
            score: result.similarity,
          }));
        } catch (error) {
          console.error("Error generating query embedding:", error);
          return [];
        }
      }

      // If no embedding is provided and we can't generate one, return empty results
      console.warn(
        "No embedding provided for query and no embedding provider available. Returning empty results."
      );
      return [];
    },

    /**
     * Creates a new index in the vector store
     * @param indexName - Name of the index to create
     */
    async createIndex(indexName: string): Promise<void> {
      // In Supabase with pgvector, indexes are created at the database level
      // This is a no-op for now, but could be implemented to create specific indexes
      console.log(
        `Creating index ${indexName} (no-op in Supabase implementation)`
      );
    },

    /**
     * Deletes an existing index from the vector store
     * @param indexName - Name of the index to delete
     */
    async deleteIndex(indexName: string): Promise<void> {
      // In Supabase with pgvector, indexes are managed at the database level
      // This is a no-op for now, but could be implemented to drop specific indexes
      console.log(
        `Deleting index ${indexName} (no-op in Supabase implementation)`
      );
    },
  };
}

/**
 * Factory function to create a VectorStore implementation using Supabase
 *
 * @param url - Supabase URL
 * @param key - Supabase API key
 * @param tableName - Name of the table to store vectors
 * @param embeddingProvider - Optional embedding provider (defaults to OpenAI if API key is available)
 * @returns A VectorStore implementation
 */
export function createSupabaseStore(
  url: string,
  key: string,
  tableName: string = "embeddings",
  embeddingProvider?: TextEmbeddingModel
): VectorStore {
  return createSupabaseVectorStore(
    {
      url,
      key,
      tableName,
      embeddingColumnName: "embedding",
      contentColumnName: "content",
      metadataColumnName: "metadata",
    },
    embeddingProvider
  );
}
