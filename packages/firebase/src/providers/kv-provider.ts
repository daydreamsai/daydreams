import { initializeApp, cert, getApps, type App } from "firebase-admin/app";
import { getFirestore, Firestore, Timestamp } from "firebase-admin/firestore";
import type {
  KeyValueProvider,
  SetOptions,
  HealthStatus,
} from "@daydreamsai/core";

/**
 * Configuration for the Firebase KeyValue provider
 */
export interface FirebaseKVProviderConfig {
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
}

interface KVDocument {
  value: any;
  expiresAt?: Timestamp;
  tags?: Record<string, string>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Firebase implementation of KeyValueProvider using Firestore
 */
export class FirebaseKVProvider implements KeyValueProvider {
  private app: App;
  private db: Firestore;
  private readonly collectionName: string;
  private readonly maxRetries: number;
  private readonly retryDelay: number;

  constructor(config: FirebaseKVProviderConfig) {
    this.collectionName = config.collectionName || "kv_store";
    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 1000;

    // Check if Firebase app is already initialized
    const apps = getApps();
    if (apps.length === 0) {
      // Initialize Firebase app if not already initialized
      if (config.serviceAccount) {
        this.app = initializeApp({
          credential: cert({
            projectId: config.serviceAccount.projectId,
            clientEmail: config.serviceAccount.clientEmail,
            privateKey: config.serviceAccount.privateKey,
          }),
        });
      } else {
        // Use environment variables for initialization
        this.app = initializeApp();
      }
    } else {
      this.app = apps[0];
    }

    // Initialize Firestore
    this.db = getFirestore(this.app);
  }

  /**
   * Helper method to implement retry logic for Firestore operations
   */
  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;

        // Check if this is a retryable error
        const isRetryable =
          error?.code === 13 ||
          error?.message?.includes("RST_STREAM") ||
          error?.message?.includes("INTERNAL") ||
          error?.message?.includes("UNAVAILABLE");

        if (!isRetryable) {
          throw error;
        }

        // Exponential backoff with jitter
        const delay =
          this.retryDelay * Math.pow(2, attempt) * (0.5 + Math.random() * 0.5);

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw (
      lastError || new Error("Operation failed after maximum retry attempts")
    );
  }

  /**
   * Helper method to process values before storing in Firestore
   * Replaces undefined with null to avoid Firestore errors
   */
  private processValue(value: any): any {
    if (value === undefined) return null;

    if (Array.isArray(value)) {
      return value.map((item) => this.processValue(item));
    }

    if (value !== null && typeof value === "object") {
      return Object.entries(value).reduce((acc, [k, v]) => {
        acc[k] = this.processValue(v);
        return acc;
      }, {} as Record<string, any>);
    }

    return value;
  }

  async initialize(): Promise<void> {
    // Test Firestore connection
    try {
      await this.withRetry(() =>
        this.db.collection(this.collectionName).limit(1).get()
      );
    } catch (error) {
      throw new Error(`Firestore connection failed: ${error}`);
    }
  }

  async close(): Promise<void> {
    // Firebase Admin SDK doesn't need explicit cleanup
    // The app will be automatically cleaned up when the process exits
  }

  async health(): Promise<HealthStatus> {
    try {
      // Test connectivity with a simple operation
      await this.withRetry(() =>
        this.db.collection(this.collectionName).limit(1).get()
      );

      return {
        status: "healthy",
        message: "Firebase KeyValue provider is operational",
      };
    } catch (error) {
      return {
        status: "unhealthy",
        message: `Firestore connection failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  }

  async get<T>(key: string): Promise<T | null> {
    return this.withRetry(async () => {
      const docRef = this.db.collection(this.collectionName).doc(key);
      const doc = await docRef.get();

      if (!doc.exists) return null;

      const data = doc.data() as KVDocument;

      // Check if document has expired
      if (data.expiresAt && data.expiresAt.toDate() < new Date()) {
        await this.delete(key);
        return null;
      }

      return data.value as T;
    });
  }

  async set<T>(key: string, value: T, options?: SetOptions): Promise<void> {
    return this.withRetry(async () => {
      if (options?.ifNotExists) {
        // Check if key already exists
        const existing = await this.get(key);
        if (existing !== null) {
          return; // Key exists, don't overwrite
        }
      }

      const docRef = this.db.collection(this.collectionName).doc(key);
      const now = new Date();

      let expiresAt: Timestamp | undefined;
      if (options?.ttl) {
        expiresAt = Timestamp.fromDate(
          new Date(Date.now() + options.ttl * 1000)
        );
      }

      const processedValue = this.processValue(value);
      const document: Partial<KVDocument> = {
        value: processedValue,
        expiresAt,
        tags: options?.tags,
        updatedAt: Timestamp.fromDate(now),
      };

      // Use set with merge to avoid overwriting createdAt if it exists
      const existingDoc = await docRef.get();
      if (!existingDoc.exists) {
        document.createdAt = Timestamp.fromDate(now);
      }

      await docRef.set(document, { merge: true });
    });
  }

  async delete(key: string): Promise<boolean> {
    return this.withRetry(async () => {
      const docRef = this.db.collection(this.collectionName).doc(key);
      const doc = await docRef.get();

      if (!doc.exists) return false;

      await docRef.delete();
      return true;
    });
  }

  async exists(key: string): Promise<boolean> {
    return this.withRetry(async () => {
      const docRef = this.db.collection(this.collectionName).doc(key);
      const doc = await docRef.get();
      return doc.exists;
    });
  }

  async keys(pattern?: string): Promise<string[]> {
    return this.withRetry(async () => {
      const snapshot = await this.db.collection(this.collectionName).get();
      let keys = snapshot.docs.map((doc) => doc.id);

      if (pattern) {
        // Convert glob pattern to regex
        const regex = new RegExp(pattern.replace(/\*/g, ".*"));
        keys = keys.filter((key) => regex.test(key));
      }

      return keys;
    });
  }

  async count(pattern?: string): Promise<number> {
    if (pattern) {
      // For pattern matching, we need to get all keys first
      const keys = await this.keys(pattern);
      return keys.length;
    }

    return this.withRetry(async () => {
      const snapshot = await this.db
        .collection(this.collectionName)
        .count()
        .get();
      return snapshot.data().count;
    });
  }

  async *scan(pattern?: string): AsyncIterator<[string, any]> {
    const batchSize = 100;
    let lastDoc: any = null;

    while (true) {
      const docs = await this.withRetry(async () => {
        let query = this.db.collection(this.collectionName).limit(batchSize);

        if (lastDoc) {
          query = query.startAfter(lastDoc);
        }

        const snapshot = await query.get();
        return snapshot.docs;
      });

      if (docs.length === 0) break;

      for (const doc of docs) {
        const key = doc.id;

        // Apply pattern filtering if specified
        if (pattern) {
          const regex = new RegExp(pattern.replace(/\*/g, ".*"));
          if (!regex.test(key)) continue;
        }

        const data = doc.data() as KVDocument;

        // Check expiration
        if (!data.expiresAt || data.expiresAt.toDate() >= new Date()) {
          yield [key, data.value];
        }
      }

      if (docs.length < batchSize) break;
      lastDoc = docs[docs.length - 1];
    }
  }

  async getBatch<T>(keys: string[]): Promise<Map<string, T>> {
    return this.withRetry(async () => {
      const docRefs = keys.map((key) =>
        this.db.collection(this.collectionName).doc(key)
      );

      const docs = await this.db.getAll(...docRefs);
      const result = new Map<string, T>();

      for (let i = 0; i < docs.length; i++) {
        const doc = docs[i];
        const key = keys[i];

        if (doc.exists) {
          const data = doc.data() as KVDocument;

          // Check expiration
          if (!data.expiresAt || data.expiresAt.toDate() >= new Date()) {
            result.set(key, data.value as T);
          }
        }
      }

      return result;
    });
  }

  async setBatch<T>(
    entries: Map<string, T>,
    options?: SetOptions
  ): Promise<void> {
    return this.withRetry(async () => {
      const batch = this.db.batch();
      const now = new Date();

      let expiresAt: Timestamp | undefined;
      if (options?.ttl) {
        expiresAt = Timestamp.fromDate(
          new Date(Date.now() + options.ttl * 1000)
        );
      }

      for (const [key, value] of entries) {
        const docRef = this.db.collection(this.collectionName).doc(key);
        const processedValue = this.processValue(value);

        const document: KVDocument = {
          value: processedValue,
          expiresAt,
          tags: options?.tags,
          createdAt: Timestamp.fromDate(now),
          updatedAt: Timestamp.fromDate(now),
        };

        batch.set(docRef, document, { merge: true });
      }

      await batch.commit();
    });
  }

  async deleteBatch(keys: string[]): Promise<number> {
    return this.withRetry(async () => {
      const batch = this.db.batch();
      let deleteCount = 0;

      // Check which documents exist before deleting
      const docRefs = keys.map((key) =>
        this.db.collection(this.collectionName).doc(key)
      );
      const docs = await this.db.getAll(...docRefs);

      for (let i = 0; i < docs.length; i++) {
        if (docs[i].exists) {
          batch.delete(docRefs[i]);
          deleteCount++;
        }
      }

      if (deleteCount > 0) {
        await batch.commit();
      }

      return deleteCount;
    });
  }
}

/**
 * Factory function to create a Firebase KeyValue provider
 */
export function createFirebaseKVProvider(
  config: FirebaseKVProviderConfig
): FirebaseKVProvider {
  return new FirebaseKVProvider(config);
}
