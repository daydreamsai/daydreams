import type {
  Memory,
  MemoryConfig,
  IWorkingMemory,
  KeyValueMemory,
  VectorMemory,
  GraphMemory,
  RememberOptions,
  RecallOptions,
  MemoryResult,
  ForgetCriteria,
} from "./types";
import { WorkingMemoryImpl } from "./working-memory";
import { KeyValueMemoryImpl } from "./kv-memory";
import { VectorMemoryImpl } from "./vector-memory";
import { GraphMemoryImpl } from "./graph-memory";
import { EpisodicMemoryImpl, type EpisodicMemory } from "./episodic-memory";
import type { Logger } from "../logger";

/**
 * Simplified Memory System - basic storage only
 */
export class MemorySystem implements Memory {
  public working: IWorkingMemory;
  public kv: KeyValueMemory;
  public vector: VectorMemory;
  public graph: GraphMemory;
  public episodes: EpisodicMemory;

  private providers: MemoryConfig["providers"];
  private initialized = false;
  private logger?: Logger;

  constructor(private config: MemoryConfig) {
    this.providers = config.providers;
    this.logger = config.logger;

    // Initialize basic memory types with providers
    this.kv = new KeyValueMemoryImpl(this.providers.kv);
    this.vector = new VectorMemoryImpl(this.providers.vector);
    this.graph = new GraphMemoryImpl(this.providers.graph);

    // Initialize episodic and working memory with intelligence
    this.episodes = new EpisodicMemoryImpl(this);
    this.working = new WorkingMemoryImpl(this);
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    if (this.logger) {
      this.logger.info("memory:init", "Starting memory system initialization", {
        providers: {
          kv: this.providers.kv.constructor.name,
          vector: this.providers.vector.constructor.name,
          graph: this.providers.graph.constructor.name,
        },
      });
    }

    // Initialize providers
    await Promise.all([
      this.providers.kv.initialize(),
      this.providers.vector.initialize(),
      this.providers.graph.initialize(),
    ]);

    this.initialized = true;

    if (this.logger) {
      this.logger.info("memory:init", "Memory system initialized successfully");
    }
  }

  async close(): Promise<void> {
    if (!this.initialized) return;

    // Close providers
    await Promise.all([
      this.providers.kv.close(),
      this.providers.vector.close(),
      this.providers.graph.close(),
    ]);

    this.initialized = false;
  }

  async remember(content: unknown, options?: RememberOptions): Promise<void> {
    // Backward-compatible path: simple string content
    if (typeof content === "string") {
      const scope = options?.scope || "context";
      const key = this.buildStorageKey(content, options, scope);
      await this.vector.index([
        {
          id: key,
          content,
          metadata: {
            scope,
            contextId: options?.contextId,
            type: options?.type || "text",
            timestamp: Date.now(),
            ...options?.metadata,
          },
          namespace: options?.namespace,
        },
      ]);
      return;
    }

    // If a structured record is passed, route to rememberRecord, merging options
    if (content && typeof content === "object") {
      const record = { ...(content as Record<string, any>) };
      if (options) {
        if (options.key && !record.id) record.id = options.key;
        if (options.type && !record.type) record.type = options.type;
        if (options.scope && !record.scope) record.scope = options.scope;
        if (options.contextId && !record.contextId) record.contextId = options.contextId;
        if (options.namespace && !record.namespace) record.namespace = options.namespace;
        // Merge metadata with options.metadata taking precedence
        record.metadata = { ...(record.metadata || {}), ...(options.metadata || {}) };
        if (options.ttl && !record.ttl) record.ttl = options.ttl;
      }
      await this.rememberRecord(record, { upsert: true });
    }
  }

  async recall(query: any, options?: RecallOptions): Promise<MemoryResult[]> {
    const qText: string | undefined = typeof query === "string" ? query : query?.text;
    const qEmbedding: number[] | undefined = typeof query === "object" ? query?.embedding : undefined;
    const namespace: string | undefined = (typeof query === "object" && query?.namespace) || options?.namespace;

    const searchFilter = this.buildSearchFilter(options);
    // Merge additional filters if provided via structured query
    if (typeof query === "object" && query?.filters) {
      Object.assign(searchFilter, query.filters);
    }

    const limit = options?.topK ?? options?.limit ?? 10;
    const minScore = options?.minScore ?? options?.minRelevance;
    const includeContent = options?.include?.content !== false; // default true
    const includeMetadata = options?.include?.metadata !== false; // default true

    // Vector search
    const vectorResults = await this.vector.search({
      query: qEmbedding ? undefined : (qText || ""),
      embedding: qEmbedding,
      limit,
      filter: searchFilter,
      minScore,
      includeContent,
      includeMetadata,
      namespace,
    });

    // Post-weighting with salience and recency (optional)
    const salienceWeight = options?.weighting?.salience ?? 0;
    const halfLife = options?.weighting?.recencyHalfLifeMs;
    const now = Date.now();

    let results: MemoryResult[] = vectorResults.map((vr) => {
      const md = (vr.metadata || {}) as Record<string, any>;
      const timestamp = (md.timestamp as number) || undefined;
      const salience = (md.salience as number) || 0;
      const recencyBoost = halfLife && timestamp
        ? Math.exp(-Math.max(0, now - timestamp) / halfLife)
        : 1;
      const score = (vr.score || 0) * (1 + salienceWeight * salience) * recencyBoost;
      const diagnostics = options?.include?.diagnostics
        ? { salience, recencyBoost, rerankDelta: 0 }
        : undefined;
      const groupKey = this.computeGroupKey(md, options);
      return {
        id: vr.id,
        type: "memory",
        content: vr.content,
        score,
        rawScore: vr.score,
        metadata: vr.metadata,
        timestamp,
        diagnostics,
        groupKey: groupKey || undefined,
      } as MemoryResult;
    });

    // Dedupe/group (simple)
    results = this.applyGroupingAndDedupe(results, options);

    // Trim to requested topK
    const top = limit ?? results.length;
    results.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    return results.slice(0, top);
  }

  /** Return only the best match or null */
  async recallOne(query: any, options?: RecallOptions): Promise<MemoryResult | null> {
    const res = await this.recall(query, { ...(options || {}), topK: 1 });
    return res[0] || null;
  }

  async forget(criteria: ForgetCriteria): Promise<void> {
    const promises: Promise<any>[] = [];

    // Delete by pattern
    if (criteria.pattern) {
      const keys = await this.kv.keys(criteria.pattern);
      promises.push(...keys.map((key) => this.kv.delete(key)));
    }

    // Delete by context
    if (criteria.context) {
      const contextPattern = `*:${criteria.context}:*`;
      const keys = await this.kv.keys(contextPattern);
      promises.push(...keys.map((key) => this.kv.delete(key)));
    }

    // Delete old entries
    if (criteria.olderThan) {
      const cutoff = criteria.olderThan.getTime();
      const iterator = this.kv.scan();
      let result = await iterator.next();
      while (!result.done) {
        const [key, valueData] = result.value;
        if (
          valueData &&
          typeof valueData === "object" &&
          "timestamp" in valueData
        ) {
          const timestamp = (valueData as any).timestamp;
          if (timestamp && timestamp < cutoff) {
            promises.push(this.kv.delete(key));
          }
        }
        result = await iterator.next();
      }
    }

    await Promise.all(promises);
  }

  private buildStorageKey(
    _content: unknown,
    options?: RememberOptions,
    scope: string = "context"
  ): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2);

    if (options?.key) {
      return options.key;
    }

    switch (scope) {
      case "context": {
        const ctx = options?.contextId;
        // Avoid leaking 'undefined' into IDs when contextId is not provided
        return ctx
          ? `memory:${scope}:${ctx}:${timestamp}-${random}`
          : `memory:${scope}:${timestamp}-${random}`;
      }
      case "global":
        return `memory:${scope}:${timestamp}-${random}`;
      default:
        return `memory:${timestamp}-${random}`;
    }
  }

  private buildSearchFilter(options?: RecallOptions): Record<string, any> {
    const filter: Record<string, any> = {};

    if (options?.contextId) {
      filter.contextId = options.contextId;
    }

    if (options?.scope) {
      filter.scope = options.scope;
    }

    if (options?.timeRange) {
      // Consumers can still filter by timestamp in provider; include hint
      filter.timeFrom = options.timeRange.from;
      filter.timeTo = options.timeRange.to;
    }

    return filter;
  }

  /** Compute grouping key per result */
  private computeGroupKey(metadata: Record<string, any>, options?: RecallOptions): string | null {
    switch (options?.groupBy) {
      case "docId":
        return (metadata?.docId as string) || null;
      case "source":
        return (metadata?.source as string) || null;
      default:
        return null;
    }
  }

  /** Apply simple grouping and deduplication */
  private applyGroupingAndDedupe(results: MemoryResult[], options?: RecallOptions): MemoryResult[] {
    let out = results;

    // Deduplication
    if (options?.dedupeBy && options.dedupeBy !== "none") {
      const seen = new Set<string>();
      out = out.filter((r) => {
        const key = options.dedupeBy === "docId"
          ? ((r.metadata as any)?.docId as string) || r.id
          : r.id;
        if (!key) return true;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    // Grouping (keep best per group)
    if (options?.groupBy && options.groupBy !== "none") {
      const bestByGroup = new Map<string, MemoryResult>();
      for (const r of out) {
        const g = r.groupKey || this.computeGroupKey((r.metadata || {}) as any, options) || r.id;
        const prev = bestByGroup.get(g);
        if (!prev || ((r.score ?? 0) > (prev.score ?? 0))) {
          bestByGroup.set(g, r);
        }
      }
      out = Array.from(bestByGroup.values());
    }

    return out;
  }

  private isStructuredContent(content: unknown): content is {
    entities?: any[];
    relationships?: any[];
  } {
    return (
      typeof content === "object" &&
      content !== null &&
      ("entities" in content || "relationships" in content)
    );
  }

  /** Store a structured record into vector memory */
  async rememberRecord(record: any, options?: { upsert?: boolean }): Promise<{ id: string }> {
    const scope: string = record.scope || "context";
    const id =
      record.id ||
      (scope === "context" && record.contextId
        ? `memory:${scope}:${record.contextId}:${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`
        : this.buildStorageKey(record.text || record, undefined, scope));
    const timestamp = record.timestamp || Date.now();
    const metadata = {
      scope,
      contextId: record.contextId,
      type: record.metadata?.type || record.type || "text",
      timestamp,
      salience: record.salience,
      confidence: record.confidence,
      ...record.metadata,
    } as Record<string, any>;

    // Derive best-available text content for vector indexing
    const derivedText =
      typeof record.text === "string" && record.text.trim() !== ""
        ? record.text
        : typeof record.summary === "string" && record.summary.trim() !== ""
        ? record.summary
        : typeof record.content === "string" && record.content.trim() !== ""
        ? record.content
        : "";

    // If we have neither text nor an explicit embedding, skip vector index
    if ((derivedText === "" || derivedText == null) && !record.embedding) {
      // Optionally, could log here via this.logger
      return { id };
    }

    await this.vector.index([
      {
        id,
        content: derivedText,
        embedding: record.embedding,
        metadata,
        namespace: record.namespace,
      },
    ]);

    return { id };
  }

  /** Batch ingestion with optional naive chunking */
  async rememberBatch(
    records: any[],
    options?: { upsert?: boolean; chunk?: { size?: number; overlap?: number } }
  ): Promise<{ ids: string[]; warnings?: string[] }> {
    const ids: string[] = [];
    const warnings: string[] = [];
    const chunkSize = options?.chunk?.size || 0;
    const overlap = options?.chunk?.overlap || 0;

    for (const rec of records) {
      if (chunkSize > 0 && typeof rec?.text === "string" && rec.text.length > chunkSize) {
        // naive character-based chunking
        let start = 0;
        while (start < rec.text.length) {
          const end = Math.min(rec.text.length, start + chunkSize);
          const chunkText = rec.text.slice(start, end);
          const { id } = await this.rememberRecord({ ...rec, text: chunkText }, { upsert: options?.upsert });
          ids.push(id);
          if (end >= rec.text.length) break;
          start = end - overlap;
          if (start < 0) start = 0;
        }
      } else {
        const { id } = await this.rememberRecord(rec, { upsert: options?.upsert });
        ids.push(id);
      }
    }

    return { ids, warnings: warnings.length ? warnings : undefined };
  }
}
