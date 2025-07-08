import type { KVStore } from "@/types/memory";

export function createKVStore(): KVStore {
  const data = new Map<string, any>();

  function getKey(key: string | string[]): string {
    return Array.isArray(key) ? key.join(":") : key;
  }

  return {
    async keys(base) {
      const keys = Array.from(data.keys());

      if (base) {
        return keys.filter((key) => key.startsWith(base));
      }

      return keys;
    },

    async get(key) {
      return data.get(getKey(key)) ?? null;
    },

    async clear() {
      data.clear();
    },

    async delete(key) {
      data.delete(getKey(key));
    },

    async set(key, value) {
      data.set(getKey(key), value);
    },
  };
}
