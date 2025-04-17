import { z } from "zod";
import type {
  Action,
  ActionSchema,
  AnyAgent,
  AnyContext,
  ExpertConfig,
  Extension,
  InputConfig,
  Memory,
  Optional,
  OutputConfig,
  OutputRefResponse,
  OutputSchema,
  WorkingMemory,
} from "./types";
export { v7 as randomUUIDv7 } from "uuid";

/**
 * Creates an input configuration
 * @template Schema - Zod schema type for input validation
 * @template Context - Context type for input handling
 * @param config - Input configuration object
 * @returns Typed input configuration
 */
export function input<
  Schema extends z.AnyZodObject | z.ZodString | z.ZodRawShape = z.ZodString,
  TContext extends AnyContext = AnyContext,
  TAgent extends AnyAgent = AnyAgent,
>(config: InputConfig<Schema, TContext, TAgent>) {
  return config;
}

/**
 * Creates an action configuration
 * @template Schema - Zod schema type for action parameters
 * @template Result - Return type of the action
 * @template Context - Context type for action execution
 * @param action - Action configuration object
 * @returns Typed action configuration
 */
export function action<
  TSchema extends ActionSchema = undefined,
  Result = any,
  TError = any,
  TContext extends AnyContext = AnyContext,
  TAgent extends AnyAgent = AnyAgent,
  TMemory extends Memory<any> = Memory<any>,
>(
  action: Optional<
    Action<TSchema, Result, TError, TContext, TAgent, TMemory>,
    "schema"
  >
): Action<TSchema, Result, TError, TContext, TAgent, TMemory> {
  return {
    ...action,
    schema: action.schema ?? (undefined as TSchema),
  };
}

/**
 * Creates an output configuration
 * @template Schema - Zod schema type for output validation
 * @template Context - Context type for output handling
 * @param config - Output configuration object
 * @returns Typed output configuration
 */
export function output<
  Schema extends OutputSchema = OutputSchema,
  Response extends OutputRefResponse = OutputRefResponse,
  Context extends AnyContext = AnyContext,
>(config: OutputConfig<Schema, Response, Context>) {
  return config;
}

/**
 * Creates an expert configuration
 * @template Context - Context type for expert execution
 * @param config - Expert configuration object
 * @returns Typed expert configuration
 */
export function expert(config: ExpertConfig) {
  return config;
}

/**
 * Options for text chunking
 */
type ChunkOptions = {
  maxChunkSize: number;
};

/**
 * Splits text into chunks based on maximum chunk size
 * @param text - The text to split into chunks
 * @param options - Chunking options including maximum chunk size
 * @returns Array of text chunks
 */
export function splitTextIntoChunks(
  text: string,
  options: ChunkOptions
): string[] {
  const { maxChunkSize } = options;
  const lines = text.split("\n");
  const chunks: string[] = [];
  let currentChunk = "";

  for (const line of lines) {
    // If adding this line would exceed maxChunkSize, start a new chunk
    if (currentChunk.length + line.length + 1 > maxChunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = line;
    } else {
      // Add line to current chunk with a newline
      currentChunk = currentChunk ? currentChunk + "\n" + line : line;
    }
  }

  // Don't forget to add the last chunk
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Creates a memory configuration
 * @template Data - Type of data stored in memory
 * @param memory - Memory configuration object
 * @returns Typed memory configuration
 */
export function memory<Data = any>(memory: Memory<Data>) {
  return memory;
}

export function extension<
  Contexts extends Record<string, AnyContext> = Record<string, AnyContext>,
  Inputs extends Record<string, InputConfig<any, any>> = Record<
    string,
    InputConfig<any, any>
  >,
>(
  config: Optional<Extension<AnyContext, Contexts, Inputs>, "inputs">
): Extension<AnyContext, Contexts, Inputs> {
  return {
    ...config,
    inputs: config.inputs ?? ({} as Inputs),
  };
}

/**
 * Validates environment variables against a Zod schema
 * @param schema The Zod schema to validate against
 * @param env The environment object to validate (defaults to process.env)
 * @returns The validated environment variables
 */
export function validateEnv<T extends z.ZodTypeAny>(
  schema: T,
  env = process.env
): z.infer<T> {
  try {
    return schema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Environment validation failed:");
      error.errors.forEach((err) => {
        console.error(`- ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
}

type TrimWorkingMemoryOptions = {
  thoughts: number;
  inputs: number;
  outputs: number;
  actions: number;
};

const defaultTrimOptions: TrimWorkingMemoryOptions = {
  thoughts: 6,
  inputs: 20,
  outputs: 20,
  actions: 20,
};

export function trimWorkingMemory(
  workingMemory: WorkingMemory,
  options: TrimWorkingMemoryOptions = defaultTrimOptions
) {
  workingMemory.thoughts = workingMemory.thoughts.slice(-options.thoughts);
  workingMemory.inputs = workingMemory.inputs.slice(-options.inputs);
  workingMemory.outputs = workingMemory.outputs.slice(-options.outputs);
  workingMemory.calls = workingMemory.calls.slice(-options.actions);
  workingMemory.results = workingMemory.results.slice(-options.actions);
}

/**
 * Utility function to safely execute a function asynchronously
 * This is an implementation of the Promise.try pattern which isn't available in standard JS
 * @param fn The function to execute
 * @param ...args The arguments to pass to the function
 * @returns A promise that resolves with the result of the function
 */
export async function tryAsync<T>(fn: Function, ...args: any[]): Promise<T> {
  try {
    return await fn(...args);
  } catch (error) {
    return Promise.reject(error);
  }
}
