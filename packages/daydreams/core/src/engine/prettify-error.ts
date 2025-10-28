import { createEventRef } from "../utils";
import { ZodError, type ZodIssue } from "zod";
import type { ErrorRef } from "../types";
import { NotFoundError, ParsingError } from "../types";

function prettifyZodError(error: ZodError): string {
  if (!error || !error.issues || error.issues.length === 0) {
    return "Validation failed, but no specific issues were provided.";
  }

  const errorMessages = error.issues.map((issue: ZodIssue) => {
    const pathString = issue.path.join(".");
    return `- Field \`${pathString || "object root"}\`: ${
      issue.message
    } (Code: ${issue.code})`;
  });

  return `Validation Errors:\n${errorMessages.join("\n")}`;
}

export function formatError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      cause: error.cause,
    };
  }

  return JSON.stringify(error);
}

export function createErrorEvent(errorRef: ErrorRef) {
  if (errorRef.error instanceof NotFoundError) {
    if (
      errorRef.error.ref.ref === "input" ||
      errorRef.error.ref.ref === "output"
    ) {
      return createEventRef({
        name: "error",
        data: {
          ref: {
            ref: errorRef.log.ref,
            id: errorRef.log.id,
            type:
              errorRef.error.ref.ref === "output"
                ? errorRef.error.ref.name
                : errorRef.error.ref.type,
          },
          error: {
            name: "NotFoundError",
            message: "Invalid type",
          },
        },
        processed: false,
      });
    } else if (errorRef.error.ref.ref === "action_call") {
      return createEventRef({
        name: "error",
        data: {
          ref: {
            ref: errorRef.log.ref,
            id: errorRef.log.id,
            name: errorRef.error.ref.name,
          },
          error: {
            name: "NotFoundError",
            message: "Invalid action name",
          },
        },
        processed: false,
      });
    }
  }

  if (errorRef.error instanceof ParsingError) {
    return createEventRef({
      name: "error",
      data: {
        ref: {
          ref: errorRef.log.ref,
          id: errorRef.log.id,
          data: errorRef.error.ref.content,
        },
        error: {
          name: "ParsingError",
          message:
            errorRef.error.parsingError instanceof ZodError
              ? prettifyZodError(errorRef.error.parsingError)
              : errorRef.error.parsingError instanceof Error
              ? errorRef.error.parsingError.message
              : String(errorRef.error.parsingError),
        },
      },
      processed: false,
    });
  }

  return createEventRef({
    name: "error",
    data: {
      ref: {
        type: errorRef.log.ref,
        id: errorRef.log.id,
      },
      error: formatError(errorRef.error),
    },
    processed: false,
  });
}
