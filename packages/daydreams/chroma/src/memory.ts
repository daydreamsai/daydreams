import {
  MemorySystem,
  type MemoryConfig,
  InMemoryKeyValueProvider,
  InMemoryGraphProvider,
} from "@daydreamsai/core";
import { createChromaVectorProvider } from "./providers";

/**
 * Configuration for creating a ChromaDB-backed memory system
 * Note: ChromaDB only provides vector storage. KV and graph operations use in-memory providers.
 */
export interface ChromaMemoryConfig {
  /** ChromaDB connection URL/path */
  path?: string;
  /** Collection name for storing vector data */
  collectionName?: string;
  /** Custom embedding function from chromadb */
  embeddingFunction?: any;
  /** Opt-in to OpenAI embeddings when OPENAI_API_KEY is set */
  useOpenAI?: boolean;
  /** Auth configuration for ChromaDB */
  auth?: {
    provider?: string;
    credentials?: any;
  };
  /** Additional metadata for the collection */
  metadata?: Record<string, any>;
}

/**
 * Creates a memory system with ChromaDB vector storage and in-memory KV/graph storage
 *
 * This provides persistent vector storage via ChromaDB while using in-memory
 * providers for key-value and graph operations.
 *
 * @param config - Configuration for the ChromaDB memory system
 * @returns A MemorySystem implementation using ChromaDB for vector storage
 */
export function createChromaMemory(
  config: ChromaMemoryConfig = {}
): MemorySystem {
  const {
    path,
    collectionName = "daydreams_vectors",
    embeddingFunction,
    useOpenAI,
    auth,
    metadata,
  } = config;

  // Create the ChromaDB vector provider
  const vectorProvider = createChromaVectorProvider({
    path,
    collectionName,
    embeddingFunction,
    useOpenAI,
    auth,
    metadata,
  });

  // Use in-memory providers for KV and graph operations
  // These could be replaced with ChromaDB-specific implementations in the future
  const kvProvider = new InMemoryKeyValueProvider();
  const graphProvider = new InMemoryGraphProvider();

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
