import { z, ZodError, type ZodIssue } from "zod";

export function formatValue(value: any): string {
  if (typeof value !== "string")
    return JSON.stringify(value, (_, value) => {
      if (typeof value === "bigint") return value.toString();
      return value;
    });
  return value.trim();
}

export function prettifyZodError(error: ZodError): string {
  if (!error || !error.issues || error.issues.length === 0) {
    return "Validation failed, but no specific issues were provided.";
  }

  const errorMessages = error.issues.map((issue: ZodIssue) => {
    const pathString = issue.path.join(".");
    return `- Field \`${pathString || "object root"}\`: ${issue.message} (Code: ${issue.code})`;
  });

  return `Validation Errors:\n${errorMessages.join("\n")}`;
}

export function formatError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      cause: error.cause,
      // stack: error.stack,
    };
  }

  return JSON.stringify(error);
}
