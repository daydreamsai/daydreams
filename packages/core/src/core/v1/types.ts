import { type LanguageModelV1 } from "ai";
import { z } from "zod";
import type { Container } from "./container";
import type { ServiceProvider } from "./serviceProvider";
import type { AnyContext, Context } from "./context";

/** Represents an execution chain with experts and metadata */
export type Chain = {
  id: string;
  thinking: string;
  purpose: string;
  experts: { name: string; data: string }[];
};

/** Interface for storing and retrieving memory data */
export interface MemoryStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

export interface WorkingMemory {
  inputs: InputRef[];
  outputs: OutputRef[];
  thoughts: Thought[];
  calls: ActionCall[];
  results: ActionResult[];
  // chains: Chain[];
}

/**
 * Represents an action that can be executed with typed parameters
 * @template Schema - Zod schema defining parameter types
 * @template Result - Return type of the action
 * @template Context - Context type for the action execution
 */
export type Action<
  Schema extends z.AnyZodObject = z.AnyZodObject,
  Result = any,
  Context = any,
  TAgent extends AnyAgent = AnyAgent,
> = {
  name: string;
  description?: string;
  schema: Schema;
  install?: (agent: TAgent) => Promise<void>;
  enabled?: (ctx: Context) => boolean;
  examples?: z.infer<Schema>[];
  handler: (
    call: ActionCall<z.infer<Schema>>,
    ctx: Context,
    agent: TAgent
  ) => Promise<Result>;
};

export type OutputSchema = z.AnyZodObject | z.ZodString;

export type Output<
  Schema extends OutputSchema = OutputSchema,
  Context = any,
  TAgent extends AnyAgent = AnyAgent,
> = {
  type: string;
  description?: string;
  instructions?: string;
  schema: Schema;
  install?: (agent: TAgent) => Promise<void>;
  enabled?: (ctx: Context) => boolean;
  examples?: z.infer<Schema>[];
  handler: (
    params: z.infer<Schema>,
    ctx: Context,
    agent: TAgent
  ) => Promise<boolean> | boolean;
};

/**
 * Represents an input handler with validation and subscription capability
 * @template Schema - Zod schema for input parameters
 * @template Context - Context type for input handling
 */
export type Input<
  Schema extends z.AnyZodObject = z.AnyZodObject,
  Context = any,
  TAgent extends AnyAgent = AnyAgent,
> = {
  type: string;
  description?: string;
  schema: Schema;
  install?: (agent: TAgent) => Promise<void>;
  handler: (
    params: z.infer<Schema>,
    ctx: Context,
    agent: TAgent
  ) => Promise<boolean> | boolean;
  subscribe?: (
    send: <TContext extends AnyContext>(
      contextHandler: TContext,
      args: z.infer<TContext["schema"]>,
      data: z.infer<Schema>
    ) => void,
    agent: TAgent
  ) => () => void;
};

/** Reference to an input event in the system */
export type InputRef = {
  ref: "input";
  type: string;
  data: any;
  params?: Record<string, string>;
  timestamp: number;
  processed?: boolean;
};

/** Reference to an output event in the system */
export type OutputRef = {
  ref: "output";
  type: string;
  data: any;
  params?: Record<string, string>;
  timestamp: number;
};

/** Represents a call to an action */
export type ActionCall<Data = any> = {
  ref: "action_call";
  id: string;
  name: string;
  data: Data;
  timestamp: number;
};

/** Represents the result of an action execution */
export type ActionResult<Data = any> = {
  ref: "action_result";
  callId: string;
  name: string;
  data: Data;
  timestamp: number;
  processed?: boolean;
};

/** Represents a thought or reasoning step */
export type Thought = {
  ref: "thought";
  content: string;
  timestamp: number;
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
  [K in ExtractTemplateVariables<T>]: string | string[] | object;
}>;

/** Represents an expert system with instructions and actions */
export type Expert<Context = any> = {
  type: string;
  description: string;
  instructions: string;
  model?: LanguageModelV1;
  actions?: Action<any, any, Context>[];
};

export interface AgentContext<Memory extends WorkingMemory = WorkingMemory> {
  id: string;
  memory: Memory;
}

export type AnyAgent = Agent<any, any>;

export interface Agent<
  Memory extends WorkingMemory = WorkingMemory,
  T extends ContextHandler<Memory> = ContextHandler<Memory>,
> {
  // context: Context;

  memory: MemoryStore;

  context: T;

  debugger: Debugger;

  container: Container;

  model: LanguageModelV1;
  reasoningModel?: LanguageModelV1;

  inputs: Record<string, InputConfig<any, InferContextFromHandler<T>>>;
  outputs: Record<
    string,
    Omit<Output<any, InferContextFromHandler<T>>, "type">
  >;

  events: Record<string, z.AnyZodObject>;

  experts: Record<string, ExpertConfig<InferContextFromHandler<T>>>;

  actions: Action<any, any, InferContextFromHandler<T>, Agent<Memory, T>>[];

  //
  emit: (...args: any[]) => void;
  run: <TContext extends Context<WorkingMemory, any, any, any>>(
    context: TContext,
    args: z.infer<TContext["schema"]>
  ) => Promise<void>;
  send: <TContext extends Context<WorkingMemory, any, any, any>>(
    context: TContext,
    args: z.infer<TContext["schema"]>,
    input: { type: string; data: any }
  ) => Promise<void>;
  evaluator: (ctx: InferContextFromHandler<T>) => Promise<void>;

  start(): Promise<void>;
  stop(): Promise<void>;
}

export type ContextHandler<T extends WorkingMemory = WorkingMemory> = (
  memory: MemoryStore
) => {
  get: (id: string) => Promise<{ id: string; memory: T }>;
  save: (id: string, data: T) => Promise<void>;
  render: (data: T) => string | string[];
};

export type InferMemoryFromHandler<THandler extends ContextHandler<any>> =
  THandler extends ContextHandler<infer Memory> ? Memory : unknown;

export type InferContextFromHandler<THandler extends ContextHandler<any>> =
  AgentContext<InferMemoryFromHandler<THandler>>;

export type Debugger = (contextId: string, keys: string[], data: any) => void;

export type Config<
  TMemory extends WorkingMemory = WorkingMemory,
  TContextHandler extends ContextHandler<TMemory> = ContextHandler<TMemory>,
  Context = InferContextFromHandler<TContextHandler>,
> = {
  // context: Context;
  memory: MemoryStore;
  container?: Container;
  context?: TContextHandler;
  debugger?: Debugger;
  services?: ServiceProvider[];
  inputs?: Record<
    string,
    InputConfig<any, Context, Agent<TMemory, TContextHandler>>
  >;
  outputs?: Record<
    string,
    OutputConfig<any, Context, Agent<TMemory, TContextHandler>>
  >;

  events?: Record<string, z.AnyZodObject>;

  experts?: Record<string, ExpertConfig<Context>>;

  actions?: Action<any, any, Context, Agent<TMemory, TContextHandler>>[];

  model: LanguageModelV1;
  reasoningModel?: LanguageModelV1;
  logger?: LogLevel;
};

/** Configuration type for inputs without type field */
export type InputConfig<
  T extends z.AnyZodObject = z.AnyZodObject,
  Context = any,
  TAgent extends AnyAgent = AnyAgent,
> = Omit<Input<T, Context, TAgent>, "type">;

/** Configuration type for outputs without type field */
export type OutputConfig<
  T extends OutputSchema = OutputSchema,
  Context = any,
  TAgent extends AnyAgent = AnyAgent,
> = Omit<Output<T, Context>, "type">;

/** Configuration type for experts without type field */
export type ExpertConfig<Context = any> = Omit<Expert<Context>, "type">;

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
