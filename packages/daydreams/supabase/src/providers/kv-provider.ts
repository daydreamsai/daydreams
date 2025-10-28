import { createClient, SupabaseClient } from "@supabase/supabase-js";
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
 * Configuration for the Supabase KeyValue provider
 */
export interface SupabaseKVProviderConfig {
  /** Supabase URL */
  url: string;
  /** Supabase API key */
  key: string;
  /** Table name for storing key-value data */
  tableName?: string;
}

/**
 * Supabase implementation of KeyValueProvider
 */
export class SupabaseKVProvider implements KeyValueProvider {
  private client: SupabaseClient;
  private tableName: string;

  constructor(config: SupabaseKVProviderConfig) {
    const { url, key, tableName = "kv_store" } = config;
    this.client = createClient(url, key);
    this.tableName = tableName;
  }

  async initialize(): Promise<void> {
    await this.initializeTable();
  }

  async close(): Promise<void> {
    // Supabase client doesn't need explicit cleanup
  }

  async health(): Promise<HealthStatus> {
    try {
      // Test connectivity with a simple query
      const { error } = await this.client
        .from(this.tableName)
        .select("key")
        .limit(1);

      if (error) {
        return {
          status: "unhealthy",
          message: `Database error: ${error.message}`,
          details: { error: error.code },
        };
      }

      return {
        status: "healthy",
        message: "Supabase KeyValue provider is operational",
      };
    } catch (error) {
      return {
        status: "unhealthy",
        message: `Connection failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const hashedKey = _hashKey(key);
    const { data, error } = await this.client
      .from(this.tableName)
      .select("value, expires_at")
      .eq("key", hashedKey)
      .single();

    if (error || !data) {
      return null;
    }

    // Check if the value has expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      await this.delete(key);
      return null;
    }

    try {
      return JSON.parse(data.value) as T;
    } catch (e) {
      console.error(`Error parsing data for key ${key}:`, e);
      return null;
    }
  }

  async set<T>(key: string, value: T, options?: SetOptions): Promise<void> {
    const hashedKey = _hashKey(key);
    const serializedValue = JSON.stringify(value);

    let expiresAt: string | null = null;
    if (options?.ttl) {
      expiresAt = new Date(Date.now() + options.ttl * 1000).toISOString();
    }

    if (options?.ifNotExists) {
      // Check if key already exists
      const existing = await this.get(key);
      if (existing !== null) {
        return; // Key exists, don't overwrite
      }
    }

    const record = {
      key: hashedKey,
      value: serializedValue,
      expires_at: expiresAt,
      tags: options?.tags ? JSON.stringify(options.tags) : null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await this.client
      .from(this.tableName)
      .upsert(record)
      .select();

    if (error) {
      throw new Error(`Failed to set value for key ${key}: ${error.message}`);
    }
  }

  async delete(key: string): Promise<boolean> {
    const hashedKey = _hashKey(key);
    const { error, count } = await this.client
      .from(this.tableName)
      .delete({ count: "exact" })
      .eq("key", hashedKey);

    if (error) {
      throw new Error(`Failed to delete key ${key}: ${error.message}`);
    }

    return (count ?? 0) > 0;
  }

  async exists(key: string): Promise<boolean> {
    const hashedKey = _hashKey(key);
    const { data, error } = await this.client
      .from(this.tableName)
      .select("key")
      .eq("key", hashedKey)
      .single();

    return !error && !!data;
  }

  async keys(pattern?: string): Promise<string[]> {
    let query = this.client.from(this.tableName).select("key");

    if (pattern) {
      // Basic pattern matching - could be enhanced
      query = query.ilike("key", pattern.replace("*", "%"));
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to retrieve keys: ${error.message}`);
    }

    return data ? data.map((row: { key: string }) => row.key) : [];
  }

  async count(pattern?: string): Promise<number> {
    let query = this.client.from(this.tableName).select("*", { count: "exact", head: true });

    if (pattern) {
      query = query.ilike("key", pattern.replace("*", "%"));
    }

    const { error, count } = await query;

    if (error) {
      throw new Error(`Failed to count keys: ${error.message}`);
    }

    return count ?? 0;
  }

  async *scan(pattern?: string): AsyncIterator<[string, any]> {
    const pageSize = 100;
    let offset = 0;

    while (true) {
      let query = this.client
        .from(this.tableName)
        .select("key, value")
        .range(offset, offset + pageSize - 1);

      if (pattern) {
        query = query.ilike("key", pattern.replace("*", "%"));
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to scan keys: ${error.message}`);
      }

      if (!data || data.length === 0) {
        break;
      }

      for (const row of data) {
        try {
          const value = JSON.parse(row.value);
          yield [row.key, value];
        } catch (e) {
          console.error(`Error parsing value for key ${row.key}:`, e);
        }
      }

      if (data.length < pageSize) {
        break;
      }

      offset += pageSize;
    }
  }

  async getBatch<T>(keys: string[]): Promise<Map<string, T>> {
    const hashedKeys = keys.map(_hashKey);
    const { data, error } = await this.client
      .from(this.tableName)
      .select("key, value")
      .in("key", hashedKeys);

    if (error) {
      throw new Error(`Failed to get batch: ${error.message}`);
    }

    const result = new Map<string, T>();
    const keyMap = new Map(keys.map(k => [_hashKey(k), k]));

    if (data) {
      for (const row of data) {
        const originalKey = keyMap.get(row.key);
        if (originalKey) {
          try {
            result.set(originalKey, JSON.parse(row.value) as T);
          } catch (e) {
            console.error(`Error parsing value for key ${originalKey}:`, e);
          }
        }
      }
    }

    return result;
  }

  async setBatch<T>(entries: Map<string, T>, options?: SetOptions): Promise<void> {
    const records = Array.from(entries.entries()).map(([key, value]) => {
      const hashedKey = _hashKey(key);
      const serializedValue = JSON.stringify(value);
      
      let expiresAt: string | null = null;
      if (options?.ttl) {
        expiresAt = new Date(Date.now() + options.ttl * 1000).toISOString();
      }

      return {
        key: hashedKey,
        value: serializedValue,
        expires_at: expiresAt,
        tags: options?.tags ? JSON.stringify(options.tags) : null,
        updated_at: new Date().toISOString(),
      };
    });

    const { error } = await this.client
      .from(this.tableName)
      .upsert(records)
      .select();

    if (error) {
      throw new Error(`Failed to set batch: ${error.message}`);
    }
  }

  async deleteBatch(keys: string[]): Promise<number> {
    const hashedKeys = keys.map(_hashKey);
    const { error, count } = await this.client
      .from(this.tableName)
      .delete({ count: "exact" })
      .in("key", hashedKeys);

    if (error) {
      throw new Error(`Failed to delete batch: ${error.message}`);
    }

    return count ?? 0;
  }

  private async initializeTable(): Promise<void> {
    // Check if the table exists by querying it
    const { error } = await this.client
      .from(this.tableName)
      .select("key")
      .limit(1);

    // If the table doesn't exist, create it
    if (error && error.code === "42P01") {
      // PostgreSQL code for undefined_table
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          expires_at TIMESTAMP WITH TIME ZONE,
          tags JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS ${this.tableName}_expires_at_idx 
        ON ${this.tableName} (expires_at) WHERE expires_at IS NOT NULL;

        CREATE INDEX IF NOT EXISTS ${this.tableName}_tags_idx 
        ON ${this.tableName} USING GIN (tags) WHERE tags IS NOT NULL;
      `;

      try {
        await this.client.rpc("execute_sql", {
          query: createTableQuery,
        });
        console.log(`Created KV table: ${this.tableName}`);
      } catch (e) {
        console.error(`Failed to create KV table ${this.tableName}:`, e);
        throw e;
      }
    } else if (error) {
      console.error(`Error checking KV table ${this.tableName}:`, error);
    }
  }
}

/**
 * Factory function to create a Supabase KeyValue provider
 */
export function createSupabaseKVProvider(config: SupabaseKVProviderConfig): SupabaseKVProvider {
  return new SupabaseKVProvider(config);
}