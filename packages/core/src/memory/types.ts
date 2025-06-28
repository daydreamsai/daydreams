import type { LanguageModelV1 } from "ai";
import type { z } from "zod";

import type {
  ActionCall,
  ActionResult,
  AnyRef,
  EventRef,
  InputRef,
  OutputRef,
  ThoughtRef,
  RunRef,
  StepRef,
  AgentContext,
  AnyContext,
  AnyAgent,
  ContextState,
} from "../types";

/**
 * Core Memory interface - the unified API for all memory operations
 */
export interface Memory {
  // Core memory types
  working: IWorkingMemory;
  kv: KeyValueMemory;
  vector: VectorMemory;
  facts: FactualMemory;
  episodes: EpisodicMemory;
  semantic: SemanticMemory;
  graph: GraphMemory;

  // Unified operations
  remember(content: any, options?: RememberOptions): Promise<void>;
  recall(query: string, options?: RecallOptions): Promise<MemoryResult[]>;
  forget(criteria: ForgetCriteria): Promise<void>;
  extract(content: any, context: any): Promise<ExtractedMemories>;
  evolve(): Promise<void>;

  // Lifecycle
  lifecycle: MemoryLifecycle;

  // System
  initialize(): Promise<void>;
  close(): Promise<void>;
}

/**
 * Memory system configuration
 */
export interface MemoryConfig {
  providers: {
    kv: KeyValueProvider;
    vector: VectorProvider;
    graph: GraphProvider;
  };
  middleware?: MemoryMiddleware[];
  options?: MemoryOptions;
}

export interface MemoryOptions {
  evolution?: {
    enabled: boolean;
    interval?: number;
  };
  learning?: {
    enabled: boolean;
    model?: LanguageModelV1;
  };
  compression?: {
    enabled: boolean;
    threshold?: number;
  };
}

/**
 * Base provider interface
 */
export interface MemoryProvider {
  initialize(): Promise<void>;
  close(): Promise<void>;
  health(): Promise<HealthStatus>;
}

export interface HealthStatus {
  status: "healthy" | "unhealthy" | "degraded";
  message: string;
  details?: Record<string, any>;
}

/**
 * Key-Value storage provider
 */
export interface KeyValueProvider extends MemoryProvider {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: SetOptions): Promise<void>;
  delete(key: string): Promise<boolean>;
  exists(key: string): Promise<boolean>;
  keys(pattern?: string): Promise<string[]>;
  count(pattern?: string): Promise<number>;
  scan(pattern?: string): AsyncIterator<[string, any]>;

  // Batch operations
  getBatch<T>(keys: string[]): Promise<Map<string, T>>;
  setBatch<T>(entries: Map<string, T>, options?: SetOptions): Promise<void>;
  deleteBatch(keys: string[]): Promise<number>;
}

export interface SetOptions {
  ttl?: number;
  ifNotExists?: boolean;
  tags?: Record<string, string>;
}

/**
 * Vector storage provider
 */
export interface VectorProvider extends MemoryProvider {
  index(documents: VectorDocument[]): Promise<void>;
  search(query: VectorQuery): Promise<VectorResult[]>;
  delete(ids: string[]): Promise<void>;
  update(id: string, updates: Partial<VectorDocument>): Promise<void>;
  count(namespace?: string): Promise<number>;
}

export interface VectorDocument {
  id: string;
  content: string;
  embedding?: number[];
  metadata?: Record<string, any>;
  namespace?: string;
}

export interface VectorQuery {
  query?: string;
  embedding?: number[];
  namespace?: string;
  filter?: Record<string, any>;
  limit?: number;
  includeMetadata?: boolean;
  includeContent?: boolean;
  minScore?: number;
}

export interface VectorResult {
  id: string;
  score: number;
  content?: string;
  metadata?: Record<string, any>;
}

/**
 * Graph storage provider
 */
export interface GraphProvider extends MemoryProvider {
  // Node operations
  addNode(node: GraphNode): Promise<string>;
  getNode(id: string): Promise<GraphNode | null>;
  updateNode(id: string, updates: Partial<GraphNode>): Promise<void>;
  deleteNode(id: string): Promise<boolean>;

  // Edge operations
  addEdge(edge: GraphEdge): Promise<string>;
  getEdges(
    nodeId: string,
    direction?: "in" | "out" | "both"
  ): Promise<GraphEdge[]>;
  deleteEdge(id: string): Promise<boolean>;

  // Query operations
  findNodes(filter: GraphFilter): Promise<GraphNode[]>;
  traverse(traversal: GraphTraversal): Promise<GraphPath[]>;
  shortestPath(from: string, to: string): Promise<GraphPath | null>;
}

export interface GraphNode {
  id: string;
  type: string;
  properties: Record<string, any>;
  labels?: string[];
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  type: string;
  properties?: Record<string, any>;
}

export interface GraphFilter {
  type?: string;
  labels?: string[];
  properties?: Record<string, any>;
}

export interface GraphTraversal {
  start: string;
  direction: "in" | "out" | "both";
  maxDepth?: number;
  filter?: GraphFilter;
}

export interface GraphPath {
  nodes: GraphNode[];
  edges: GraphEdge[];
  length: number;
}

/**
 * Working Memory - manages current session state
 */
export interface IWorkingMemory {
  create(contextId: string): Promise<WorkingMemoryData>;
  get(contextId: string): Promise<WorkingMemoryData>;
  set(contextId: string, data: WorkingMemoryData): Promise<void>;
  push<TContext extends AnyContext = AnyContext>(
    contextId: string,
    entry: AnyRef,
    ctx: AgentContext<TContext>,
    agent: AnyAgent,
    options?: PushOptions
  ): Promise<void>;
  clear(contextId: string): Promise<void>;
  summarize(contextId: string): Promise<string>;
}

export interface WorkingMemoryData {
  inputs: InputRef<any>[];
  outputs: OutputRef[];
  thoughts: ThoughtRef[];
  calls: ActionCall<any>[];
  results: ActionResult<any>[];
  events: EventRef[];
  steps: StepRef[];
  runs: RunRef[];
  relevantMemories?: MemoryResult[];
}

export interface PushOptions {
  memoryManager?: MemoryManager;
  compress?: boolean;
}

/**
 * Memory manager for handling memory pressure
 */
export interface MemoryManager<TContext extends AnyContext = AnyContext> {
  /** Called when memory needs pruning due to size constraints */
  onMemoryPressure?: (
    ctx: AgentContext<TContext>,
    workingMemory: WorkingMemory,
    agent: AnyAgent
  ) => Promise<WorkingMemory> | WorkingMemory;

  /** Called before adding new entries to determine if pruning is needed */
  shouldPrune?: (
    ctx: AgentContext<TContext>,
    workingMemory: WorkingMemory,
    newEntry: AnyRef,
    agent: AnyAgent
  ) => Promise<boolean> | boolean;

  /** Called to compress/summarize old entries into a compact representation */
  compress?: (
    ctx: AgentContext<TContext>,
    entries: AnyRef[],
    agent: AnyAgent
  ) => Promise<string> | string;

  /** Maximum number of entries before triggering memory management */
  maxSize?: number;

  /** Memory management strategy */
  strategy?: "fifo" | "lru" | "smart" | "custom";

  /** Whether to preserve certain types of entries during pruning */
  preserve?: {
    /** Always keep the last N inputs */
    recentInputs?: number;
    /** Always keep the last N outputs */
    recentOutputs?: number;
    /** Always keep action calls with these names */
    actionNames?: string[];
    /** Custom preservation logic */
    custom?: (entry: AnyRef, ctx: AgentContext<TContext>) => boolean;
  };
}

/**
 * Factual Memory - stores verified facts
 */
export interface FactualMemory {
  store(facts: Fact | Fact[]): Promise<void>;
  get(id: string, contextId?: string): Promise<Fact | null>;
  search(
    query: string,
    options?: SearchOptions & { contextId?: string }
  ): Promise<Fact[]>;
  verify(factId: string, contextId?: string): Promise<FactVerification>;
  update(id: string, updates: Partial<Fact>, contextId?: string): Promise<void>;
  delete(id: string, contextId?: string): Promise<boolean>;
  getByTag(tag: string, value: string, contextId?: string): Promise<Fact[]>;
  getByContext(contextId: string): Promise<Fact[]>;
}

export interface Fact {
  id: string;
  statement: string;
  confidence: number;
  source: string;
  entities?: string[];
  tags?: Record<string, string>;
  timestamp: number;
  contextId?: string;
  verification?: FactVerification;
}

export interface FactVerification {
  factId: string;
  verified: boolean;
  confidence: number;
  supportingFacts: string[];
  conflictingFacts: string[];
  lastVerified: number;
}

/**
 * Episodic Memory - stores past experiences
 */
export interface EpisodicMemory {
  store(episode: Episode): Promise<void>;
  get(id: string): Promise<Episode | null>;
  findSimilar(
    contextId: string,
    content: string,
    limit?: number
  ): Promise<Episode[]>;
  getTimeline(start: Date, end: Date): Promise<Episode[]>;
  getByContext(contextId: string): Promise<Episode[]>;
  compress(episodes: Episode[]): Promise<CompressedEpisode>;
}

export interface Episode {
  id: string;
  type: "conversation" | "action" | "event" | "compression";
  input?: any;
  output?: any;
  context: string;
  timestamp: number;
  duration?: number;
  metadata?: Record<string, any>;
  summary?: string;
}

export interface CompressedEpisode extends Episode {
  type: "compression";
  originalEpisodes: string[];
  compressionRatio: number;
}

/**
 * Semantic Memory - stores learned concepts and patterns
 */
export interface SemanticMemory {
  store(concept: SemanticConcept): Promise<void>;
  get(id: string, contextId?: string): Promise<SemanticConcept | null>;
  search(
    query: string,
    options?: SearchOptions & { contextId?: string }
  ): Promise<SemanticConcept[]>;
  getRelevantPatterns(contextId: string): Promise<Pattern[]>;
  learnFromAction(action: any, result: any, contextId?: string): Promise<void>;
  updateConfidence(
    id: string,
    delta: number,
    contextId?: string
  ): Promise<void>;
}

export interface SemanticConcept {
  id: string;
  type: "pattern" | "concept" | "relationship" | "skill";
  content: string;
  confidence: number;
  occurrences: number;
  examples: string[];
  contextId?: string; // Context-specific or global if undefined
  metadata?: Record<string, any>;
}

export interface Pattern extends SemanticConcept {
  type: "pattern";
  trigger: string;
  response: string;
  successRate: number;
}

/**
 * Graph Memory - stores entity relationships
 */
export interface GraphMemory {
  addEntity(entity: Entity): Promise<string>;
  addRelationship(relationship: Relationship): Promise<string>;
  getEntity(id: string): Promise<Entity | null>;
  findRelated(entityId: string, relationshipType?: string): Promise<Entity[]>;
  findPath(from: string, to: string): Promise<Entity[]>;
  updateEntity(id: string, updates: Partial<Entity>): Promise<void>;
  removeEntity(id: string): Promise<boolean>;
}

export interface Entity {
  id: string;
  type: string;
  name: string;
  properties: Record<string, any>;
  contextIds: string[];
}

export interface Relationship {
  id: string;
  from: string;
  to: string;
  type: string;
  properties?: Record<string, any>;
  strength?: number;
}

/**
 * Key-Value Memory interface
 */
export interface KeyValueMemory {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: SetOptions): Promise<void>;
  delete(key: string): Promise<boolean>;
  exists(key: string): Promise<boolean>;
  keys(pattern?: string): Promise<string[]>;
  count(pattern?: string): Promise<number>;
  scan(pattern?: string): AsyncIterator<[string, any]>;
}

/**
 * Vector Memory interface
 */
export interface VectorMemory {
  index(documents: VectorDocument[]): Promise<void>;
  search(query: VectorQuery): Promise<VectorResult[]>;
  delete(ids: string[]): Promise<void>;
}

/**
 * Memory lifecycle events
 */
export interface MemoryLifecycle {
  on(event: string, handler: LifecycleHandler): void;
  off(event: string, handler: LifecycleHandler): void;
  emit(event: string, data?: any): Promise<void>;
}

export type LifecycleHandler = (data: any) => void | Promise<void>;

/**
 * Memory middleware for cross-cutting concerns
 */
export interface MemoryMiddleware {
  name: string;
  initialize?(memory: Memory): Promise<void>;

  // Lifecycle hooks
  beforeRemember?(context: MemoryContext): Promise<void>;
  afterRemember?(context: MemoryContext): Promise<void>;
  beforeRecall?(context: MemoryContext): Promise<void>;
  afterRecall?(context: MemoryContext): Promise<void>;
  beforeForget?(context: MemoryContext): Promise<void>;
  afterForget?(context: MemoryContext): Promise<void>;

  // Transform hooks
  transformStore?(data: any): Promise<any>;
  transformRetrieve?(data: any): Promise<any>;
}

export interface MemoryContext {
  operation: string;
  data?: any;
  options?: any;
  memory: Memory;
}

/**
 * Memory operation options
 */
export interface RememberOptions {
  key?: string;
  type?: string;
  context?: string;
  metadata?: Record<string, any>;
  index?: boolean;
  ttl?: number;
}

export interface RecallOptions {
  context?: string;
  types?: string[];
  limit?: number;
  minRelevance?: number;
  boost?: Record<string, number>;
  filter?: Record<string, any>;
}

export interface ForgetCriteria {
  pattern?: string;
  type?: string;
  context?: string;
  olderThan?: Date;
  tag?: Record<string, string>;
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
  sort?: "relevance" | "timestamp" | "confidence";
  filter?: Record<string, any>;
}

/**
 * Memory results
 */
export interface MemoryResult {
  id: string;
  type: string;
  content: any;
  score?: number;
  confidence?: number;
  metadata?: Record<string, any>;
  timestamp?: number;
}

export interface ExtractedMemories {
  facts: Fact[];
  preferences: Preference[];
  entities: Entity[];
  events: Event[];
  relationships: Relationship[];
}

export interface Preference {
  id: string;
  subject: string;
  preference: string;
  strength: number;
  contextId: string;
}

export interface Event {
  id: string;
  type: string;
  description: string;
  participants: string[];
  timestamp: number;
  contextId: string;
}
/**
 * Represents a memory configuration for storing data
 * @template Data - Type of data stored in memory
 */
export type ActionState<Data = any> = {
  /** Unique identifier for this memory */
  key: string;
  /** Function to initialize memory data */
  create: () => Promise<Data> | Data;
};

/**
 * Extracts the data type from a Memory type
 * @template TMemory - Memory type to extract data from
 */
export type InferActionState<TMemory extends ActionState<any>> =
  TMemory extends ActionState<infer Data> ? Data : never;

/**
 * Represents the working memory state during execution
 */
export interface WorkingMemory extends WorkingMemoryData {
  /** Current image URL for multimodal context */
  currentImage?: URL;
}

/**
 * Episode detection and creation hooks for contexts
 * Allows developers to customize when and how episodes are stored
 */
export interface EpisodeHooks<TContext extends AnyContext = AnyContext> {
  /**
   * Called to determine if a new episode should be started
   * @param ref - The current log reference being processed
   * @param workingMemory - Current working memory state
   * @param contextState - Current context state
   * @param agent - Agent instance
   * @returns true if a new episode should start
   */
  shouldStartEpisode?(
    ref: AnyRef,
    workingMemory: WorkingMemory,
    contextState: ContextState<TContext>,
    agent: AnyAgent
  ): Promise<boolean> | boolean;

  /**
   * Called to determine if the current episode should be ended and stored
   * @param ref - The current log reference being processed
   * @param workingMemory - Current working memory state
   * @param contextState - Current context state
   * @param agent - Agent instance
   * @returns true if the current episode should be stored
   */
  shouldEndEpisode?(
    ref: AnyRef,
    workingMemory: WorkingMemory,
    contextState: ContextState<TContext>,
    agent: AnyAgent
  ): Promise<boolean> | boolean;

  /**
   * Called to create episode data from collected logs
   * @param logs - Array of logs that make up this episode
   * @param contextState - Current context state
   * @param agent - Agent instance
   * @returns Episode data to be stored
   */
  createEpisode?(
    logs: AnyRef[],
    contextState: ContextState<TContext>,
    agent: AnyAgent
  ): Promise<any> | any;

  /**
   * Called to classify the type of episode (optional)
   * @param episodeData - The episode data from createEpisode
   * @param contextState - Current context state
   * @returns Episode type/classification string
   */
  classifyEpisode?(
    episodeData: any,
    contextState: ContextState<TContext>
  ): string;

  /**
   * Called to extract additional metadata for the episode (optional)
   * @param episodeData - The episode data from createEpisode
   * @param logs - The original logs for this episode
   * @param contextState - Current context state
   * @returns Metadata object
   */
  extractMetadata?(
    episodeData: any,
    logs: AnyRef[],
    contextState: ContextState<TContext>
  ): Record<string, any>;
}
