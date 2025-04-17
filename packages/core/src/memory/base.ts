import type { MemoryStore, VectorStore, WorkingMemory } from "../types";
import type { LanguageModelV1 } from "ai";
/**
 * Base memory implementation providing storage and vector capabilities
 */
export type BaseMemory = {
  /** Store for conversation memory data */
  store: MemoryStore;
  /** Store for vector embeddings and similarity search */
  vector: VectorStore;
  vectorModel?: LanguageModelV1;
  generateMemories?: boolean;
};

/**
 * Creates a new BaseMemory instance
 * @param store - Memory store implementation for conversation data
 * @param vector - Vector store implementation for embeddings
 * @param vectorModel - Vector model implementation for embeddings
 * @returns A new BaseMemory instance
 */
export function createMemory(
  store: MemoryStore,
  vector: VectorStore,
  vectorModel?: LanguageModelV1
): BaseMemory {
  return { store, vector, vectorModel };
}

/**
 * Creates a new in-memory store for conversation data
 * @returns A MemoryStore implementation using a Map for storage
 */
export function createMemoryStore(): MemoryStore {
  const data = new Map<string, any>();
  return {
    async keys(base) {
      const keys = Array.from(data.keys());

      if (base) {
        return keys.filter((key) => key.startsWith(base));
      }

      return keys;
    },

    /**
     * Retrieves a value from the store
     * @param key - Key to look up
     * @returns The stored value or null if not found
     */
    async get(key: string) {
      return data.get(key) ?? null;
    },

    /**
     * Removes all entries from the store
     */
    async clear() {
      data.clear();
    },

    /**
     * Removes a specific entry from the store
     * @param key - Key to remove
     */
    async delete(key: string) {
      data.delete(key);
    },

    /**
     * Stores a value in the store
     * @param key - Key to store under
     * @param value - Value to store
     */
    async set(key: string, value: any) {
      data.set(key, value);
    },
  };
}

/**
 * Creates a no-op vector store implementation
 * @returns A VectorStore implementation that performs no operations
 */
export function createVectorStore(): VectorStore {
  return {
    /**
     * No-op implementation of vector store upsert
     * @param contextId - Context ID (unused)
     * @param data - Data to store (unused)
     */
    upsert(contextId: string, data: any[]) {
      return Promise.resolve();
    },

    /**
     * No-op implementation of vector store query
     * @param contextId - Context ID (unused)
     * @param query - Query string (unused)
     * @returns Empty array
     */
    query(contextId: string, query: string) {
      return Promise.resolve([]);
    },

    /**
     * No-op implementation of index creation
     * @param indexName - Name of index to create (unused)
     */
    createIndex(indexName: string) {
      return Promise.resolve();
    },

    /**
     * No-op implementation of index deletion
     * @param indexName - Name of index to delete (unused)
     */
    deleteIndex(indexName: string) {
      return Promise.resolve();
    },
  };
}
