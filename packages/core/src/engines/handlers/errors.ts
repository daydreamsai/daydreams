import { formatError, prettifyZodError } from "@/formatters";
import type { AnyMemory } from "@/types/memory";
import type {
  ActionCallMemory,
  InputMemory,
  OutputMemory,
  ToolCallMemory,
} from "@/types/wm";
import { workingMemories } from "@/wm";
import { ZodError } from "zod";

export class NotFoundError extends Error {
  name = "NotFoundError";
  constructor(
    public memory:
      | ActionCallMemory
      | OutputMemory
      | InputMemory
      | ToolCallMemory
  ) {
    super();
  }
}

export class ParsingError extends Error {
  name = "ParsingError";
  constructor(
    public memory:
      | ActionCallMemory
      | OutputMemory
      | InputMemory
      | ToolCallMemory,
    public parsingError: unknown
  ) {
    super();
  }
}

export type ErrorRef<Error = unknown> = {
  memory: AnyMemory;
  error: Error;
};

export function createErrorEventLog<Error = unknown>(
  errorRef: ErrorRef<Error>
) {
  if (errorRef.error instanceof NotFoundError) {
    return workingMemories.error({
      memory: {
        id: errorRef.memory.id,
        kind: errorRef.error.memory.kind,
      },
      error: {
        name: "NotFoundError",
        message: "Invalid action name",
      },
    });
  }

  if (errorRef.error instanceof ParsingError) {
    return workingMemories.error({
      memory: {
        kind: errorRef.memory.kind,
        id: errorRef.memory.id,
      },
      error: {
        name: "ParsingError",
        message:
          errorRef.error.parsingError instanceof ZodError
            ? prettifyZodError(errorRef.error.parsingError)
            : JSON.stringify(errorRef.error.parsingError),
      },
    });
  }

  return workingMemories.error({
    memory: {
      kind: errorRef.memory.kind,
      id: errorRef.memory.id,
    },
    error: formatError(errorRef.error),
  });
}
