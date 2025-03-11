import { createClient, SupabaseClient } from "@supabase/supabase-js";

import type {
  SupabaseVectorStoreConfig,
  SupabaseVectorRecord,
  SupabaseVectorFilter,
  SupabaseSearchResult,
  SupabaseVectorStoreOptions,
} from "./types";
import { SupabaseVectorStoreSchema } from "./schema";

/**
 * SupabaseVectorStore - A vector store implementation using Supabase with pgvector
 *
 * This class provides methods to store, retrieve, and search vector embeddings in a Supabase database
 * using the pgvector extension.
 */
export class SupabaseVectorStore {
  private client: SupabaseClient;
  private tableName: string;
  private queryName: string;
  private embeddingColumnName: string;
  private contentColumnName: string;
  private metadataColumnName: string;

  /**
   * Create a new SupabaseVectorStore instance
   *
   * @param options - Configuration options for the vector store
   */
  constructor(options: SupabaseVectorStoreOptions) {
    this.client = options.client;
    this.tableName = options.tableName;
    this.queryName = options.queryName || `match_${this.tableName}`;
    this.embeddingColumnName = options.embeddingColumnName || "embedding";
    this.contentColumnName = options.contentColumnName || "content";
    this.metadataColumnName = options.metadataColumnName || "metadata";
  }

  /**
   * Create a new SupabaseVectorStore from configuration
   *
   * @param config - Configuration for the Supabase vector store
   * @returns A new SupabaseVectorStore instance
   */
  static fromConfig(config: SupabaseVectorStoreConfig): SupabaseVectorStore {
    const validatedConfig = SupabaseVectorStoreSchema.parse(config);

    const client = createClient(validatedConfig.url, validatedConfig.key);

    return new SupabaseVectorStore({
      client,
      tableName: validatedConfig.tableName,
      queryName: validatedConfig.queryName,
      embeddingColumnName: validatedConfig.embeddingColumnName,
      contentColumnName: validatedConfig.contentColumnName,
      metadataColumnName: validatedConfig.metadataColumnName,
    });
  }

  /**
   * Initialize the database schema for vector storage
   *
   * This method creates the necessary tables and functions for vector storage and similarity search
   *
   * @param dimensions - The dimensions of the vectors to be stored (default: 1536)
   * @returns A promise that resolves when the initialization is complete
   */
  async initialize(dimensions: number = 1536): Promise<void> {
    // Enable the pgvector extension
    await this.client.rpc("enable_pgvector_extension");

    // Create the table if it doesn't exist
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id TEXT PRIMARY KEY,
        ${this.contentColumnName} TEXT,
        ${this.embeddingColumnName} VECTOR(${dimensions}),
        ${this.metadataColumnName} JSONB
      );
    `;
    await this.client.rpc("execute_sql", { query: createTableQuery });

    // Create the similarity search function
    const createFunctionQuery = `
      CREATE OR REPLACE FUNCTION ${this.queryName}(
        query_embedding VECTOR(${dimensions}),
        match_threshold FLOAT,
        match_count INT,
        filter_metadata JSONB DEFAULT NULL,
        filter_ids TEXT[] DEFAULT NULL
      ) 
      RETURNS TABLE (
        id TEXT,
        ${this.contentColumnName} TEXT,
        ${this.metadataColumnName} JSONB,
        similarity FLOAT
      )
      LANGUAGE plpgsql
      AS $$
      BEGIN
        RETURN QUERY
        SELECT
          t.id,
          t.${this.contentColumnName},
          t.${this.metadataColumnName},
          1 - (t.${this.embeddingColumnName} <=> query_embedding) as similarity
        FROM ${this.tableName} t
        WHERE
          (filter_metadata IS NULL OR t.${this.metadataColumnName} @> filter_metadata) AND
          (filter_ids IS NULL OR t.id = ANY(filter_ids)) AND
          1 - (t.${this.embeddingColumnName} <=> query_embedding) > match_threshold
        ORDER BY similarity DESC
        LIMIT match_count;
      END;
      $$;
    `;
    await this.client.rpc("execute_sql", { query: createFunctionQuery });
  }

  /**
   * Add vector records to the store
   *
   * @param records - The vector records to add
   * @returns A promise that resolves when the records are added
   */
  async addVectors(records: SupabaseVectorRecord[]): Promise<void> {
    if (records.length === 0) return;

    const rows = records.map((record) => ({
      id: record.id,
      [this.contentColumnName]: record.content,
      [this.embeddingColumnName]: record.embedding,
      [this.metadataColumnName]: record.metadata || {},
    }));

    const { error } = await this.client.from(this.tableName).upsert(rows);

    if (error) {
      throw new Error(`Failed to add vectors: ${error.message}`);
    }
  }

  /**
   * Delete vector records from the store
   *
   * @param ids - The IDs of the records to delete
   * @returns A promise that resolves when the records are deleted
   */
  async deleteVectors(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    const { error } = await this.client
      .from(this.tableName)
      .delete()
      .in("id", ids);

    if (error) {
      throw new Error(`Failed to delete vectors: ${error.message}`);
    }
  }

  /**
   * Search for similar vectors
   *
   * @param embedding - The query embedding vector
   * @param options - Search options
   * @returns A promise that resolves to the search results
   */
  async similaritySearch(
    embedding: number[],
    {
      filter = {},
      matchThreshold = 0.5,
      maxResults = 10,
    }: {
      filter?: SupabaseVectorFilter;
      matchThreshold?: number;
      maxResults?: number;
    } = {}
  ): Promise<SupabaseSearchResult[]> {
    const { data, error } = await this.client.rpc(this.queryName, {
      query_embedding: embedding,
      match_threshold: matchThreshold,
      match_count: maxResults,
      filter_metadata: filter.metadata || null,
      filter_ids: filter.ids || null,
    });

    if (error) {
      throw new Error(`Failed to search vectors: ${error.message}`);
    }

    return data.map((item: Record<string, any>) => ({
      id: item.id,
      content: item[this.contentColumnName],
      metadata: item[this.metadataColumnName],
      similarity: item.similarity,
    }));
  }

  /**
   * Get vector records by IDs
   *
   * @param ids - The IDs of the records to retrieve
   * @returns A promise that resolves to the retrieved records
   */
  async getVectorsByIds(ids: string[]): Promise<SupabaseVectorRecord[]> {
    if (ids.length === 0) return [];

    const { data, error } = await this.client
      .from(this.tableName)
      .select(
        `id, ${this.contentColumnName}, ${this.embeddingColumnName}, ${this.metadataColumnName}`
      )
      .in("id", ids);

    if (error) {
      throw new Error(`Failed to get vectors: ${error.message}`);
    }

    return data.map((item: Record<string, any>) => ({
      id: item.id,
      content: item[this.contentColumnName],
      embedding: item[this.embeddingColumnName],
      metadata: item[this.metadataColumnName],
    }));
  }
}
