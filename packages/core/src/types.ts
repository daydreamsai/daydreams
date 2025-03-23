import { type LanguageModelV1 } from "ai";
import { z } from "zod";
import type { Container } from "./container";
import type { ServiceProvider } from "./serviceProvider";
import type { BaseMemory } from "./memory";
import type { TaskRunner } from "./task";

/**
 * Represents a memory configuration for storing data
 * @template Data - Type of data stored in memory
 */
export type Memory<Data = any> = {
  /** Unique identifier for this memory */
  key: string;
  /** Function to initialize memory data */
  create: () => Promise<Data> | Data;
};

/**
 * Extracts the data type from a Memory type
 * @template TMemory - Memory type to extract data from
 */
export type InferMemoryData<TMemory extends Memory<any>> =
  TMemory extends Memory<infer Data> ? Data : never;

/**
 * Represents an execution chain with experts and metadata
 */
export type Chain = {
  /** Unique identifier for the chain */
  id: string;
  /** Current thinking/reasoning state */
  thinking: string;
  /** Goal or purpose of this chain */
  purpose: string;
  /** List of experts involved in the chain */
  experts: { name: string; data: string }[];
};

/**
 * Interface for storing and retrieving memory data
 */
export interface MemoryStore {
  /**
   * Retrieves data from memory
   * @template T - Type of data to retrieve
   * @param key - Key to lookup
   * @returns Promise resolving to data or null if not found
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Stores data in memory
   * @template T - Type of data to store
   * @param key - Key to store under
   * @param value - Data to store
   */
  set<T>(key: string, value: T): Promise<void>;

  /**
   * Removes data from memory
   * @param key - Key to remove
   */
  delete(key: string): Promise<void>;

  /**
   * Removes all data from memory
   */
  clear(): Promise<void>;
}

/**
 * Interface for storing and retrieving vector data
 */
export interface VectorStore {
  /** Optional connection string for the vector store */
  connection?: string;

  /**
   * Adds or updates data in the vector store
   * @param contextId - Unique identifier for the context
   * @param data - Data to add or update
   */
  upsert(contextId: string, data: any): Promise<void>;

  /**
   * Searches the vector store for similar data
   * @param contextId - Context to search within
   * @param query - Query text to search for
   * @returns Array of matching documents
   */
  query(contextId: string, query: string): Promise<any[]>;

  /**
   * Creates a new index in the vector store
   * @param indexName - Name of the index to create
   */
  createIndex(indexName: string): Promise<void>;

  /**
   * Deletes an existing index from the vector store
   * @param indexName - Name of the index to delete
   */
  deleteIndex(indexName: string): Promise<void>;
}

/**
 * Represents the working memory state during execution
 */
export interface WorkingMemory {
  /** List of input references */
  inputs: InputRef[];
  /** List of output references */
  outputs: OutputRef[];
  /** List of thought records */
  thoughts: Thought[];
  /** List of action calls */
  calls: ActionCall[];
  /** List of action results */
  results: ActionResult[];
  // chains: Chain[];
  episodicMemory?: EpisodicMemory;
  /** Current image URL for multimodal context */
  currentImage?: URL;
}

export type InferSchema<T> = T extends {
  schema?: infer S extends z.AnyZodObject;
}
  ? z.infer<S>
  : unknown;

export type InferAgentContext<TAgent extends AnyAgent> =
  TAgent extends Agent<infer Content> ? Content : never;

export type InferAgentMemory<TAgent extends AnyAgent> = InferContextMemory<
  InferAgentContext<TAgent>
>;

/**
 * Represents an evaluator that can validate action/output results
 * @template Data - Type of data being evaluated
 * @template Context - Context type for the evaluation
 */
export type Evaluator<
  Data = any,
  Context extends AgentContext<any> = AgentContext<any>,
  TAgent extends AnyAgent = AnyAgent,
> = {
  name: string;
  description?: string;
  /** Schema for the evaluation result */
  schema?: z.ZodType<any>;
  /** Custom prompt template for LLM-based evaluation */
  prompt?: string;
  /** Custom handler for evaluation logic */
  handler?: (
    data: Data,
    ctx: Context,
    agent: TAgent
  ) => Promise<boolean> | boolean;
  /** Optional callback when evaluation fails */
  onFailure?: (ctx: Context, agent: TAgent) => Promise<void> | void;
};

export type ActionContext<
  TContext extends AnyContext = AnyContext,
  AContext extends AnyContext = AnyContext,
  ActionMemory extends Memory<any> = Memory<any>,
> = AgentContext<TContext> & {
  actionMemory: InferMemoryData<ActionMemory>;
  agentMemory: InferContextMemory<AContext> | undefined;
  abortSignal?: AbortSignal;
};

/**
 * Represents an action that can be executed with typed parameters
 * @template Schema - Zod schema defining parameter types
 * @template Result - Return type of the action
 * @template Context - Context type for the action execution
 */
export type Action<
  Schema extends z.AnyZodObject = z.AnyZodObject,
  Result = any,
  TContext extends AnyContext = AnyContext,
  TAgent extends AnyAgent = AnyAgent,
  TMemory extends Memory<any> = Memory<any>,
> = {
  name: string;
  description?: string;
  instructions?: string;
  schema: Schema;
  memory?: TMemory;
  install?: (agent: TAgent) => Promise<void> | void;
  enabled?: (
    ctx: ActionContext<TContext, InferAgentContext<TAgent>, TMemory>
  ) => boolean;
  examples?: z.infer<Schema>[];
  handler: (
    call: ActionCall<z.infer<Schema>>,
    ctx: ActionContext<TContext, InferAgentContext<TAgent>, TMemory>,
    agent: TAgent
  ) => Promise<Result> | Result;
  format?: (result: ActionResult<Result>) => string | string[];
  /** Optional evaluator for this specific action */
  evaluator?: Evaluator<Result, AgentContext<TContext>, TAgent>;

  context?: TContext;
};

export type OutputSchema = z.AnyZodObject | z.ZodString;

export type OutputRefResponse = Omit<
  OutputRef,
  "id" | "ref" | "type" | "processed"
>;

export type OutputResponse =
  | OutputRefResponse
  | OutputRefResponse[]
  | undefined
  | void;

export type Output<
  Schema extends OutputSchema = OutputSchema,
  Context extends AgentContext<any> = AgentContext<any>,
  Response extends OutputResponse = OutputResponse,
  TAgent extends AnyAgent = AnyAgent,
> = {
  type: string;
  description?: string;
  instructions?: string;
  schema: Schema;
  install?: (agent: TAgent) => Promise<void>;
  enabled?: (ctx: AgentContext<any>) => boolean;
  handler: (
    params: z.infer<Schema>,
    ctx: Context,
    agent: TAgent
  ) => Promise<Response> | Response;
  format?: (res: Response) => string | string[];
  examples?: z.infer<Schema>[];
  /** Optional evaluator for this specific output */
  evaluator?: Evaluator<Response, Context, TAgent>;
  required?: boolean;
};

export type AnyAction = Action<any, any, any, any, any>;

/**
 * Represents an input handler with validation and subscription capability
 * @template Schema - Zod schema for input parameters
 * @template Context - Context type for input handling
 */
export type Input<
  Schema extends z.AnyZodObject = z.AnyZodObject,
  TAgent extends AnyAgent = AnyAgent,
> = {
  type: string;
  description?: string;
  schema: Schema;
  format?: (params: z.infer<Schema>) => string | string[];
  install?: (agent: TAgent) => Promise<void>;
  handler?: <
    TContext extends AgentContext<AnyContext> = AgentContext<AnyContext>,
  >(
    params: z.infer<Schema>,
    ctx: TContext,
    agent: TAgent
  ) => Promise<boolean> | boolean;
  subscribe?: (
    send: <TContext extends AnyContext>(
      contextHandler: TContext,
      args: z.infer<TContext["schema"]>,
      data: z.infer<Schema>
    ) => void,
    agent: TAgent
  ) => (() => void) | void | Promise<void | (() => void)>;
};

/** Reference to an input event in the system */
export type InputRef<Data = any> = {
  id: string;
  ref: "input";
  type: string;
  data: Data;
  params?: Record<string, string>;
  timestamp: number;
  processed: boolean;
  formatted?: string | string[];
};

/** Reference to an output event in the system */
export type OutputRef<Data = any> = {
  id: string;
  ref: "output";
  type: string;
  data: Data;
  params?: Record<string, string>;
  timestamp: number;
  processed: boolean;
  formatted?: string | string[];
};

/** Represents a call to an action */
export type ActionCall<Data = any> = {
  ref: "action_call";
  id: string;
  name: string;
  content: string;
  data: Data;
  timestamp: number;
  processed: boolean;
};

/** Represents the result of an action execution */
export type ActionResult<Data = any> = {
  ref: "action_result";
  id: string;
  callId: string;
  name: string;
  data: Data;
  timestamp: number;
  processed: boolean;
  formatted?: string | string[];
};

/** Represents a thought or reasoning step */
export type Thought = {
  ref: "thought";
  id: string;
  content: string;
  timestamp: number;
  processed: boolean;
};

export type Log = InputRef | OutputRef | Thought | ActionCall | ActionResult;

/** Properties required for Chain-of-Thought execution */
export type COTProps = {
  model: LanguageModelV1;
  plan: string;
  inputs: InputRef[];
  actions: Action[];
  outputs: Output[];
  logs: Log[];
};

/** Response structure from Chain-of-Thought execution */
export type COTResponse = {
  plan: string[];
  actions: ActionCall[];
  outputs: OutputRef[];
  thinking: Thought[];
};

/** Represents an XML element structure */
export type XMLElement = {
  tag: string;
  params?: Record<string, string>;
  content: string | (XMLElement | string)[];
};

/** Utility type to preserve type information */
export type Pretty<type> = { [key in keyof type]: type[key] } & unknown;

/**
 * Extracts variable names from a template string
 * @template T - Template string type
 */
export type ExtractTemplateVariables<T extends string> =
  T extends `${infer Start}{{${infer Var}}}${infer Rest}`
    ? Var | ExtractTemplateVariables<Rest>
    : never;

/**
 * Creates a type mapping template variables to string values
 * @template T - Template string type
 */
export type TemplateVariables<T extends string> = Pretty<{
  [K in ExtractTemplateVariables<T>]: string | string[] | object | any;
}>;

/** Represents an expert system with instructions and actions */
export type Expert = {
  type: string;
  description: string;
  instructions: string;
  model?: LanguageModelV1;
  actions?: AnyAction[];
};

export interface AgentContext<TContext extends AnyContext = AnyContext> {
  id: string;
  context: TContext;
  args: z.infer<TContext["schema"]>;
  options: InferContextOptions<TContext>;
  memory: InferContextMemory<TContext>;
  workingMemory: WorkingMemory;
}

export type AnyAgent = Agent<any>;

export interface Handlers {
  onLogStream: (log: Log, done: boolean) => void;
  onThinking: (thought: Thought) => void;
}

/**
 * Represents an agent with various configurations and methods for handling contexts, inputs, outputs, and more.
 * @template Memory - The type of memory used by the agent.
 * @template TContext - The type of context used by the agent.
 */
export interface Agent<TContext extends AnyContext = AnyContext> {
  /**
   * The memory store and vector store used by the agent.
   */
  memory: BaseMemory;

  /**
   * The current context of the agent.
   */
  context?: TContext;

  /**
   * Debugger function for the agent.
   */
  debugger: Debugger;

  /**
   * The container used by the agent.
   */
  container: Container;

  /**
   * The task runner used by the agent.
   */
  taskRunner: TaskRunner;

  /**
   * The primary language model used by the agent.
   */
  model: LanguageModelV1;

  /**
   * The reasoning model used by the agent, if any.
   */
  reasoningModel?: LanguageModelV1;

  /**
   * The vector model used by the agent, if any.
   */
  vectorModel?: LanguageModelV1;

  /**
   * A record of input configurations for the agent.
   */
  inputs: Record<string, InputConfig<any>>;

  /**
   * A record of output configurations for the agent.
   */
  outputs: Record<
    string,
    Omit<Output<any, AgentContext<TContext>, any, any>, "type">
  >;

  /**
   * A record of event schemas for the agent.
   */
  events: Record<string, z.AnyZodObject>;

  /**
   * A record of expert configurations for the agent.
   */
  experts: Record<string, ExpertConfig>;

  /**
   * An array of actions available to the agent.
   */
  actions: Action<any, any, AnyContext, this, Memory<any>>[];

  /**
   * Whether to export training data for episodes
   */
  exportTrainingData?: boolean;

  /**
   * Path to save training data
   */
  trainingDataPath?: string;

  /**
   * Options for trimming working memory
   */
  trimWorkingMemoryOptions?: TrimWorkingMemoryOptions;

  /**
   * Exports all episodes as training data
   * @param filePath Optional path to save the training data
   */
  exportAllTrainingData?: (filePath?: string) => Promise<void>;

  /**
   * Manually trim working memory for a context
   * @param contextId The ID of the context
   * @param options Optional custom trim options
   */
  trimMemory?: (
    contextId: string,
    options?: TrimWorkingMemoryOptions
  ) => Promise<void>;

  /**
   * Emits an event with the provided arguments.
   * @param args - Arguments to pass to the event handler.
   */
  emit: (...args: any[]) => void;

  /**
   * Runs the agent with the provided options.
   * @param opts - Options for running the agent.
   * @returns A promise that resolves to an array of logs.
   */
  run: <TContext extends AnyContext>(opts: {
    context: TContext;
    args: z.infer<TContext["schema"]>;
    model?: LanguageModelV1;
    outputs?: Record<
      string,
      Omit<Output<any, AgentContext<TContext>, any, any>, "type">
    >;
    handlers?: Partial<Handlers>;
    abortSignal?: AbortSignal;
  }) => Promise<Log[]>;

  /**
   * Sends an input to the agent with the provided options.
   * @param opts - Options for sending input to the agent.
   * @returns A promise that resolves to an array of logs.
   */
  send: <SContext extends AnyContext>(opts: {
    context: SContext;
    args: z.infer<NonNullable<SContext["schema"]>>;
    input: { type: string; data: any };
    model?: LanguageModelV1;
    outputs?: Record<
      string,
      Omit<Output<any, AgentContext<SContext>, any, any>, "type">
    >;
    handlers?: Partial<Handlers>;
    abortSignal?: AbortSignal;
  }) => Promise<Log[]>;

  /**
   * Evaluates the provided context.
   * @param ctx - The context to evaluate.
   * @returns A promise that resolves when evaluation is complete.
   */
  evaluator: (ctx: AgentContext<TContext>) => Promise<void>;

  /**
   * Starts the agent with the provided arguments.
   * @param args - Arguments to pass to the agent on start.
   * @returns A promise that resolves to the agent instance.
   */
  start(args?: z.infer<TContext["schema"]>): Promise<this>;

  /**
   * Stops the agent.
   * @returns A promise that resolves when the agent is stopped.
   */
  stop(): Promise<void>;

  /**
   * Retrieves the contexts managed by the agent.
   * @returns A promise that resolves to an array of context objects.
   */
  getContexts(): Promise<{ id: string; type: string; args?: any }[]>;

  /**
   * Retrieves the ID for a given context and arguments.
   * @param params - Parameters for retrieving the context ID.
   * @returns The context ID.
   */
  getContextId<TContext extends AnyContext>(params: {
    context: TContext;
    args: z.infer<NonNullable<TContext["schema"]>>;
  }): string;

  /**
   * Retrieves the state of a given context and arguments.
   * @param params - Parameters for retrieving the context state.
   * @returns A promise that resolves to the context state.
   */
  getContext<TContext extends AnyContext>(params: {
    context: TContext;
    args: z.infer<NonNullable<TContext["schema"]>>;
  }): Promise<ContextState<TContext>>;

  // getContextById<TContext extends AnyContext>(params: {
  //   context: TContext;
  //   id: string;
  // }): Promise<ContextState<TContext>>;

  /**
   * Retrieves the working memory for a given context ID.
   * @param contextId - The ID of the context.
   * @returns A promise that resolves to the working memory.
   */
  getWorkingMemory(contextId: string): Promise<WorkingMemory>;
}

export type Debugger = (contextId: string, keys: string[], data: any) => void;

export type Config<TContext extends AnyContext = AnyContext> = Partial<
  Agent<TContext>
> & {
  model: Agent["model"];
  reasoningModel?: Agent["reasoningModel"];
  logger?: LogLevel;
  services?: ServiceProvider[];
  extensions?: Extension<TContext>[];
  /** Whether to export training data for episodes */
  exportTrainingData?: boolean;
  /** Path to save training data */
  trainingDataPath?: string;
  /** Options for trimming working memory */
  trimWorkingMemoryOptions?: TrimWorkingMemoryOptions;
};

/** Options for trimming working memory */
export type TrimWorkingMemoryOptions = {
  thoughts?: number;
  inputs?: number;
  outputs?: number;
  actions?: number;
};

/** Configuration type for inputs without type field */
export type InputConfig<
  Schema extends z.AnyZodObject = z.AnyZodObject,
  TAgent extends AnyAgent = AnyAgent,
> = Omit<Input<Schema, TAgent>, "type">;

/** Configuration type for outputs without type field */
export type OutputConfig<
  Schema extends OutputSchema = OutputSchema,
  Context extends AgentContext<any> = AgentContext<any>,
  Response extends OutputResponse = OutputResponse,
  TAgent extends AnyAgent = AnyAgent,
> = Omit<Output<Schema, Context, Response, TAgent>, "type">;

/** Configuration type for experts without type field */
export type ExpertConfig = Omit<Expert, "type">;

/** Function type for subscription cleanup */
export type Subscription = () => void;

/** Enum defining available log levels */
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4,
}

/** Interface for custom log writers */
export interface LogWriter {
  init(logPath: string): void;
  write(data: string): void;
}

/** Configuration options for logging */
export interface LoggerConfig {
  level: LogLevel;
  enableTimestamp?: boolean;
  enableColors?: boolean;
  logToFile?: boolean;
  logPath?: string;
  logWriter?: LogWriter;
}

/** Structure of a log entry */
export interface LogEntry {
  level: LogLevel;
  timestamp: Date;
  context: string;
  message: string;
  data?: any;
}

/** Results from a research operation */
export interface ResearchResult {
  learnings: string[];
  visitedUrls: string[];
}

/** Configuration for research operations */
export interface ResearchConfig {
  query: string;
  breadth: number;
  depth: number;
  learnings?: string[];
  visitedUrls?: string[];
}

export interface IChain {
  /**
   * A unique identifier for the chain (e.g., "starknet", "ethereum", "solana", etc.)
   */
  chainId: string;

  /**
   * Read (call) a contract or perform a query on this chain.
   * The `call` parameter can be chain-specific data.
   */
  read(call: unknown): Promise<any>;

  /**
   * Write (execute a transaction) on this chain, typically requiring signatures, etc.
   */
  write(call: unknown): Promise<any>;
}
/** Type representing instructions that can be either a single string or array of strings */
export type Instruction = string | string[];

/** Type representing any Context with generic type parameters */
export type AnyContext = Context<any, any, any>;

/**
 * Extracts the Memory type from a Context type
 * @template TContext - The Context type to extract Memory from
 */
export type InferContextMemory<TContext extends AnyContext> =
  TContext extends Context<infer Memory> ? Memory : never;

/**
 * Extracts the Context type from a Context type
 * @template TContext - The Context type to extract Ctx from
 */
export type InferContextOptions<TContext extends AnyContext> =
  TContext extends Context<any, any, infer Options> ? Options : never;

/**
 * Configuration for a context that manages state and behavior
 * @template Memory - Type of memory for this context
 * @template Args - Zod schema type for context arguments
 * @template Ctx - Type of context data
 * @template Exports - Type of exported data
 */

export interface Context<
  Memory = any,
  Args extends z.ZodTypeAny = any,
  Ctx = any,
> {
  /** Unique type identifier for this context */
  type: string;
  /** Zod schema for validating context arguments */
  schema: Args;
  /** Function to generate a unique key from context arguments */
  key?: (args: z.infer<Args>) => string;

  /** Optional description of this context */
  description?:
    | string
    | string[]
    | ((state: ContextState<this>) => string | string[]);

  /** Setup function to initialize context data */
  setup?: (args: z.infer<Args>, agent: AnyAgent) => Promise<Ctx> | Ctx;

  /** Optional instructions for this context */
  instructions?: Instruction | ((state: ContextState<this>) => Instruction);

  /** Optional function to create new memory for this context */
  create?: (state: Omit<ContextState<this>, "memory">) => Memory;

  /** Optional function to load existing memory */
  load?: (state: Omit<ContextState<this>, "memory">) => Promise<Memory>;
  /** Optional function to save memory state */
  save?: (state: ContextState<this>) => Promise<void>;

  /** Optional function to render memory state */
  render?: (state: ContextState<this>) => string | string[];

  model?: LanguageModelV1;

  onStep?: (ctx: AgentContext<this>) => Promise<void>;

  maxSteps?: number;
}

export type ContextState<TContext extends AnyContext = AnyContext> = {
  id: string;
  key: string;
  context: TContext;
  args: z.infer<TContext["schema"]>;
  options: InferContextOptions<TContext>;
  memory: InferContextMemory<TContext>;
};

/** Enum defining roles for different types of handlers
 * @deprecated
 */
export enum HandlerRole {
  /** Handler for processing inputs */
  INPUT = "input",
  /** Handler for processing outputs */
  OUTPUT = "output",
  /** Handler for executing actions */
  ACTION = "action",
}

export type Extension<
  TContext extends AnyContext = AnyContext,
  Contexts extends Record<string, AnyContext> = Record<string, AnyContext>,
> = Pick<
  Config<TContext>,
  "inputs" | "outputs" | "actions" | "services" | "events"
> & {
  name: string;
  install?: (agent: AnyAgent) => Promise<void> | void;
  contexts?: Contexts;
};

export interface Episode {
  id: string;
  timestamp: number;
  observation: string; // Context and setup
  result: string; // Outcomes of actions
  thoughts: string;
  metadata?: {
    success?: boolean;
    tags?: string[];
    [key: string]: any;
  };
}

export interface EpisodicMemory {
  episodes: Episode[];
  index?: number; // For vector store indexing
}
