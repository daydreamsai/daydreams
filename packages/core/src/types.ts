import { type LanguageModel, type Schema } from "ai";
import { z, ZodObject, ZodType, type ZodRawShape } from "zod/v4";
import type { Container } from "./container";
import type { ServiceProvider } from "./serviceProvider";
import type { TaskRunner } from "./task";
import type { Logger } from "./logger";
import type { RequestContext, RequestTrackingConfig } from "./tracking";
import type { RequestTracker } from "./tracking/tracker";
import type {
  EpisodeHooks,
  ActionState,
  InferActionState,
  MemorySystem,
  WorkingMemory,
} from "./memory";
import type { ExportManager } from "./memory/exporters";

// Export memory types
export * from "./memory";

/**
 * Makes specified keys optional in a type
 * @template T - The type to modify
 * @template K - The keys to make optional
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Represents a value that can be a promise or a direct value
 * @template T - The type of the value
 */
export type MaybePromise<T = any> = T | Promise<T>;

/**
 * Infers the schema type from an object with an optional schema property
 * @template T - The object type that may have a schema
 */
export type InferSchema<T> = T extends {
  schema?: infer S extends z.ZodTypeAny;
}
  ? z.infer<S>
  : unknown;

/**
 * Extracts the context type from an Agent type
 * @template TAgent - The agent type to extract context from
 */
export type InferAgentContext<TAgent extends AnyAgent> = TAgent extends Agent<
  infer Content
>
  ? Content
  : never;

/**
 * Extracts the memory type from an Agent by inferring its context
 * @template TAgent - The agent type to extract memory from
 */
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
  TAgent extends AnyAgent = AnyAgent
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

/**
 * Schema type for action parameters - can be Zod raw shape, ZodObject, or AI SDK Schema
 */
export type ActionSchema = ZodRawShape | z.ZodObject | Schema<any> | undefined;

/**
 * Infers the argument type from an action schema
 * @template TSchema - The schema type to infer from
 */
export type InferActionArguments<TSchema = undefined> =
  TSchema extends ZodRawShape
    ? z.infer<ZodObject<TSchema>>
    : TSchema extends z.ZodObject
    ? z.infer<TSchema>
    : TSchema extends Schema
    ? TSchema["_type"]
    : undefined;

export interface ActionContext<
  TContext extends AnyContext = AnyContext,
  AContext extends AnyContext = AnyContext,
  ActionMemory extends ActionState = ActionState
> extends AgentContext<TContext> {
  actionMemory: InferActionState<ActionMemory>;
  agentMemory: InferContextMemory<AContext> | undefined;
  abortSignal?: AbortSignal;
}

export interface ActionCallContext<
  Schema extends ActionSchema = undefined,
  TContext extends AnyContext = AnyContext,
  AContext extends AnyContext = AnyContext,
  ActionMemory extends ActionState = ActionState
> extends ActionContext<TContext, AContext, ActionMemory>,
    ContextStateApi<TContext> {
  call: ActionCall<InferActionArguments<Schema>>;
}

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
  TMemory extends ActionState = ActionState
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
  TState extends ActionState = ActionState
> {
  name: string;
  description?: string;
  instructions?: string;

  schema: Schema;

  attributes?: ActionSchema;

  actionState?: TState;

  install?: (agent: TAgent) => Promise<void> | void;

  enabled?: (
    ctx: ActionContext<TContext, InferAgentContext<TAgent>, TState>
  ) => boolean;

  handler: ActionHandler<Schema, Result, TContext, TAgent, TState>;

  returns?: ActionSchema;

  format?: (result: ActionResult<Result>) => string | string[];
  /** Optional evaluator for this specific action */
  evaluator?: Evaluator<Result, AgentContext<TContext>, TAgent>;

  context?: TContext;

  onSuccess?: (
    result: ActionResult<Result>,
    ctx: ActionCallContext<Schema, TContext, InferAgentContext<TAgent>, TState>,
    agent: TAgent
  ) => Promise<void> | void;

  retry?: boolean | number | ((failureCount: number, error: TError) => boolean);

  onError?: (
    err: TError,
    ctx: ActionCallContext<Schema, TContext, InferAgentContext<TAgent>, TState>,
    agent: TAgent
  ) => MaybePromise<any>;

  queueKey?:
    | string
    | ((
        ctx: ActionCallContext<
          Schema,
          TContext,
          InferAgentContext<TAgent>,
          TState
        >
      ) => string);

  examples?: string[];

  parser?: (ref: ActionCall) => InferActionArguments<Schema>;

  callFormat?: "json" | "xml";

  templateResolver?:
    | boolean
    | ((
        key: string,
        path: string,
        ctx: ActionCallContext<
          Schema,
          TContext,
          InferAgentContext<TAgent>,
          TState
        >
      ) => MaybePromise<string>);
}

/**
 * Action with context reference information
 */
export type ActionCtxRef = AnyAction & {
  ctxRef: {
    type: string;
    id: string;
    key?: string;
  };
};

/**
 * Output with context reference information
 */
export type OutputCtxRef = AnyOutput & {
  ctxRef: {
    type: string;
    id: string;
    key?: string;
  };
};

/**
 * Schema type for output parameters - can be Zod type, raw shape, or unknown
 */
export type OutputSchema = z.ZodTypeAny | ZodRawShape | unknown;

/**
 * Infers the parameter type from an output schema
 * @template Schema - The output schema type
 */
type InferOutputSchemaParams<Schema extends OutputSchema> =
  Schema extends ZodRawShape
    ? z.infer<ZodObject<Schema>>
    : Schema extends z.ZodTypeAny
    ? z.infer<Schema>
    : unknown;

/**
 * Response type for output references
 */
export type OutputRefResponse = Pick<OutputRef, "data" | "params"> & {
  processed?: boolean;
};

/**
 * Union type for all possible output response types
 */
export type OutputResponse =
  | OutputRefResponse
  | OutputRefResponse[]
  | undefined
  | void;

export type Output<
  Schema extends OutputSchema = OutputSchema,
  Response extends OutputRefResponse = OutputRefResponse,
  TContext extends AnyContext = AnyContext,
  TAgent extends AnyAgent = AnyAgent
> = {
  type: string;
  description?: string;
  instructions?: string;
  required?: boolean;
  schema?: Schema;
  attributes?: OutputSchema;
  context?: TContext;
  install?: (agent: TAgent) => MaybePromise<void>;
  enabled?: (ctx: ContextState<TContext>) => boolean;
  handler?: (
    data: InferOutputSchemaParams<Schema>,
    ctx: ContextState<TContext> & {
      outputRef: OutputRef<InferOutputSchemaParams<Schema>>;
    },
    agent: TAgent
  ) => MaybePromise<Response | Response[]>;
  format?: (res: OutputRef<Response["data"]>) => string | string[] | XMLElement;
  /** Optional evaluator for this specific output */
  evaluator?: Evaluator<OutputResponse, AgentContext<Context>, TAgent>;

  examples?: string[];
};

/**
 * Type alias for any Output with generic parameters
 */
export type AnyOutput = Output<any, any, any, AnyAgent>;

/**
 * Type alias for any Action with generic parameters
 */
export type AnyAction = Action<any, any, any, any, AnyAgent, ActionState>;

/**
 * Type alias for an Action with a specific Context type
 * @template Ctx - The context type to constrain the action to
 */
export type AnyActionWithContext<Ctx extends Context<any, any, any, any, any>> =
  Action<any, any, any, Ctx, AnyAgent, ActionState>;

/**
 * Represents an input handler with validation and subscription capability
 * @template Schema - Zod schema for input parameters
 * @template Context - Context type for input handling
 */
export type Input<
  Schema extends z.ZodObject | z.ZodString | z.ZodRawShape =
    | z.ZodObject
    | z.ZodString
    | z.ZodRawShape,
  TContext extends AnyContext = AnyContext,
  TAgent extends AnyAgent = AnyAgent
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

export interface ThoughtRef {
  id: string;
  ref: "thought";
  content: string;
  processed: boolean;
  timestamp: number;
}

/**
 * Represents a thought or reasoning step
 */
export interface Thought {
  id: string;
  content: string;
  timestamp: number;
  confidence?: number;
  metadata?: Record<string, any>;
}

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

/**
 * Union type representing all possible log entries in the system
 */
export type Log =
  | InputRef
  | OutputRef
  | ThoughtRef
  | ActionCall
  | ActionResult
  | EventRef;

/**
 * Union type representing all possible reference types in the system
 */
export type AnyRef =
  | InputRef
  | OutputRef
  | ThoughtRef
  | ActionCall
  | ActionResult
  | EventRef
  | StepRef
  | RunRef;

/** Represents an XML element structure */
export type XMLElement = {
  tag: string;
  params?: Record<string, string>;
  children?: string | (XMLElement | string)[];
};

/**
 * Utility type to flatten and preserve type information for better TypeScript inference
 * @template type - The type to make pretty
 */
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
 * Creates a type mapping template variables (including nested paths) to values
 * @template T - Template string type
 * @template V - Value type at the leaf (defaults to string)
 */
export type TemplateVariables<T extends string, V = any> = {
  [K in ExtractTemplateVariables<T>]: any;
};

/**
 * Represents an expert system with specialized knowledge and capabilities
 */
export type Expert = {
  /** Unique identifier for the expert type */
  type: string;
  /** Description of the expert's domain and capabilities */
  description: string;
  /** Detailed instructions for the expert's behavior */
  instructions: string;
  /** Optional language model specific to this expert */
  model?: LanguageModel;
  /** Optional actions available to this expert */
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
  requestContext?: RequestContext;
}

/**
 * Type alias for any Agent with generic context type
 */
export type AnyAgent = Agent<any>;

/**
 * Event handlers for agent operations
 */
export interface Handlers {
  /** Handler for streaming log events */
  onLogStream: (log: AnyRef, done: boolean) => void;
  /** Handler for thinking/reasoning events */
  onThinking: (thought: ThoughtRef) => void;
}

/**
 * Central registry for all agent components and resources
 */
export type Registry = {
  /** Map of registered context types */
  contexts: Map<string, AnyContext>;
  /** Map of registered action types */
  actions: Map<string, AnyAction>;
  /** Map of registered input types */
  inputs: Map<string, Input>;
  /** Map of registered output types */
  outputs: Map<string, Output>;
  /** Map of registered extensions */
  extensions: Map<string, Extension>;
  /** Map of registered prompt templates */
  prompts: Map<string, string>;
  /** Map of registered language models */
  models: Map<string, LanguageModel>;
};

interface AgentDef<TContext extends AnyContext = AnyContext> {
  logger: Logger;

  /**
   * The memory store and vector store used by the agent.
   */
  memory: MemorySystem;

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
   * Request tracker for monitoring model usage and performance.
   */
  requestTracker?: RequestTracker;

  /**
   * Configuration for request tracking.
   */
  requestTrackingConfig?: Partial<RequestTrackingConfig>;

  /**
   * The primary language model used by the agent.
   */
  model?: LanguageModel;

  /**
   * The reasoning model used by the agent, if any.
   */
  reasoningModel?: LanguageModel;

  /**
   * The vector model used by the agent, if any.
   */
  vectorModel?: LanguageModel;

  /**
   * Model settings for the agent.
   */
  modelSettings?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    topK?: number;
    stopSequences?: string[];
    providerOptions?: Record<string, any>;
    [key: string]: any;
  };

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
  events: Record<string, z.ZodObject>;

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
    ActionState<any>
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
 * Represents a chunk of streaming log data
 */
export type LogChunk =
  | { type: "log"; log: AnyRef; done: boolean }
  | { type: "content"; id: string; content: string }
  | { type: "data"; id: string; data: any }
  | { type: "done"; id: string };

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
   * Emits an event with the provided arguments.
   * @param args - Arguments to pass to the event handler.
   */
  emit: (...args: any[]) => void;

  /**
   * Export manager for episodes
   */
  exports?: ExportManager;

  /**
   * Runs the agent with the provided options.
   * @param opts - Options for running the agent.
   * @returns A promise that resolves to an array of logs.
   */
  run: <
    TContext extends AnyContext,
    SubContextRefs extends AnyContext[] = AnyContext[]
  >(opts: {
    context: TContext;
    args: InferSchemaArguments<TContext["schema"]>;
    model?: LanguageModel;
    modelSettings?: {
      temperature?: number;
      maxTokens?: number;
      topP?: number;
      topK?: number;
      stopSequences?: string[];
      providerOptions?: Record<string, any>;
      [key: string]: any;
    };
    contexts?: ContextRefArray<SubContextRefs>;
    outputs?: Record<string, Omit<Output<any, any, TContext, any>, "type">>;
    actions?: AnyAction[];
    handlers?: Partial<Handlers>;
    abortSignal?: AbortSignal;
    chain?: Log[];
    requestContext?: RequestContext;
  }) => Promise<AnyRef[]>;

  /**
   * Sends an input to the agent with the provided options.
   * @param opts - Options for sending input to the agent.
   * @returns A promise that resolves to an array of logs.
   */
  send: <
    SContext extends AnyContext,
    SubContextRefs extends AnyContext[] = AnyContext[]
  >(opts: {
    context: SContext;
    args: InferSchemaArguments<SContext["schema"]>;
    input: { type: string; data: any };
    model?: LanguageModel;
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

  __subscribeChunk(
    contextId: string,
    handler: (log: LogChunk) => void
  ): () => void;
}

/**
 * Function type for debugging agent operations
 * @param contextId - The ID of the context being debugged
 * @param keys - Array of keys identifying the debug point
 * @param data - Debug data to be logged
 */
export type Debugger = (contextId: string, keys: string[], data: any) => void;

export type Config<TContext extends AnyContext = AnyContext> = Partial<
  AgentDef<TContext>
> & {
  model?: Agent["model"];
  reasoningModel?: Agent["reasoningModel"];
  modelSettings?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    topK?: number;
    stopSequences?: string[];
    providerOptions?: Record<string, any>;
    [key: string]: any;
  };
  logLevel?: LogLevel;
  contexts?: AnyContext[];
  services?: ServiceProvider[];
  extensions?: Extension<TContext>[];
  /** Whether to export training data for episodes */
  exportTrainingData?: boolean;
  /** Path to save training data */
  trainingDataPath?: string;
  streaming?: boolean;
};

/** Configuration type for inputs without type field */
export type InputConfig<
  Schema extends z.ZodObject | z.ZodString | z.ZodRawShape =
    | z.ZodObject
    | z.ZodString
    | z.ZodRawShape,
  TContext extends AnyContext = AnyContext,
  TAgent extends AnyAgent = AnyAgent
> = Omit<Input<Schema, TContext, TAgent>, "type">;

/** Configuration type for outputs without type field */
export type OutputConfig<
  Schema extends OutputSchema = OutputSchema,
  Response extends OutputRefResponse = OutputRefResponse,
  TContext extends AnyContext = AnyContext,
  TAgent extends AnyAgent = AnyAgent
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

/**
 * Infers the argument type from a schema definition
 * @template Schema - The schema to infer arguments from
 */
export type InferSchemaArguments<Schema = undefined> =
  Schema extends ZodRawShape
    ? z.infer<ZodObject<Schema>>
    : Schema extends z.ZodTypeAny
    ? z.infer<Schema>
    : never;

interface ContextConfigApi<
  TMemory = any,
  Schema extends z.ZodTypeAny | ZodRawShape = z.ZodTypeAny,
  Ctx = any,
  Actions extends AnyAction[] = AnyAction[],
  Events extends Record<string, z.ZodTypeAny | ZodRawShape> = Record<
    string,
    z.ZodTypeAny | ZodRawShape
  >
> {
  setActions<
    TActions extends AnyActionWithContext<
      Context<TMemory, Schema, Ctx, any, Events>
    >[]
  >(
    actions: TActions
  ): Context<TMemory, Schema, Ctx, TActions, Events>;
  setInputs<
    TSchemas extends Record<string, z.ZodObject | z.ZodString | z.ZodRawShape>
  >(inputs: {
    [K in keyof TSchemas]: InputConfig<
      TSchemas[K],
      Context<TMemory, Schema, Ctx, Actions, Events>,
      AnyAgent
    >;
  }): Context<TMemory, Schema, Ctx, Actions, Events>;
  setOutputs<
    TSchemas extends Record<string, z.ZodObject | z.ZodString | z.ZodRawShape>
  >(outputs: {
    [K in keyof TSchemas]: OutputConfig<
      TSchemas[K],
      any,
      Context<TMemory, Schema, Ctx, Actions, Events>,
      AnyAgent
    >;
  }): Context<TMemory, Schema, Ctx, Actions, Events>;

  use<Refs extends AnyContext[]>(
    composer: ContextComposer<
      Context<TMemory, Schema, Ctx, Actions, Events>,
      Refs
    >
  ): Context<TMemory, Schema, Ctx, Actions, Events>;
}

/**
 * Definition for an event type
 * @template Schema - The schema type for event data
 */
export type EventDef<Schema extends z.ZodTypeAny | ZodRawShape = z.ZodTypeAny> =
  {
    /** Name of the event */
    name: string;
    /** Schema for validating event data */
    schema: Schema;
  };

/**
 * Maps event definitions to their schema types
 * @template T - Record of event definitions
 */
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
  >
> = Optional<
  Omit<Context<TMemory, Args, Ctx, Actions, Events>, keyof ContextConfigApi>,
  "actions" | "events" | "inputs" | "outputs"
>;

type ContextComposer<
  TContext extends AnyContext,
  T extends AnyContext[] = AnyContext[]
> = (state: ContextState<TContext>) => ContextRefArray<T>;

type BaseContextComposer<TContext extends AnyContext> = (
  state: ContextState<TContext>
) => ContextRef[];

/**
 * Type that can be either a static value or a function that computes the value from context
 * @template Result - The type of the resolved value
 * @template Ctx - The context type passed to the resolver function
 */
export type Resolver<Result, Ctx> = Result | ((ctx: Ctx) => Result);

export interface Context<
  TMemory = any,
  Schema extends z.ZodTypeAny | ZodRawShape = z.ZodTypeAny,
  Ctx = any,
  Actions extends AnyAction[] = AnyAction[],
  Events extends Record<string, z.ZodTypeAny | ZodRawShape> = Record<
    string,
    z.ZodTypeAny | ZodRawShape
  >
> extends ContextConfigApi<TMemory, Schema, Ctx, Actions, Events> {
  /** Unique type identifier for this context */
  type: string;
  /** Zod schema for validating context arguments */
  schema?: Schema;
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
      key?: string;
      args: InferSchemaArguments<Schema>;
      options: Ctx;
      settings: ContextSettings;
    },
    agent: AnyAgent
  ) => TMemory | Promise<TMemory>;

  /** Optional instructions for this context */
  instructions?: Resolver<Instruction, ContextState<this>>;

  /** Optional description of this context */
  description?: Resolver<string | string[], ContextState<this>>;

  /** Optional function to load existing memory */
  load?: (
    id: string,
    params: { options: Ctx; settings: ContextSettings }
  ) => Promise<TMemory | null>;
  /** Optional function to save memory state */
  save?: (state: ContextState<this>) => Promise<void>;

  /** Optional function to render memory state */
  render?: (
    state: ContextState<this>
  ) => string | string[] | XMLElement | XMLElement[] | (string | XMLElement)[];

  model?: LanguageModel;

  modelSettings?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    topK?: number;
    stopSequences?: string[];
    providerOptions?: Record<string, any>;
    [key: string]: any;
  };

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

  /** Episode detection and creation hooks for this context */
  episodeHooks?: EpisodeHooks<this>;

  actions?: Resolver<Action[], ContextState<this>>;

  events?: Resolver<Events, ContextState<this>>;

  /**
   * A record of input configurations for the context.
   */
  inputs?: Resolver<
    Record<string, InputConfig<any, any, AnyAgent>>,
    ContextState<this>
  >;

  /**
   * A record of output configurations for the context.
   */
  outputs?: Resolver<
    Record<string, Omit<Output<any, any, AnyContext, any>, "type">>,
    ContextState<this>
  >;

  __composers?: BaseContextComposer<this>[];

  __templateResolvers?: Record<
    string,
    TemplateResolver<AgentContext<this> & ContextStateApi<this>>
  >;
}

/**
 * Configuration settings for a context
 */
export type ContextSettings = {
  /** Language model to use for this context */
  model?: LanguageModel;
  /** Maximum number of execution steps */
  maxSteps?: number;
  /** Maximum size of working memory */
  maxWorkingMemorySize?: number;
  /** Model-specific settings */
  modelSettings?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    topK?: number;
    stopSequences?: string[];
    providerOptions?: Record<string, any>;
    [key: string]: any;
  };
};

/**
 * Reference to a context with its arguments
 * @template TContext - The context type
 */
export type ContextRef<TContext extends AnyContext = AnyContext> = {
  context: TContext;
  args: InferSchemaArguments<TContext["schema"]>;
};

/**
 * Record of context references mapped by key
 * @template T - Record type mapping keys to context types
 */
export type ContextsRefRecord<T extends Record<string, AnyContext>> = {
  [K in keyof T]: ContextRef<T[K]>;
};

/**
 * Array of context references
 * @template T - Array of context types
 */
export type ContextRefArray<T extends AnyContext[] = AnyContext[]> = {
  [K in keyof T]: ContextRef<T[K]>;
};

type InferContextEvents<TContext extends AnyContext> = TContext extends Context<
  any,
  any,
  any,
  any,
  infer Events
>
  ? Events
  : never;

type ContextEventEmitter<TContext extends AnyContext> = <
  T extends keyof InferContextEvents<TContext>
>(
  event: T,
  args: InferSchema<InferContextEvents<TContext>[T]>,
  options?: { processed?: boolean }
) => void;

/**
 * Function type for resolving template variables in context
 * @template Ctx - The context type
 * @param path - The path to the template variable
 * @param ctx - The context object
 * @returns The resolved value
 */
export type TemplateResolver<Ctx = any> = (
  path: string,
  ctx: Ctx
) => MaybePromise<any>;

/**
 * API methods available on context state
 * @template TContext - The context type
 */
export interface ContextStateApi<TContext extends AnyContext> {
  /** Emit an event for this context */
  emit: ContextEventEmitter<TContext>;
  /** Push a log entry */
  push: (log: Log) => Promise<any>;

  /** Call an action with optional configuration */
  callAction: (
    call: ActionCall,
    options?: Partial<{
      templateResolvers?: Record<string, TemplateResolver>;
      queueKey?: string;
    }>
  ) => Promise<ActionResult>;

  /** Get pending action results */
  __getRunResults: () => Promise<ActionResult>[];
}

/**
 * Current state of a context instance
 * @template TContext - The context type
 */
export type ContextState<TContext extends AnyContext = AnyContext> = {
  /** Unique identifier for this context instance */
  id: string;
  /** Optional key for this context instance */
  key?: string;
  /** The context definition */
  context: TContext;
  /** Arguments passed to this context */
  args: InferSchemaArguments<TContext["schema"]>;
  /** Options/configuration for this context */
  options: InferContextOptions<TContext>;
  /** Memory state for this context */
  memory: InferContextMemory<TContext>;
  /** Settings for this context */
  settings: ContextSettings;
  /** IDs of related contexts */
  contexts: string[];
};

export type Extension<
  TContext extends AnyContext = AnyContext,
  Contexts extends Record<string, AnyContext> = Record<string, AnyContext>,
  Inputs extends Record<string, InputConfig<any, any>> = Record<
    string,
    InputConfig<any, any>
  >
> = Pick<
  Config<TContext>,
  "inputs" | "outputs" | "actions" | "services" | "events"
> & {
  name: string;
  install?: (agent: AnyAgent) => Promise<void> | void;
  contexts?: Contexts;
  inputs: Inputs;
};
