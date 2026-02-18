import { Collection, MongoClient } from "mongodb";
import type {
  KeyValueProvider,
  SetOptions,
  HealthStatus,
} from "@daydreamsai/core";
import crypto from "crypto";

export function _hashKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

/**
 * Configuration for the MongoDB KeyValue provider
 */
export interface MongoKVProviderConfig {
  /** MongoDB connection URI */
  uri: string;
  /** Database name */
  dbName?: string;
  /** Collection name for storing key-value data */
  collectionName?: string;
}

interface KVDocument {
  _id: string;
  value: any;
  expiresAt?: Date;
  tags?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * MongoDB implementation of KeyValueProvider
 */
export class MongoKVProvider implements KeyValueProvider {
  private client: MongoClient;
  private collection: Collection<KVDocument> | null = null;
  private readonly dbName: string;
  private readonly collectionName: string;

  constructor(config: MongoKVProviderConfig) {
    const { uri, dbName = "daydreams_memory", collectionName = "kv_store" } = config;
    this.client = new MongoClient(uri);
    this.dbName = dbName;
    this.collectionName = collectionName;
  }

  async initialize(): Promise<void> {
    await this.client.connect();
    const db = this.client.db(this.dbName);
    this.collection = db.collection<KVDocument>(this.collectionName);

    // Create TTL index for automatic expiration
    await this.collection.createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0, sparse: true }
    );

    // Create index for tags
    await this.collection.createIndex(
      { tags: 1 },
      { sparse: true }
    );
  }

  async close(): Promise<void> {
    await this.client.close();
  }

  async health(): Promise<HealthStatus> {
    try {
      // Test connectivity with a simple operation
      await this.client.db("admin").command({ ping: 1 });

      return {
        status: "healthy",
        message: "MongoDB KeyValue provider is operational",
      };
    } catch (error) {
      return {
        status: "unhealthy",
        message: `MongoDB connection failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.collection) throw new Error("MongoDB not initialized");

    const hashedKey = _hashKey(key);
    const doc = await this.collection.findOne({ _id: hashedKey });

    if (!doc) return null;

    // Check if document has expired (extra safety check)
    if (doc.expiresAt && doc.expiresAt < new Date()) {
      await this.delete(key);
      return null;
    }

    return doc.value as T;
  }

  async set<T>(key: string, value: T, options?: SetOptions): Promise<void> {
    if (!this.collection) throw new Error("MongoDB not initialized");

    const hashedKey = _hashKey(key);
    const now = new Date();

    let expiresAt: Date | undefined;
    if (options?.ttl) {
      expiresAt = new Date(Date.now() + options.ttl * 1000);
    }

    if (options?.ifNotExists) {
      // Check if key already exists
      const existing = await this.get(key);
      if (existing !== null) {
        return; // Key exists, don't overwrite
      }
    }

    const document: Partial<KVDocument> = {
      value,
      expiresAt,
      tags: options?.tags,
      updatedAt: now,
    };

    await this.collection.updateOne(
      { _id: hashedKey },
      {
        $set: document,
        $setOnInsert: { createdAt: now },
      },
      { upsert: true }
    );
  }

  async delete(key: string): Promise<boolean> {
    if (!this.collection) throw new Error("MongoDB not initialized");

    const hashedKey = _hashKey(key);
    const result = await this.collection.deleteOne({ _id: hashedKey });
    return result.deletedCount > 0;
  }

  async exists(key: string): Promise<boolean> {
    if (!this.collection) throw new Error("MongoDB not initialized");

    const hashedKey = _hashKey(key);
    const count = await this.collection.countDocuments({ _id: hashedKey });
    return count > 0;
  }

  async keys(pattern?: string): Promise<string[]> {
    if (!this.collection) throw new Error("MongoDB not initialized");

    // MongoDB doesn't store original keys, so we can't return them
    // This is a limitation of the hashed key approach
    // We could store original keys in a separate field if needed
    const docs = await this.collection.find({}).project({ _id: 1 }).toArray();
    
    // Return hashed keys (not ideal, but maintains consistency with the interface)
    let keys = docs.map(doc => doc._id);

    if (pattern) {
      // Basic pattern matching for hashed keys - limited utility
      const regex = new RegExp(pattern.replace(/\*/g, ".*"));
      keys = keys.filter(key => regex.test(key));
    }

    return keys;
  }

  async count(pattern?: string): Promise<number> {
    if (!this.collection) throw new Error("MongoDB not initialized");

    if (pattern) {
      // For pattern matching, we need to get all keys first
      const keys = await this.keys(pattern);
      return keys.length;
    }

    return await this.collection.countDocuments({});
  }

  async *scan(pattern?: string): AsyncIterator<[string, any]> {
    if (!this.collection) throw new Error("MongoDB not initialized");

    const batchSize = 100;
    let skip = 0;

    while (true) {
      const docs = await this.collection
        .find({})
        .skip(skip)
        .limit(batchSize)
        .toArray();

      if (docs.length === 0) break;

      for (const doc of docs) {
        // Apply pattern filtering if specified
        if (pattern) {
          const regex = new RegExp(pattern.replace(/\*/g, ".*"));
          if (!regex.test(doc._id)) continue;
        }

        yield [doc._id, doc.value];
      }

      if (docs.length < batchSize) break;
      skip += batchSize;
    }
  }

  async getBatch<T>(keys: string[]): Promise<Map<string, T>> {
    if (!this.collection) throw new Error("MongoDB not initialized");

    const hashedKeys = keys.map(_hashKey);
    const docs = await this.collection
      .find({ _id: { $in: hashedKeys } })
      .toArray();

    const result = new Map<string, T>();
    const keyMap = new Map(keys.map(k => [_hashKey(k), k]));

    for (const doc of docs) {
      const originalKey = keyMap.get(doc._id);
      if (originalKey) {
        // Check expiration
        if (!doc.expiresAt || doc.expiresAt >= new Date()) {
          result.set(originalKey, doc.value as T);
        }
      }
    }

    return result;
  }

  async setBatch<T>(entries: Map<string, T>, options?: SetOptions): Promise<void> {
    if (!this.collection) throw new Error("MongoDB not initialized");

    const now = new Date();
    let expiresAt: Date | undefined;
    if (options?.ttl) {
      expiresAt = new Date(Date.now() + options.ttl * 1000);
    }

    const operations = Array.from(entries.entries()).map(([key, value]) => ({
      updateOne: {
        filter: { _id: _hashKey(key) },
        update: {
          $set: {
            value,
            expiresAt,
            tags: options?.tags,
            updatedAt: now,
          },
          $setOnInsert: { createdAt: now },
        },
        upsert: true,
      },
    }));

    if (operations.length > 0) {
      await this.collection.bulkWrite(operations);
    }
  }

  async deleteBatch(keys: string[]): Promise<number> {
    if (!this.collection) throw new Error("MongoDB not initialized");

    const hashedKeys = keys.map(_hashKey);
    const result = await this.collection.deleteMany({
      _id: { $in: hashedKeys },
    });

    return result.deletedCount;
  }
}

/**
 * Factory function to create a MongoDB KeyValue provider
 */
export function createMongoKVProvider(config: MongoKVProviderConfig): MongoKVProvider {
  return new MongoKVProvider(config);
}