import { type LanguageModelV1, type Schema } from "ai";
import { z, ZodObject, ZodType, type ZodRawShape } from "zod";
import type { Container } from "./container";
import type { ServiceProvider } from "./serviceProvider";
import type { BaseMemory } from "./memory";
import type { TaskRunner } from "./task";
import type { Logger } from "./logger";

export { type LanguageModelV1, type Schema } from "ai";

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type MaybePromise<T = any> = T | Promise<T>;

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

  keys(base?: string): Promise<string[]>;
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

  runs: RunRef[];

  steps: StepRef[];

  events: EventRef[];
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

export type ActionSchema =
  | ZodRawShape
  | z.AnyZodObject
  | Schema<any>
  | undefined;

export type InferActionArguments<TSchema = undefined> =
  TSchema extends ZodRawShape
    ? z.infer<ZodObject<TSchema>>
    : TSchema extends z.AnyZodObject
      ? z.infer<TSchema>
      : TSchema extends Schema
        ? TSchema["_type"]
        : undefined;

export type ActionContext<
  TContext extends AnyContext = AnyContext,
  AContext extends AnyContext = AnyContext,
  ActionMemory extends Memory<any> = Memory<any>,
> = AgentContext<TContext> & {
  actionMemory: InferMemoryData<ActionMemory>;
  agentMemory: InferContextMemory<AContext> | undefined;
  abortSignal?: AbortSignal;
};

export type ActionCallContext<
  Schema extends ActionSchema = undefined,
  TContext extends AnyContext = AnyContext,
  AContext extends AnyContext = AnyContext,
  ActionMemory extends Memory<any> = Memory<any>,
> = ActionContext<TContext, AContext, ActionMemory> & {
  call: ActionCall<InferActionArguments<Schema>>;
} & ContextStateApi<TContext>;

type InferActionResult<Result> = Result extends ZodRawShape
  ? z.infer<ZodObject<Result>>
  : Result extends ZodType
    ? z.infer<Result>
    : Result extends Schema
      ? Result["_type"]
      : Result;

export type ActionHandler<
  Schema extends ActionSchema = undefined,
  Result = any,
  TContext extends AnyContext = AnyContext,
  TAgent extends AnyAgent = AnyAgent,
  TMemory extends Memory<any> = Memory<any>,
> = Schema extends undefined
  ? (
      ctx: ActionCallContext<
        Schema,
        TContext,
        InferAgentContext<TAgent>,
        TMemory
      >,
      agent: TAgent
    ) => MaybePromise<Result>
  : (
      args: InferActionArguments<Schema>,
      ctx: ActionCallContext<
        Schema,
        TContext,
        InferAgentContext<TAgent>,
        TMemory
      >,
      agent: TAgent
    ) => MaybePromise<Result>;

/**
 * Represents an action that can be executed with typed parameters
 * @template Schema - Zod schema defining parameter types
 * @template Result - Return type of the action
 * @template Context - Context type for the action execution
 */
export interface Action<
  Schema extends ActionSchema = ActionSchema,
  Result = any,
  TError = unknown,
  TContext extends AnyContext = AnyContext,
  TAgent extends AnyAgent = AnyAgent,
  TMemory extends Memory<any> = Memory<any>,
> {
  name: string;
  description?: string;
  instructions?: string;

  schema: Schema;

  memory?: TMemory;
  install?: (agent: TAgent) => Promise<void> | void;

  enabled?: (
    ctx: ActionContext<TContext, InferAgentContext<TAgent>, TMemory>
  ) => boolean;

  handler: ActionHandler<Schema, Result, TContext, TAgent, TMemory>;

  returns?: ActionSchema;

  format?: (result: ActionResult<Result>) => string | string[];
  /** Optional evaluator for this specific action */
  evaluator?: Evaluator<Result, AgentContext<TContext>, TAgent>;

  context?: TContext;

  onSuccess?: (
    result: ActionResult<Result>,
    ctx: ActionCallContext<
      Schema,
      TContext,
      InferAgentContext<TAgent>,
      TMemory
    >,
    agent: TAgent
  ) => Promise<void> | void;

  retry?: boolean | number | ((failureCount: number, error: TError) => boolean);

  onError?: (
    err: TError,
    ctx: ActionCallContext<
      Schema,
      TContext,
      InferAgentContext<TAgent>,
      TMemory
    >,
    agent: TAgent
  ) => MaybePromise<any>;

  queueKey?:
    | string
    | ((
        ctx: ActionCallContext<
          Schema,
          TContext,
          InferAgentContext<TAgent>,
          TMemory
        >
      ) => string);

  examples?: string[];

  parser?: (ref: ActionCall) => InferActionArguments<Schema>;

  callFormat?: "json" | "xml";
}

export type ActionCtxRef = AnyAction & {
  ctxRef: {
    type: string;
    id: string;
    key: string;
  };
};

export type OutputCtxRef = AnyOutput & {
  ctxRef: {
    type: string;
    id: string;
    key: string;
  };
};

export type OutputSchema = z.AnyZodObject | z.ZodString | ZodRawShape;

type InferOutputSchemaParams<Schema extends OutputSchema> =
  Schema extends ZodRawShape
    ? z.infer<ZodObject<Schema>>
    : Schema extends z.AnyZodObject | z.ZodString
      ? z.infer<Schema>
      : never;

export type OutputRefResponse = Pick<OutputRef, "data" | "params"> & {
  processed?: boolean;
};

export type OutputResponse =
  | OutputRefResponse
  | OutputRefResponse[]
  | undefined
  | void;

export type Output<
  Schema extends OutputSchema = OutputSchema,
  Response extends OutputRefResponse = OutputRefResponse,
  TContext extends AnyContext = AnyContext,
  TAgent extends AnyAgent = AnyAgent,
> = {
  type: string;
  description?: string;
  instructions?: string;
  required?: boolean;
  schema?: Schema;
  attributes?: OutputSchema;
  context?: TContext;
  install?: (agent: TAgent) => MaybePromise<void>;
  enabled?: (ctx: AgentContext<TContext>) => boolean;
  handler?: (
    data: InferOutputSchemaParams<Schema>,
    ctx: AgentContext<TContext> & {
      outputRef: OutputRef<InferOutputSchemaParams<Schema>>;
    },
    agent: TAgent
  ) => MaybePromise<Response | Response[]>;
  format?: (res: OutputRef<Response["data"]>) => string | string[] | XMLElement;
  /** Optional evaluator for this specific output */
  evaluator?: Evaluator<OutputResponse, AgentContext<Context>, TAgent>;

  examples?: string[];
};

export type AnyOutput = Output<any, any, any, AnyAgent>;

export type AnyAction = Action<any, any, any, any, AnyAgent, any>;

export type AnyActionWithContext<Ctx extends Context<any, any, any, any, any>> =
  Action<any, any, any, Ctx, AnyAgent, any>;

/**
 * Represents an input handler with validation and subscription capability
 * @template Schema - Zod schema for input parameters
 * @template Context - Context type for input handling
 */
export type Input<
  Schema extends z.AnyZodObject | z.ZodString | z.ZodRawShape =
    | z.AnyZodObject
    | z.ZodString
    | z.ZodRawShape,
  TContext extends AnyContext = AnyContext,
  TAgent extends AnyAgent = AnyAgent,
> = {
  type: string;
  description?: string;
  schema?: Schema;
  context?: TContext;

  install?: (agent: TAgent) => MaybePromise<void>;
  enabled?: (state: AgentContext<TContext>) => Promise<boolean> | boolean;
  handler?: (
    data: InferSchemaArguments<Schema>,
    ctx: AgentContext<TContext>,
    agent: TAgent
  ) => MaybePromise<Pick<InputRef, "params" | "data">>;
  format?: (
    ref: InputRef<InferSchemaArguments<Schema>>
  ) => string | string[] | XMLElement;
  subscribe?: (
    send: <TContext extends AnyContext>(
      context: TContext,
      args: InferSchemaArguments<TContext["schema"]>,
      data: InferSchemaArguments<Schema>
    ) => MaybePromise<void>,
    agent: TAgent
  ) => (() => void) | void | Promise<void | (() => void)>;
};

export type RunRef = {
  id: string;
  ref: "run";
  type: string;
  data: any;
  // metrics: {
  //   duration: number;
  //   steps: number;
  //   inputs: number;
  //   thoughts: number;
  //   calls: number;
  //   results: number;
  //   outputs: number;
  // };
  // metadata: any;
  timestamp: number;
  processed: boolean;
  stopReason?: string;
};

export type StepRef = {
  id: string;
  ref: "step";
  type: string;
  step: number;
  data: {
    prompt?: string;
    response?: string;
  };
  timestamp: number;
  processed: boolean;
};

/** Reference to an input event in the system */
export type InputRef<Data = any> = {
  id: string;
  ref: "input";
  type: string;
  content: any;
  data: Data;
  params?: Record<string, string>;
  timestamp: number;
  processed: boolean;
  formatted?: string | string[] | XMLElement;
};

/** Reference to an output event in the system */
export type OutputRef<Data = any> = {
  id: string;
  ref: "output";
  type: string;
  params?: Record<string, string>;
  content: string;
  data: Data;
  timestamp: number;
  processed: boolean;
  formatted?: string | string[] | XMLElement;
  error?: unknown;
};

/** Represents a call to an action */
export type ActionCall<Data = any> = {
  ref: "action_call";
  id: string;
  name: string;
  content: string;
  data: Data;
  params?: Record<string, string>;
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
  formatted?: string | string[] | XMLElement;
};

/** Represents a thought or reasoning step */
export type Thought = {
  ref: "thought";
  id: string;
  content: string;
  timestamp: number;
  processed: boolean;
};

/** Represents a event */
export type EventRef<Data = any> = {
  ref: "event";
  id: string;
  name: string;
  params?: Record<string, string>;
  data: Data;
  timestamp: number;
  processed: boolean;
  formatted?: string | string[] | XMLElement;
};

export type Log =
  | InputRef
  | OutputRef
  | Thought
  | ActionCall
  | ActionResult
  | EventRef;

export type AnyRef =
  | InputRef
  | OutputRef
  | Thought
  | ActionCall
  | ActionResult
  | EventRef
  | StepRef
  | RunRef;

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
  children?: string | (XMLElement | string)[];
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
 * Converts a dot-separated path into a nested object type
 * @template P - Path string
 * @template V - Value type at the leaf
 */
type PathToObject<
  P extends string,
  V = string,
> = P extends `${infer Key}.${infer Rest}`
  ? { [K in Key]: PathToObject<Rest, V> }
  : { [K in P]: V };

/**
 * Merges a union of paths into a single nested object type
 * @template T - Union of path strings
 * @template V - Value type at the leaf
 */
type UnionToObject<T, V = string> = T extends string
  ? PathToObject<T, V>
  : never;

/**
 * Merges multiple object types into one (handles union overlap)
 */
type Merge<T> = { [K in keyof T]: T[K] extends object ? Merge<T[K]> : T[K] };

type Prettify<T> = T extends object ? { [K in keyof T]: Prettify<T[K]> } : T;
/**
 * Creates a type mapping template variables (including nested paths) to values
 * @template T - Template string type
 * @template V - Value type at the leaf (defaults to string)
 */
export type TemplateVariables<T extends string, V = any> = {
  [K in ExtractTemplateVariables<T>]: any;
};

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
  args: InferSchemaArguments<TContext["schema"]>;
  options: InferContextOptions<TContext>;
  settings: ContextSettings;
  memory: InferContextMemory<TContext>;
  workingMemory: WorkingMemory;
}

export type AnyAgent = Agent<any>;

export interface Handlers {
  onLogStream: (log: AnyRef, done: boolean) => void;
  onThinking: (thought: Thought) => void;
}

export type Registry = {
  contexts: Map<string, AnyContext>;
  actions: Map<string, AnyAction>;
  inputs: Map<string, Input>;
  outputs: Map<string, Output>;
  extensions: Map<string, Extension>;
  prompts: Map<string, string>;
  models: Map<string, LanguageModelV1>;
};

interface AgentDef<TContext extends AnyContext = AnyContext> {
  logger: Logger;

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
  inputs: Record<string, InputConfig<any, AnyContext, Agent<TContext>>>;

  /**
   * A record of output configurations for the agent.
   */
  outputs: Record<string, Omit<Output<any, any, TContext, any>, "type">>;

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
  actions: Action<
    any,
    any,
    unknown,
    AnyContext,
    Agent<TContext>,
    Memory<any>
  >[];

  /**
   * Whether to export training data for episodes
   */
  exportTrainingData?: boolean;

  /**
   * Path to save training data
   */
  trainingDataPath?: string;
}

/**
 * Represents an agent with various configurations and methods for handling contexts, inputs, outputs, and more.
 * @template Memory - The type of memory used by the agent.
 * @template TContext - The type of context used by the agent.
 */
export interface Agent<TContext extends AnyContext = AnyContext>
  extends AgentDef<TContext> {
  registry: Registry;

  isBooted(): boolean;

  /**
   * Exports all episodes as training data
   * @param filePath Optional path to save the training data
   */
  exportAllTrainingData?: (filePath?: string) => Promise<void>;

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
  run: <
    TContext extends AnyContext,
    SubContextRefs extends AnyContext[] = AnyContext[],
  >(opts: {
    context: TContext;
    args: InferSchemaArguments<TContext["schema"]>;
    model?: LanguageModelV1;
    contexts?: ContextRefArray<SubContextRefs>;
    outputs?: Record<string, Omit<Output<any, any, TContext, any>, "type">>;
    actions?: AnyAction[];
    handlers?: Partial<Handlers>;
    abortSignal?: AbortSignal;
    chain?: Log[];
  }) => Promise<AnyRef[]>;

  /**
   * Sends an input to the agent with the provided options.
   * @param opts - Options for sending input to the agent.
   * @returns A promise that resolves to an array of logs.
   */
  send: <
    SContext extends AnyContext,
    SubContextRefs extends AnyContext[] = AnyContext[],
  >(opts: {
    context: SContext;
    args: InferSchemaArguments<SContext["schema"]>;
    input: { type: string; data: any };
    model?: LanguageModelV1;
    contexts?: ContextRefArray<SubContextRefs>;
    outputs?: Record<string, Omit<Output<any, any, SContext, any>, "type">>;
    actions?: AnyAction[];
    handlers?: Partial<Handlers>;
    abortSignal?: AbortSignal;
    chain?: Log[];
  }) => Promise<AnyRef[]>;

  /**
   * Evaluates the provided context.
   * @param ctx - The context to evaluate.
   * @returns A promise that resolves when evaluation is complete.
   */
  evaluator<SContext extends AnyContext>(
    ctx: AgentContext<SContext>
  ): Promise<void>;

  /**
   * Starts the agent with the provided arguments.
   * @param args - Arguments to pass to the agent on start.
   * @returns A promise that resolves to the agent instance.
   */
  start(args?: InferSchemaArguments<TContext["schema"]>): Promise<this>;

  /**
   * Stops the agent.
   * @returns A promise that resolves when the agent is stopped.
   */
  stop(): Promise<void>;

  /**
   * Retrieves the contexts managed by the agent.
   * @returns A promise that resolves to an array of context objects.
   */
  getContexts(): Promise<
    { id: string; type: string; args?: any; settings?: ContextSettings }[]
  >;

  /**
   * Retrieves the ID for a given context and arguments.
   * @param params - Parameters for retrieving the context ID.
   * @returns The context ID.
   */
  getContextId<TContext extends AnyContext = AnyContext>(params: {
    context: TContext;
    args: InferSchemaArguments<TContext["schema"]>;
  }): string;

  getAgentContext(): Promise<ContextState<TContext> | undefined>;

  /**
   * Retrieves the state of a given context and arguments.
   * @param params - Parameters for retrieving the context state.
   * @returns A promise that resolves to the context state.
   */
  getContext<TContext extends AnyContext>(params: {
    context: TContext;
    args: InferSchemaArguments<TContext["schema"]>;
  }): Promise<ContextState<TContext>>;

  loadContext<TContext extends AnyContext>(params: {
    context: TContext;
    args: InferSchemaArguments<TContext["schema"]>;
  }): Promise<ContextState<TContext> | null>;

  saveContext(
    state: ContextState<AnyContext>,
    workingMemory?: WorkingMemory
  ): Promise<boolean>;

  getContextById<TContext extends AnyContext>(
    id: string
  ): Promise<ContextState<TContext> | null>;

  /**
   * Retrieves the working memory for a given context ID.
   * @param contextId - The ID of the context.
   * @returns A promise that resolves to the working memory.
   */
  getWorkingMemory(contextId: string): Promise<WorkingMemory>;

  deleteContext(contextId: string): Promise<void>;

  subscribeContext(
    contextId: string,
    handler: (log: AnyRef, done: boolean) => void
  ): () => void;
}

export type Debugger = (contextId: string, keys: string[], data: any) => void;

export type Config<TContext extends AnyContext = AnyContext> = Partial<
  AgentDef<TContext>
> & {
  model: Agent["model"];
  reasoningModel?: Agent["reasoningModel"];
  logLevel?: LogLevel;
  contexts?: AnyContext[];
  services?: ServiceProvider[];
  extensions?: Extension<TContext>[];
  /** Whether to export training data for episodes */
  exportTrainingData?: boolean;
  /** Path to save training data */
  trainingDataPath?: string;
};

/** Configuration type for inputs without type field */
export type InputConfig<
  Schema extends z.AnyZodObject | z.ZodString | z.ZodRawShape =
    | z.AnyZodObject
    | z.ZodString
    | z.ZodRawShape,
  TContext extends AnyContext = AnyContext,
  TAgent extends AnyAgent = AnyAgent,
> = Omit<Input<Schema, TContext, TAgent>, "type">;

/** Configuration type for outputs without type field */
export type OutputConfig<
  Schema extends OutputSchema = OutputSchema,
  Response extends OutputRefResponse = OutputRefResponse,
  TContext extends AnyContext = AnyContext,
  TAgent extends AnyAgent = AnyAgent,
> = Omit<Output<Schema, Response, TContext, TAgent>, "type">;

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
export type AnyContext = Context<any, any, any, any, any>;

/**
 * Extracts the Memory type from a Context type
 * @template TContext - The Context type to extract Memory from
 */
export type InferContextMemory<TContext extends AnyContext> =
  TContext extends Context<infer TMemory, any, any, any, any> ? TMemory : never;

/**
 * Extracts the Context type from a Context type
 * @template TContext - The Context type to extract Ctx from
 */
export type InferContextOptions<TContext extends AnyContext> =
  TContext extends Context<any, any, infer Options, any, any> ? Options : never;

/**
 * Configuration for a context that manages state and behavior
 * @template Memory - Type of memory for this context
 * @template Args - Zod schema type for context arguments
 * @template Ctx - Type of context data
 * @template Exports - Type of exported data
 */

export type InferSchemaArguments<
  Schema extends z.ZodTypeAny | ZodRawShape | undefined = z.ZodTypeAny,
> = Schema extends ZodRawShape
  ? z.infer<ZodObject<Schema>>
  : Schema extends z.ZodTypeAny
    ? z.infer<Schema>
    : never;

type ActionArray<T extends AnyAction[]> = {
  [K in keyof T]: T[K];
};

type MergeArrays<T extends Array<any>, C extends Array<any>> = T & C;

interface ContextConfigApi<
  TMemory = any,
  Schema extends z.ZodTypeAny | ZodRawShape = z.ZodTypeAny,
  Ctx = any,
  Actions extends AnyAction[] = AnyAction[],
  Events extends Record<string, z.ZodTypeAny | ZodRawShape> = Record<
    string,
    z.ZodTypeAny | ZodRawShape
  >,
> {
  setActions<
    TActions extends AnyActionWithContext<
      Context<TMemory, Schema, Ctx, any, Events>
    >[],
  >(
    actions: TActions
  ): Context<TMemory, Schema, Ctx, TActions, Events>;
  setInputs<
    TSchemas extends Record<
      string,
      z.AnyZodObject | z.ZodString | z.ZodRawShape
    >,
  >(inputs: {
    [K in keyof TSchemas]: InputConfig<
      TSchemas[K],
      Context<TMemory, Schema, Ctx, Actions, Events>,
      AnyAgent
    >;
  }): Context<TMemory, Schema, Ctx, Actions, Events>;
  setOutputs<
    TSchemas extends Record<
      string,
      z.AnyZodObject | z.ZodString | z.ZodRawShape
    >,
  >(outputs: {
    [K in keyof TSchemas]: OutputConfig<
      TSchemas[K],
      any,
      Context<TMemory, Schema, Ctx, Actions, Events>,
      AnyAgent
    >;
  }): Context<TMemory, Schema, Ctx, Actions, Events>;
}

export type EventDef<Schema extends z.ZodTypeAny | ZodRawShape = z.ZodTypeAny> =
  {
    name: string;
    schema: Schema;
    // description?: string;
  };

export type ContextsEventsRecord<T extends Record<string, EventDef>> = {
  [K in keyof T]: T[K]["schema"];
};

export type ContextConfig<
  TMemory = any,
  Args extends z.ZodTypeAny | ZodRawShape = any,
  Ctx = any,
  Actions extends AnyAction[] = AnyAction[],
  Events extends Record<string, z.ZodTypeAny | z.ZodRawShape> = Record<
    string,
    z.ZodTypeAny | z.ZodRawShape
  >,
> = Optional<
  Omit<Context<TMemory, Args, Ctx, Actions, Events>, keyof ContextConfigApi>,
  "actions" | "events" | "inputs" | "outputs"
>;

export interface Context<
  TMemory = any,
  Schema extends z.ZodTypeAny | ZodRawShape = z.ZodTypeAny,
  Ctx = any,
  Actions extends AnyAction[] = AnyAction[],
  Events extends Record<string, z.ZodTypeAny | ZodRawShape> = Record<
    string,
    z.ZodTypeAny | ZodRawShape
  >,
> extends ContextConfigApi<TMemory, Schema, Ctx, Actions, Events> {
  /** Unique type identifier for this context */
  type: string;
  /** Zod schema for validating context arguments */
  schema: Schema;
  /** Function to generate a unique key from context arguments */
  key?: (args: InferSchemaArguments<Schema>) => string;

  /** Setup function to initialize context data */
  setup?: (
    args: InferSchemaArguments<Schema>,
    settings: ContextSettings,
    agent: AnyAgent
  ) => Promise<Ctx> | Ctx;

  /** Optional function to create new memory for this context */
  create?: (
    params: {
      id: string;
      key: string;
      args: InferSchemaArguments<Schema>;
      options: Ctx;
      settings: ContextSettings;
    },
    agent: AnyAgent
  ) => TMemory | Promise<TMemory>;

  /** Optional instructions for this context */
  instructions?: Instruction | ((state: ContextState<this>) => Instruction);

  /** Optional description of this context */
  description?:
    | string
    | string[]
    | ((state: ContextState<this>) => string | string[]);

  /** Optional function to load existing memory */
  load?: (state: Omit<ContextState<this>, "memory">) => Promise<TMemory>;
  /** Optional function to save memory state */
  save?: (state: ContextState<this>) => Promise<void>;

  /** Optional function to render memory state */
  render?: (
    state: ContextState<this>
  ) => string | string[] | XMLElement | XMLElement[] | (string | XMLElement)[];

  model?: LanguageModelV1;

  onRun?: (ctx: AgentContext<this>, agent: AnyAgent) => Promise<void>;

  onStep?: (ctx: AgentContext<this>, agent: AnyAgent) => Promise<void>;

  shouldContinue?: (ctx: AgentContext<this>) => boolean;

  onError?: (
    error: unknown,
    ctx: AgentContext<this>,
    agent: AnyAgent
  ) => Promise<void>;

  loader?: (state: ContextState<this>, agent: AnyAgent) => Promise<void>;

  maxSteps?: number;

  maxWorkingMemorySize?: number;

  actions:
    | Actions
    | ((state: ContextState<this>) => Actions | Promise<Actions>);

  events: Events;

  /**
   * A record of input configurations for the context.
   */
  inputs: Record<string, InputConfig<any, any, AnyAgent>>;

  /**
   * A record of output configurations for the context.
   */
  outputs: Record<string, Omit<Output<any, any, AnyContext, any>, "type">>;
}

export type ContextSettings = {
  model?: LanguageModelV1;
  maxSteps?: number;
  maxWorkingMemorySize?: number;
};

export type ContextRef<TContext extends AnyContext = AnyContext> = {
  context: TContext;
  args: InferSchemaArguments<TContext["schema"]>;
};

export type ContextsRefRecord<T extends Record<string, AnyContext>> = {
  [K in keyof T]: ContextRef<T[K]>;
};

export type ContextRefArray<T extends AnyContext[] = AnyContext[]> = {
  [K in keyof T]: ContextRef<T[K]>;
};

type InferContextEvents<TContext extends AnyContext> =
  TContext extends Context<any, any, any, any, infer Events> ? Events : never;

type ContextEventEmitter<TContext extends AnyContext> = <
  T extends keyof InferContextEvents<TContext>,
>(
  event: T,
  args: InferSchema<InferContextEvents<TContext>[T]>,
  options?: { processed?: boolean }
) => void;

//wip
export type ContextStateApi<TContext extends AnyContext> = {
  emit: ContextEventEmitter<TContext>;
  push: (log: Log) => void;
};

export type ContextState<TContext extends AnyContext = AnyContext> = {
  id: string;
  key: string;
  context: TContext;
  args: InferSchemaArguments<TContext["schema"]>;
  options: InferContextOptions<TContext>;
  memory: InferContextMemory<TContext>;
  settings: ContextSettings;
  contexts: string[];
};

export type Extension<
  TContext extends AnyContext = AnyContext,
  Contexts extends Record<string, AnyContext> = Record<string, AnyContext>,
  Inputs extends Record<string, InputConfig<any, any>> = Record<
    string,
    InputConfig<any, any>
  >,
> = Pick<
  Config<TContext>,
  "inputs" | "outputs" | "actions" | "services" | "events"
> & {
  name: string;
  install?: (agent: AnyAgent) => Promise<void> | void;
  contexts?: Contexts;
  inputs: Inputs;
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
