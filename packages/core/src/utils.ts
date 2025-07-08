import { v7 as randomUUIDv7 } from "uuid";
export { randomUUIDv7 };

// Type definition for a resolver function
type ResolverFn<TValue, TArgs extends Array<any>> = (...args: TArgs) => TValue;

// Type guard to check if a value is a function
function isFunction<TValue, const TArgs extends Array<any>>(
  value: TValue | ResolverFn<TValue, TArgs>
): value is ResolverFn<TValue, TArgs> {
  return typeof value === "function";
}

export type ValueOf<
  ObjectType,
  ValueType extends keyof ObjectType = keyof ObjectType,
> = ObjectType[ValueType];

// Overloaded function signatures
export function resolve<TValue, const TArgs extends Array<any>>(
  resolver: TValue | ResolverFn<TValue, TArgs>,
  args: TArgs
): TValue;

export function resolve<TValue, const TArgs extends Array<any>>(
  resolver: TValue | ResolverFn<TValue, TArgs> | undefined,
  args: TArgs,
  defaultValue: NonNullable<TValue>
): TValue;

export function resolve<TDefault, const TArgs extends Array<any>>(
  resolver: unknown | ResolverFn<unknown, TArgs> | undefined,
  args: TArgs,
  defaultValue: TDefault
): TDefault;

export function resolve<TValue, const TArgs extends Array<any>>(
  resolver: TValue | ResolverFn<TValue, TArgs>,
  args: TArgs,
  defaultValue?: TValue
): TValue;

// Main resolver export function with proper typing
export function resolve<
  TValue = any,
  const TArgs extends Array<any> = Array<any>,
>(
  resolver: TValue | ResolverFn<TValue, TArgs>,
  args: TArgs,
  defaultValue?: TValue
): TValue | undefined {
  try {
    if (resolver === undefined) {
      return defaultValue;
    }

    if (isFunction(resolver)) {
      const result = resolver(...args);
      return result !== undefined ? result : defaultValue;
    }

    return resolver !== undefined ? resolver : defaultValue;
  } catch (error) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw error;
  }
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

export async function* wrapStream(
  stream: AsyncIterable<string>,
  prefix?: string,
  suffix?: string
) {
  if (prefix) yield prefix;
  yield* stream;
  if (suffix) yield suffix;
}
