import { MemorySystem, type MemoryConfig } from "@daydreamsai/core";
import type { LanguageModel } from "ai";
import {
  createSupabaseKVProvider,
  createSupabaseVectorProvider,
  createSupabaseGraphProvider,
} from "./providers";

/**
 * Configuration for creating a Supabase-backed memory system
 */
export interface SupabaseMemoryConfig {
  /** Supabase URL */
  url: string;
  /** Supabase API key */
  key: string;
  /** Table name for storing key-value data */
  kvTableName?: string;
  /** Table name for storing vector embeddings */
  vectorTableName?: string;
  /** Table name for storing graph nodes */
  nodesTableName?: string;
  /** Table name for storing graph edges */
  edgesTableName?: string;
  /** Embedding dimension for vector operations */
  embeddingDimension?: number;
}

/**
 * Creates a complete memory system backed by Supabase
 *
 * This includes KV storage, vector embeddings, and graph storage all backed by Supabase.
 *
 * @param config - Configuration for the Supabase memory system
 * @returns A MemorySystem implementation using Supabase providers
 */
export function createSupabaseMemory(
  config: SupabaseMemoryConfig
): MemorySystem {
  const {
    url,
    key,
    kvTableName = "kv_store",
    vectorTableName = "vector_store",
    nodesTableName = "graph_nodes",
    edgesTableName = "graph_edges",
    embeddingDimension = 1536,
  } = config;

  // Create the providers
  const kvProvider = createSupabaseKVProvider({
    url,
    key,
    tableName: kvTableName,
  });

  const vectorProvider = createSupabaseVectorProvider({
    url,
    key,
    tableName: vectorTableName,
    embeddingDimension,
  });

  const graphProvider = createSupabaseGraphProvider({
    url,
    key,
    nodesTableName,
    edgesTableName,
  });

  // Create the memory configuration
  const memoryConfig: MemoryConfig = {
    providers: {
      kv: kvProvider,
      vector: vectorProvider,
      graph: graphProvider,
    },
  };

  // Return the complete memory system
  return new MemorySystem(memoryConfig);
}
