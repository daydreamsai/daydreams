import { EventEmitter } from "events";
import type {
  Memory,
  MemoryConfig,
  MemoryLifecycle,
  IWorkingMemory,
  KeyValueMemory,
  VectorMemory,
  GraphMemory,
  FactualMemory,
  EpisodicMemory,
  SemanticMemory,
  RememberOptions,
  RecallOptions,
  MemoryResult,
  ForgetCriteria,
  ExtractedMemories,
  MemoryMiddleware,
  MemoryContext,
} from "./types";
import { WorkingMemoryImpl } from "./working-memory";
import { KeyValueMemoryImpl } from "./kv-memory";
import { VectorMemoryImpl } from "./vector-memory";
import { GraphMemoryImpl } from "./graph-memory";
import { FactualMemoryImpl } from "./factual-memory";
import { EpisodicMemoryImpl } from "./episodic-memory";
import { SemanticMemoryImpl } from "./semantic-memory";
import { MemoryExtractor } from "./extractor";
import { MemoryEvolution } from "./evolution";

/**
 * Main Memory System implementation
 */
export class MemorySystem implements Memory {
  public lifecycle: MemoryLifecycle;
  public working: IWorkingMemory;
  public kv: KeyValueMemory;
  public vector: VectorMemory;
  public graph: GraphMemory;
  public facts: FactualMemory;
  public episodes: EpisodicMemory;
  public semantic: SemanticMemory;

  private providers: MemoryConfig["providers"];
  private middleware: MemoryMiddleware[];
  private options: MemoryConfig["options"];
  private extractor: MemoryExtractor;
  private evolution: MemoryEvolution;
  private initialized = false;

  constructor(private config: MemoryConfig) {
    this.providers = config.providers;
    this.middleware = config.middleware || [];
    this.options = config.options || {};

    // Initialize lifecycle
    this.lifecycle = new MemoryLifecycleImpl();

    // Initialize base memory types with providers
    this.kv = new KeyValueMemoryImpl(this.providers.kv);
    this.vector = new VectorMemoryImpl(this.providers.vector);
    this.graph = new GraphMemoryImpl(this.providers.graph);

    // Initialize high-level memory types
    this.working = new WorkingMemoryImpl(this);
    this.facts = new FactualMemoryImpl(this);
    this.episodes = new EpisodicMemoryImpl(this);
    this.semantic = new SemanticMemoryImpl(this);

    // Initialize services
    this.extractor = new MemoryExtractor(this, this.options.learning?.model);
    this.evolution = new MemoryEvolution(this, this.options.evolution);
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Initialize providers with proper error handling and fallback strategies
    const initializationErrors: Error[] = [];
    
    // Initialize KV provider (critical - must succeed)
    try {
      await this.providers.kv.initialize();
    } catch (error) {
      const kvError = new Error(`Failed to initialize KV provider: ${error instanceof Error ? error.message : error}`);
      initializationErrors.push(kvError);
      throw kvError; // KV is critical, fail fast
    }

    // Initialize vector provider (non-critical - can fallback to in-memory)
    try {
      await this.providers.vector.initialize();
    } catch (error) {
      const vectorError = new Error(`Failed to initialize vector provider: ${error instanceof Error ? error.message : error}`);
      initializationErrors.push(vectorError);
      console.warn("Memory system: Vector provider initialization failed, continuing with limited functionality", vectorError.message);
    }

    // Initialize graph provider (non-critical - can fallback to in-memory)
    try {
      await this.providers.graph.initialize();
    } catch (error) {
      const graphError = new Error(`Failed to initialize graph provider: ${error instanceof Error ? error.message : error}`);
      initializationErrors.push(graphError);
      console.warn("Memory system: Graph provider initialization failed, continuing with limited functionality", graphError.message);
    }

    // Initialize middleware with individual error handling
    for (const mw of this.middleware) {
      if (mw.initialize) {
        try {
          await mw.initialize(this);
        } catch (error) {
          const middlewareError = new Error(`Failed to initialize middleware: ${error instanceof Error ? error.message : error}`);
          initializationErrors.push(middlewareError);
          console.warn("Memory system: Middleware initialization failed", middlewareError.message);
          // Continue with other middleware - don't fail the whole system
        }
      }
    }

    // Start evolution if enabled
    if (this.options?.evolution?.enabled) {
      this.evolution.start();
    }

    this.initialized = true;
    await this.lifecycle.emit("initialized");
  }

  async close(): Promise<void> {
    if (!this.initialized) return;

    // Stop evolution
    this.evolution.stop();

    // Close providers
    await Promise.all([
      this.providers.kv.close(),
      this.providers.vector.close(),
      this.providers.graph.close(),
    ]);

    this.initialized = false;
    await this.lifecycle.emit("closed");
  }

  async remember(content: any, options?: RememberOptions): Promise<void> {
    const context: MemoryContext = {
      operation: "remember",
      data: content,
      options: options || {},
      memory: this,
    };

    // Run before middleware
    for (const mw of this.middleware) {
      if (mw.beforeRemember) {
        await mw.beforeRemember(context);
      }
    }

    await this.lifecycle.emit("beforeRemember", context);

    // Use potentially modified context data and options
    let transformedContent = context.data;
    const finalOptions = context.options;

    // Transform content if middleware provides transformation
    for (const mw of this.middleware) {
      if (mw.transformStore) {
        transformedContent = await mw.transformStore(transformedContent);
      }
    }

    // Update context with transformed content
    context.data = transformedContent;

    // Classify and route content using final options
    const classified = await this.classifyContent(transformedContent, finalOptions);

    // Store in appropriate memory types
    const promises: Promise<void>[] = [];

    if (classified.fact) {
      promises.push(this.facts.store(classified.fact));
    }

    if (classified.episode) {
      promises.push(this.episodes.store(classified.episode));
    }

    if (classified.entities && classified.entities.length > 0) {
      for (const entity of classified.entities) {
        promises.push(this.graph.addEntity(entity).then(() => {}));
      }
    }

    if (classified.relationships && classified.relationships.length > 0) {
      for (const rel of classified.relationships) {
        promises.push(this.graph.addRelationship(rel).then(() => {}));
      }
    }

    // Store raw content if requested
    if (finalOptions?.key) {
      promises.push(
        this.kv.set(finalOptions.key, transformedContent, {
          ttl: finalOptions.ttl,
          tags: finalOptions.metadata,
        })
      );
    }

    // Index for vector search if requested
    if (finalOptions?.index !== false && typeof transformedContent === "string") {
      promises.push(
        this.vector.index([
          {
            id: finalOptions?.key || `memory:${Date.now()}`,
            content: transformedContent,
            metadata: {
              type: finalOptions?.type || "generic",
              context: finalOptions?.context,
              ...finalOptions?.metadata,
            },
          },
        ])
      );
    }

    await Promise.all(promises);

    // Run after middleware
    for (const mw of this.middleware) {
      if (mw.afterRemember) {
        await mw.afterRemember(context);
      }
    }

    await this.lifecycle.emit("afterRemember", context);
  }

  async recall(
    query: string,
    options?: RecallOptions
  ): Promise<MemoryResult[]> {
    const context: MemoryContext = {
      operation: "recall",
      data: query,
      options,
      memory: this,
    };

    // Run before middleware
    for (const mw of this.middleware) {
      if (mw.beforeRecall) {
        await mw.beforeRecall(context);
      }
    }

    await this.lifecycle.emit("beforeRecall", context);

    const results: MemoryResult[] = [];

    // Search across different memory types in parallel
    const searchPromises: Promise<MemoryResult[]>[] = [];

    // Vector search
    searchPromises.push(
      this.vector
        .search({
          query,
          limit: options?.limit || 20,
          filter: options?.filter,
          minScore: options?.minRelevance,
          includeContent: true,
          includeMetadata: true,
        })
        .then((vectorResults) =>
          vectorResults.map((vr) => ({
            id: vr.id,
            type: "vector",
            content: vr.content,
            score: vr.score,
            metadata: vr.metadata,
          }))
        )
    );

    // Fact search
    if (!options?.types || options.types.includes("fact")) {
      searchPromises.push(
        this.facts
          .search(query, { limit: options?.limit || 10 })
          .then((facts) =>
            facts.map((fact) => ({
              id: fact.id,
              type: "fact",
              content: fact.statement,
              confidence: fact.confidence,
              metadata: { source: fact.source, entities: fact.entities },
              timestamp: fact.timestamp,
            }))
          )
      );
    }

    // Episode search
    if (!options?.types || options.types.includes("episode")) {
      searchPromises.push(
        this.episodes
          .findSimilar(options?.context || "global", query, options?.limit || 5)
          .then((episodes) =>
            episodes.map((ep) => ({
              id: ep.id,
              type: "episode",
              content: ep.summary || { input: ep.input, output: ep.output },
              metadata: ep.metadata,
              timestamp: ep.timestamp,
            }))
          )
      );
    }

    // Pattern search
    if (!options?.types || options.types.includes("pattern")) {
      searchPromises.push(
        this.semantic
          .search(query, { limit: options?.limit || 5 })
          .then((concepts) =>
            concepts.map((concept) => ({
              id: concept.id,
              type: "pattern",
              content: concept.content,
              confidence: concept.confidence,
              metadata: { occurrences: concept.occurrences },
            }))
          )
      );
    }

    // Wait for all searches
    const allResults = await Promise.all(searchPromises);
    results.push(...allResults.flat());

    // Apply boosting if specified
    if (options?.boost) {
      for (const result of results) {
        const boostFactor = options.boost[result.type] || 1.0;
        if (result.score) {
          result.score *= boostFactor;
        }
      }
    }

    // Sort by score/confidence
    results.sort((a, b) => {
      const scoreA = a.score || a.confidence || 0;
      const scoreB = b.score || b.confidence || 0;
      return scoreB - scoreA;
    });

    // Apply limit
    const limitedResults = results.slice(0, options?.limit || 20);

    // Transform results if middleware provides transformation
    let finalResults = limitedResults;
    for (const mw of this.middleware) {
      if (mw.transformRetrieve) {
        finalResults = await Promise.all(
          finalResults.map((r) => mw.transformRetrieve!(r))
        );
      }
    }

    // Run after middleware
    for (const mw of this.middleware) {
      if (mw.afterRecall) {
        await mw.afterRecall({ ...context, data: finalResults });
      }
    }

    await this.lifecycle.emit("afterRecall", {
      query,
      options,
      results: finalResults,
    });

    return finalResults;
  }

  async forget(criteria: ForgetCriteria): Promise<void> {
    const context: MemoryContext = {
      operation: "forget",
      data: criteria,
      memory: this,
    };

    // Run before middleware
    for (const mw of this.middleware) {
      if (mw.beforeForget) {
        await mw.beforeForget(context);
      }
    }

    await this.lifecycle.emit("beforeForget", context);

    const promises: Promise<any>[] = [];

    // Delete by pattern
    if (criteria.pattern) {
      const keys = await this.kv.keys(criteria.pattern);
      promises.push(...keys.map((key) => this.kv.delete(key)));
    }

    // Delete by type
    if (criteria.type) {
      switch (criteria.type) {
        case "fact":
          const facts = await this.facts.search("*", {
            filter: criteria.tag,
          });
          promises.push(...facts.map((f) => this.facts.delete(f.id)));
          break;
        case "episode":
          if (criteria.context) {
            const episodes = await this.episodes.getByContext(criteria.context);
            promises.push(
              ...episodes.map((e) =>
                this.episodes.store({ ...e, deleted: true } as any)
              )
            );
          }
          break;
      }
    }

    // Delete old entries
    if (criteria.olderThan) {
      const cutoff = criteria.olderThan.getTime();
      // This would need to be implemented in each memory type
      // For now, we'll scan and delete from KV store
      const iterator = this.kv.scan();
      let result = await iterator.next();
      while (!result.done) {
        const [key, value] = result.value;
        if (value.timestamp && value.timestamp < cutoff) {
          promises.push(this.kv.delete(key));
        }
        result = await iterator.next();
      }
    }

    await Promise.all(promises);

    // Run after middleware
    for (const mw of this.middleware) {
      if (mw.afterForget) {
        await mw.afterForget(context);
      }
    }

    await this.lifecycle.emit("afterForget", criteria);
  }

  async extract(content: any, context: any): Promise<ExtractedMemories> {
    return this.extractor.extract(content, context);
  }

  async evolve(): Promise<void> {
    return this.evolution.evolve();
  }

  private async classifyContent(
    content: any,
    options?: RememberOptions
  ): Promise<any> {
    // Simple classification for now
    // In a full implementation, this would use the LLM to classify
    const classified: any = {};

    if (
      options?.type === "fact" ||
      (typeof content === "object" && content.statement)
    ) {
      classified.fact = {
        id: `fact:${Date.now()}`,
        statement: content.statement || content,
        confidence: content.confidence || 0.8,
        source: content.source || "user",
        timestamp: Date.now(),
        contextId: options?.context,
      };
    }

    if (
      options?.type === "episode" ||
      (typeof content === "object" && content.input)
    ) {
      classified.episode = {
        id: `episode:${Date.now()}`,
        type: "conversation",
        input: content.input,
        output: content.output,
        context: options?.context || "global",
        timestamp: Date.now(),
        metadata: content.metadata,
      };
    }

    // Extract entities if present
    if (typeof content === "object" && content.entities) {
      classified.entities = content.entities;
    }

    // Extract relationships if present
    if (typeof content === "object" && content.relationships) {
      classified.relationships = content.relationships;
    }

    return classified;
  }
}

/**
 * Memory Lifecycle implementation
 */
class MemoryLifecycleImpl implements MemoryLifecycle {
  private emitter = new EventEmitter();

  on(event: string, handler: (data: any) => void | Promise<void>): void {
    this.emitter.on(event, handler);
  }

  off(event: string, handler: (data: any) => void | Promise<void>): void {
    this.emitter.off(event, handler);
  }

  async emit(event: string, data?: any): Promise<void> {
    return new Promise((resolve) => {
      this.emitter.emit(event, data);
      // Use setImmediate to ensure all synchronous handlers complete
      setImmediate(resolve);
    });
  }
}
