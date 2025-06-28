import {
  MemorySystem,
  type MemoryConfig,
  InMemoryVectorProvider,
  InMemoryGraphProvider,
} from "@daydreamsai/core";
import { createFirebaseKVProvider } from "./providers";

/**
 * Configuration for creating a Firebase-backed memory system
 * Note: Firebase only provides KV storage. Vector and graph operations use in-memory providers.
 */
export interface FirebaseMemoryConfig {
  /**
   * Firebase project configuration
   * Either provide a service account JSON or use environment variables with firebase-admin
   */
  serviceAccount?: {
    projectId: string;
    clientEmail: string;
    privateKey: string;
  };
  /**
   * Custom name for the Firestore collection
   * @default "kv_store"
   */
  collectionName?: string;
  /**
   * Max retries for Firestore operations
   * @default 3
   */
  maxRetries?: number;
  /**
   * Base delay between retries (ms)
   * @default 1000
   */
  retryDelay?: number;
  /** Optional configuration for memory system behavior */
  options?: MemoryConfig["options"];
}

/**
 * Creates a memory system with Firebase KV storage and in-memory vector/graph storage
 *
 * This provides persistent key-value storage via Firebase Firestore while using in-memory
 * providers for vector and graph operations.
 *
 * @param config - Configuration for the Firebase memory system
 * @returns A MemorySystem implementation using Firebase for KV storage
 */
export function createFirebaseMemory(config: FirebaseMemoryConfig): MemorySystem {
  const {
    serviceAccount,
    collectionName = "kv_store",
    maxRetries = 3,
    retryDelay = 1000,
    options,
  } = config;

  // Create the Firebase KV provider
  const kvProvider = createFirebaseKVProvider({
    serviceAccount,
    collectionName,
    maxRetries,
    retryDelay,
  });

  // Use in-memory providers for vector and graph operations
  // These could be replaced with Firebase-specific implementations in the future
  const vectorProvider = new InMemoryVectorProvider();
  const graphProvider = new InMemoryGraphProvider();

  // Create the memory configuration
  const memoryConfig: MemoryConfig = {
    providers: {
      kv: kvProvider,
      vector: vectorProvider,
      graph: graphProvider,
    },
    options,
  };

  // Return the complete memory system
  return new MemorySystem(memoryConfig);
}

/**
 * Legacy compatibility function - creates a Firebase memory system
 * @deprecated Use createFirebaseMemory instead
 */
export function createFirebaseMemoryStore(config: {
  serviceAccount?: {
    projectId: string;
    clientEmail: string;
    privateKey: string;
  };
  collectionName?: string;
}): MemorySystem {
  return createFirebaseMemory(config);
}