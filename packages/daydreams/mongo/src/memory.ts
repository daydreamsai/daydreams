import {
  MemorySystem,
  type MemoryConfig,
  InMemoryVectorProvider,
  InMemoryGraphProvider,
} from "@daydreamsai/core";
import { createMongoKVProvider } from "./providers";

/**
 * Configuration for creating a MongoDB-backed memory system
 * Note: MongoDB only provides KV storage. Vector and graph operations use in-memory providers.
 */
export interface MongoMemoryConfig {
  /** MongoDB connection URI */
  uri: string;
  /** Database name */
  dbName?: string;
  /** Collection name for storing key-value data */
  collectionName?: string;
}

/**
 * Creates a memory system with MongoDB KV storage and in-memory vector/graph storage
 *
 * This provides persistent key-value storage via MongoDB while using in-memory
 * providers for vector and graph operations.
 *
 * @param config - Configuration for the MongoDB memory system
 * @returns A MemorySystem implementation using MongoDB for KV storage
 */
export function createMongoMemory(config: MongoMemoryConfig): MemorySystem {
  const {
    uri,
    dbName = "daydreams_memory",
    collectionName = "kv_store",
  } = config;

  // Create the MongoDB KV provider
  const kvProvider = createMongoKVProvider({
    uri,
    dbName,
    collectionName,
  });

  // Use in-memory providers for vector and graph operations
  // These could be replaced with MongoDB-specific implementations in the future
  const vectorProvider = new InMemoryVectorProvider();
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

/**
 * Legacy compatibility function - creates a MongoDB memory system
 * @deprecated Use createMongoMemory instead
 */
export function createMongoMemoryStore(config: {
  uri: string;
  dbName?: string;
  collectionName?: string;
}): MemorySystem {
  return createMongoMemory(config);
}
