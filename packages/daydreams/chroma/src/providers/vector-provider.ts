import {
  ChromaClient,
  Collection,
  OpenAIEmbeddingFunction,
  IncludeEnum,
  type IEmbeddingFunction,
} from "chromadb";
import { DefaultEmbeddingFunction } from "chromadb";
import type {
  VectorProvider,
  VectorDocument,
  VectorQuery,
  VectorResult,
  HealthStatus,
} from "@daydreamsai/core";

/**
 * Configuration for the Chroma Vector provider
 */
export interface ChromaVectorProviderConfig {
  /** ChromaDB connection URL/path */
  path?: string;
  /** Collection name for storing vector data */
  collectionName?: string;
  /** Custom embedding function */
  embeddingFunction?: IEmbeddingFunction;
  /** Opt-in to using OpenAI embeddings when OPENAI_API_KEY is set */
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
 * ChromaDB implementation of VectorProvider
 */
export class ChromaVectorProvider implements VectorProvider {
  private client: ChromaClient;
  private collection!: Collection;
  private collectionName: string;
  private embeddingFunction: IEmbeddingFunction;
  private metadata: Record<string, any>;

  constructor(config: ChromaVectorProviderConfig = {}) {
    const {
      path,
      collectionName = "daydreams_vectors",
      embeddingFunction,
      useOpenAI = false,
      auth,
      metadata = {},
    } = config;

    // Initialize embedding function
    this.embeddingFunction =
      embeddingFunction ||
      (process.env.OPENAI_API_KEY
        ? new OpenAIEmbeddingFunction({
            openai_api_key: process.env.OPENAI_API_KEY!,
            openai_model: "text-embedding-3-small",
          })
        : new DefaultEmbeddingFunction());

    // Initialize ChromaDB client
    this.client = new ChromaClient({
      path: path || undefined,
    });

    this.collectionName = collectionName;
    this.metadata = {
      description: "DaydreamsAI vector storage",
      created_at: new Date().toISOString(),
      ...metadata,
    };
  }

  async initialize(): Promise<void> {
    try {
      this.collection = await this.client.getOrCreateCollection({
        name: this.collectionName,
        embeddingFunction: this.embeddingFunction,
        metadata: this.metadata,
      });
    } catch (error) {
      throw new Error(
        `Failed to initialize ChromaDB collection: ${
          error instanceof Error ? error.message : error
        }`
      );
    }
  }

  async close(): Promise<void> {
    // ChromaDB client doesn't need explicit cleanup
  }

  async health(): Promise<HealthStatus> {
    try {
      // Test connectivity by heartbeat
      await this.client.heartbeat();

      // Test collection access
      if (this.collection) {
        await this.collection.count();
      }

      return {
        status: "healthy",
        message: "ChromaDB vector provider is operational",
      };
    } catch (error) {
      return {
        status: "unhealthy",
        message: `ChromaDB connection failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  }

  async index(documents: VectorDocument[]): Promise<void> {
    if (documents.length === 0) return;

    try {
      // Normalize and filter out unindexable docs (no embedding and empty content)
      const normalized = documents.map((doc) => {
        const content =
          typeof doc.content === "string" ? doc.content : String(doc.content ?? "");
        return { ...doc, content };
      });

      const indexable = normalized.filter(
        (d) => d.embedding || (typeof d.content === "string" && d.content.trim() !== "")
      );

      if (indexable.length === 0) return;

      const ids = indexable.map((doc) => doc.id);
      const contents = indexable.map((doc) => doc.content as string);
      const metadatas = indexable.map((doc) => {
        const md = sanitizeMetadata(doc.metadata);
        return {
          ...md,
          namespace: doc.namespace || "default",
          indexed_at: new Date().toISOString(),
        } as Record<string, string | number | boolean>;
      });

      // Use embeddings if provided for every item; otherwise let Chroma generate
      const embeddings = indexable.every((doc) => doc.embedding)
        ? indexable.map((doc) => doc.embedding!)
        : undefined;

      await this.collection.add({
        ids,
        documents: contents,
        metadatas,
        embeddings,
      });
    } catch (error) {
      throw new Error(
        `Failed to index documents in ChromaDB: ${
          error instanceof Error ? error.message : error
        }`
      );
    }
  }

  async search(query: VectorQuery): Promise<VectorResult[]> {
    try {
      const {
        query: queryText,
        embedding,
        namespace,
        filter,
        limit = 10,
        includeMetadata = true,
        includeContent = true,
        minScore,
      } = query;

      // Build where clause for filtering, including namespace and time range hints
      let where: Record<string, any> | undefined;
      if (namespace || filter) {
        const w: Record<string, any> = {};
        if (namespace) {
          // Bare equality on metadata fields is valid in Chroma filters
          w.namespace = namespace;
        }
        if (filter) {
          const f: Record<string, any> = { ...filter };
          if (f.scope === "all") delete f.scope;
          const timeFrom = f.timeFrom as number | undefined;
          const timeTo = f.timeTo as number | undefined;
          if (typeof timeFrom === "number" || typeof timeTo === "number") {
            const ts: Record<string, number> = {};
            if (typeof timeFrom === "number") ts.$gte = timeFrom;
            if (typeof timeTo === "number") ts.$lte = timeTo;
            w.timestamp = ts;
            delete f.timeFrom;
            delete f.timeTo;
          }
          for (const [k, v] of Object.entries(f)) {
            if (v === undefined || v === null) continue;
            w[k] = v;
          }
        }
        if (Object.keys(w).length > 0) where = w;
      }

      // Perform search
      const searchParams: any = {
        nResults: limit,
        where,
        include: [],
      };

      if (includeMetadata) searchParams.include.push(IncludeEnum.Metadatas);
      if (includeContent) searchParams.include.push(IncludeEnum.Documents);
      searchParams.include.push(IncludeEnum.Distances);

      // Use either query text or embedding. If neither provided (empty string), fall back to listing by filter.
      if (typeof queryText === "string" && queryText.trim() !== "") {
        searchParams.queryTexts = [queryText];
      } else if (embedding) {
        searchParams.queryEmbeddings = [embedding];
      } else {
        // Fallback: list items by filter/namespace when no query is provided
        try {
          const list = await this.collection.get({
            where,
            include: [
              ...(includeContent
                ? ([IncludeEnum.Documents] as IncludeEnum[])
                : []),
              ...(includeMetadata
                ? ([IncludeEnum.Metadatas] as IncludeEnum[])
                : []),
            ],
            limit,
          } as any);

          const ids = list.ids || [];
          const vectorResults: VectorResult[] = [];
          for (let i = 0; i < ids.length; i++) {
            vectorResults.push({
              id: ids[i],
              score: 0,
              content: includeContent
                ? list.documents?.[i] ?? undefined
                : undefined,
              metadata: includeMetadata
                ? list.metadatas?.[i] ?? undefined
                : undefined,
            });
          }
          return vectorResults;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          if (/Invalid where clause/i.test(msg)) {
            const list = await this.collection.get({
              include: [
                ...(includeContent
                  ? ([IncludeEnum.Documents] as IncludeEnum[])
                  : []),
                ...(includeMetadata
                  ? ([IncludeEnum.Metadatas] as IncludeEnum[])
                  : []),
              ],
              limit,
            } as any);
            const ids = list.ids || [];
            const vectorResults: VectorResult[] = [];
            for (let i = 0; i < ids.length; i++) {
              vectorResults.push({
                id: ids[i],
                score: 0,
                content: includeContent
                  ? list.documents?.[i] ?? undefined
                  : undefined,
                metadata: includeMetadata
                  ? list.metadatas?.[i] ?? undefined
                  : undefined,
              });
            }
            return vectorResults;
          }
          throw err;
        }
      }

      let results;
      try {
        results = await this.collection.query(searchParams);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (/Invalid where clause/i.test(msg)) {
          const { where: _omit, ...rest } = searchParams;
          results = await this.collection.query(rest);
        } else {
          throw err;
        }
      }

      // Convert ChromaDB results to VectorResult format
      const vectorResults: VectorResult[] = [];
      const ids = results.ids[0] || [];
      const distances = results.distances?.[0] || [];
      const documents = results.documents?.[0] || [];
      const metadatas = results.metadatas?.[0] || [];

      for (let i = 0; i < ids.length; i++) {
        const distance = distances[i];
        const score = 1 - distance; // Convert distance to similarity score

        // Apply minimum score filter
        if (minScore && score < minScore) continue;

        vectorResults.push({
          id: ids[i],
          score,
          content: includeContent ? documents[i] ?? undefined : undefined,
          metadata: includeMetadata ? metadatas[i] ?? undefined : undefined,
        });
      }

      return vectorResults;
    } catch (error) {
      throw new Error(
        `Failed to search vectors in ChromaDB: ${
          error instanceof Error ? error.message : error
        }`
      );
    }
  }

  async delete(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    try {
      await this.collection.delete({
        ids,
      });
    } catch (error) {
      throw new Error(
        `Failed to delete vectors from ChromaDB: ${
          error instanceof Error ? error.message : error
        }`
      );
    }
  }

  async update(id: string, updates: Partial<VectorDocument>): Promise<void> {
    try {
      // ChromaDB doesn't have a direct update method, so we need to delete and re-add
      const existing = await this.collection.get({
        ids: [id],
        include: [
          IncludeEnum.Documents,
          IncludeEnum.Metadatas,
          IncludeEnum.Embeddings,
        ],
      });

      if (!existing.ids[0] || existing.ids[0].length === 0) {
        throw new Error(`Document with id ${id} not found`);
      }

      // Get existing data
      const existingDoc = existing.documents[0]?.[0];
      const existingMetadata = existing.metadatas[0]?.[0];
      const existingEmbedding = existing.embeddings?.[0]?.[0];

      if (!existingDoc) {
        throw new Error(`Document content not found for id ${id}`);
      }

      // Delete the existing document
      await this.collection.delete({ ids: [id] });

      // Prepare updated document
      const updatedDoc: VectorDocument = {
        id,
        content: updates.content ?? existingDoc,
        embedding:
          updates.embedding ??
          (Array.isArray(existingEmbedding) ? existingEmbedding : undefined),
        metadata: {
          ...(existingMetadata && typeof existingMetadata === "object"
            ? existingMetadata
            : {}),
          ...updates.metadata,
          updated_at: new Date().toISOString(),
        },
        namespace:
          updates.namespace ??
          (existingMetadata &&
          typeof existingMetadata === "object" &&
          existingMetadata !== null &&
          "namespace" in existingMetadata
            ? (existingMetadata as any).namespace
            : undefined),
      };

      // Re-add with updates
      await this.index([updatedDoc]);
    } catch (error) {
      throw new Error(
        `Failed to update vector in ChromaDB: ${
          error instanceof Error ? error.message : error
        }`
      );
    }
  }

  async count(namespace?: string): Promise<number> {
    try {
      if (namespace) {
        // Count with namespace filter
        const results = await this.collection.get({
          where: { namespace },
          include: [], // Don't include any data, just count
        });
        return results.ids.length;
      } else {
        // Count all documents
        return await this.collection.count();
      }
    } catch (error) {
      throw new Error(
        `Failed to count vectors in ChromaDB: ${
          error instanceof Error ? error.message : error
        }`
      );
    }
  }

  /** Ensure metadata values are primitives supported by Chroma (string | number | boolean). */
  static coerceValue(v: any): string | number | boolean | undefined {
    if (v === undefined) return undefined;
    if (v === null) return "null"; // represent null as string
    const t = typeof v;
    if (t === "string" || t === "number" || t === "boolean") return v as any;
    // Arrays/objects -> JSON string
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
}

function sanitizeMetadata(
  metadata?: Record<string, any>
): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  if (!metadata || typeof metadata !== "object") return out;
  for (const [k, v] of Object.entries(metadata)) {
    const coerced = ChromaVectorProvider.coerceValue(v);
    if (coerced !== undefined) out[k] = coerced;
  }
  return out;
}

/**
 * Factory function to create a Chroma Vector provider
 */
export function createChromaVectorProvider(
  config: ChromaVectorProviderConfig = {}
): ChromaVectorProvider {
  return new ChromaVectorProvider(config);
}
