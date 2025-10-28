import type { KeyValueMemory, KeyValueProvider, SetOptions } from "./types";

export class KeyValueMemoryImpl implements KeyValueMemory {
  constructor(private provider: KeyValueProvider) {}

  async get<T>(key: string): Promise<T | null> {
    return this.provider.get<T>(key);
  }

  async set<T>(key: string, value: T, options?: SetOptions): Promise<void> {
    return this.provider.set(key, value, options);
  }

  async delete(key: string): Promise<boolean> {
    return this.provider.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.provider.exists(key);
  }

  async keys(pattern?: string): Promise<string[]> {
    return this.provider.keys(pattern);
  }

  async count(pattern?: string): Promise<number> {
    return this.provider.count(pattern);
  }

  async *scan(pattern?: string): AsyncIterator<[string, unknown]> {
    const iterator = this.provider.scan(pattern);
    let result = await iterator.next();
    while (!result.done) {
      yield result.value;
      result = await iterator.next();
    }
  }

  async getBatch<T>(keys: string[]): Promise<Map<string, T>> {
    return this.provider.getBatch<T>(keys);
  }

  async setBatch<T>(entries: Map<string, T>, options?: SetOptions): Promise<void> {
    return this.provider.setBatch(entries, options);
  }

  async deleteBatch(keys: string[]): Promise<number> {
    return this.provider.deleteBatch(keys);
  }
}
