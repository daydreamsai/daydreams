import type { VectorMemory, VectorProvider, VectorDocument, VectorQuery, VectorResult } from "./types";

export class VectorMemoryImpl implements VectorMemory {
  constructor(private provider: VectorProvider) {}

  async index(documents: VectorDocument[]): Promise<void> {
    return this.provider.index(documents);
  }

  async search(query: VectorQuery): Promise<VectorResult[]> {
    return this.provider.search(query);
  }

  async delete(ids: string[]): Promise<void> {
    return this.provider.delete(ids);
  }
}