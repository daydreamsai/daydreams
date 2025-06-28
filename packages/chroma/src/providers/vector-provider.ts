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
      const ids = documents.map((doc) => doc.id);
      const contents = documents.map((doc) => doc.content);
      const metadatas = documents.map((doc) => ({
        namespace: doc.namespace || "default",
        ...doc.metadata,
        indexed_at: new Date().toISOString(),
      }));

      // Use embeddings if provided, otherwise let ChromaDB generate them
      const embeddings = documents.every((doc) => doc.embedding)
        ? documents.map((doc) => doc.embedding!)
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

      // Build where clause for filtering
      let where: Record<string, any> | undefined;
      if (namespace || filter) {
        where = {};
        if (namespace) {
          where.namespace = namespace;
        }
        if (filter) {
          Object.assign(where, filter);
        }
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

      // Use either query text or embedding
      if (queryText) {
        searchParams.queryTexts = [queryText];
      } else if (embedding) {
        searchParams.queryEmbeddings = [embedding];
      } else {
        throw new Error("Either query text or embedding must be provided");
      }

      const results = await this.collection.query(searchParams);

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
}

/**
 * Factory function to create a Chroma Vector provider
 */
export function createChromaVectorProvider(
  config: ChromaVectorProviderConfig = {}
): ChromaVectorProvider {
  return new ChromaVectorProvider(config);
}
