import type { ActionResult, MaybePromise, TemplateResolver } from "../types";
import type { Logger } from "../logger";
import { jsonPath } from "../parsing";

/**
 * Resolves detected templates in an arguments object using provided data sources.
 * Modifies the input object directly. Uses native helper functions.
 */
export async function resolveTemplates(
  argsObject: Record<string | number, unknown>, // The object containing templates (will be mutated)
  detectedTemplates: readonly TemplateInfo[],
  resolver: (primary_key: string, path: string) => MaybePromise<unknown>,
  logger: Logger
): Promise<void> {
  for (const templateInfo of detectedTemplates) {
    let resolvedValue: unknown = undefined;

    if (!templateInfo.primary_key) {
      logger.warn(
        "handlers:resolveTemplates",
        `Template at path ${templateInfo.path.join(".")} has no primary key: ${
          templateInfo.template_string
        }`
      );
      continue;
    }

    const valuePath = templateInfo.expression
      .substring(templateInfo.primary_key.length)
      .replace(/^\./, "");

    try {
      resolvedValue = await resolver(templateInfo.primary_key, valuePath);
    } catch (error) {
      logger.error(
        "handlers:resolveTemplates",
        `Error resolving template at path ${templateInfo.path.join(
          "."
        )}: ${error}`
      );
      continue;
    }

    if (resolvedValue === undefined) {
      logger.warn(
        "handlers:resolveTemplates",
        `Could not resolve template "${
          templateInfo.template_string
        }" at path ${templateInfo.path.join(
          "."
        )}. Path or source might be invalid.`
      );
      // Skip this template but continue with others
      continue;
    }

    // Use the native setValueByPath function
    setValueByPath(argsObject, templateInfo.path, resolvedValue, logger);
  }
}

export async function templateResultsResolver(
  arr: readonly MaybePromise<ActionResult>[],
  path: string
): Promise<unknown> {
  const [index, ...resultPath] = getPathSegments(path);
  const actionResult = arr[Number(index)];

  if (!actionResult) throw new Error("invalid index");
  const result = await actionResult;

  if (resultPath.length === 0) {
    return result.data;
  }
  return jsonPath(result.data, resultPath.join("."));
}

export function createResultsTemplateResolver(
  arr: readonly MaybePromise<ActionResult>[]
): TemplateResolver {
  return (path) => templateResultsResolver(arr, path);
}

export function createObjectTemplateResolver(
  obj: Record<string, unknown>
): TemplateResolver {
  return async function templateObjectResolver(path: string): Promise<unknown> {
    const res = jsonPath(obj, path);
    if (!res) throw new Error("invalid path: " + path);
    return res.length > 1 ? res : res[0];
  };
}

/**
 * Native implementation to safely set a nested value in an object/array
 * using a path array (like the one from detectTemplates).
 * Creates nested structures if they don't exist.
 */
function setValueByPath(
  target: Record<string | number, unknown>,
  path: readonly (string | number)[],
  value: unknown,
  logger: Logger
): void {
  let current: Record<string | number, unknown> = target;
  const lastIndex = path.length - 1;

  for (let i = 0; i < lastIndex; i++) {
    const key = path[i];
    const nextKey = path[i + 1];

    if (current[key] === null || current[key] === undefined) {
      // If the next key looks like an array index, create an array, otherwise an object
      current[key] = typeof nextKey === "number" ? [] : {};
    }
    current = current[key as keyof typeof current] as Record<
      string | number,
      unknown
    >;

    // Safety check: if current is not an object/array, we can't proceed
    if (typeof current !== "object" || current === null) {
      logger.error(
        "handlers:setValueByPath",
        `Cannot set path beyond non-object at segment ${i} ('${key}') for path ${path.join(
          "."
        )}`
      );
      return;
    }
  }

  // Set the final value
  const finalKey = path[lastIndex];
  if (typeof current === "object" && current !== null) {
    current[finalKey] = value;
  } else {
    logger.error(
      "handlers:setValueByPath",
      `Cannot set final value, parent at path ${path
        .slice(0, -1)
        .join(".")} is not an object.`
    );
  }
}

export interface TemplateInfo {
  path: readonly (string | number)[];
  template_string: string;
  expression: string;
  primary_key: string | null;
}

export function detectTemplates(obj: unknown): TemplateInfo[] {
  const foundTemplates: TemplateInfo[] = [];
  const templatePattern = /^\{\{(.*)\}\}$/; // Matches strings that *only* contain {{...}}
  const primaryKeyPattern = /^([a-zA-Z_][a-zA-Z0-9_]*)/; // Extracts the first identifier (simple version)

  function traverse(
    currentObj: unknown,
    currentPath: readonly (string | number)[]
  ): void {
    if (typeof currentObj === "object" && currentObj !== null) {
      if (Array.isArray(currentObj)) {
        currentObj.forEach((item, index) => {
          traverse(item, [...currentPath, index] as const);
        });
      } else {
        // Handle non-array objects (assuming Record<string, unknown> or similar)
        for (const key in currentObj) {
          if (Object.prototype.hasOwnProperty.call(currentObj, key)) {
            // Use type assertion if necessary, depending on your exact object types
            traverse((currentObj as Record<string, unknown>)[key], [
              ...currentPath,
              key,
            ] as const);
          }
        }
      }
    } else if (typeof currentObj === "string") {
      const match = currentObj.match(templatePattern);
      if (match) {
        const expression = match[1].trim();
        const primaryKeyMatch = expression.match(primaryKeyPattern);
        const primaryKey = primaryKeyMatch ? primaryKeyMatch[1] : null;

        foundTemplates.push({
          path: currentPath,
          template_string: currentObj,
          expression: expression,
          primary_key: primaryKey,
        });
      }
    }
  }

  traverse(obj, []);
  return foundTemplates;
}

export function getPathSegments(pathString: string): string[] {
  const segments = pathString.split(/[.\[\]]+/).filter(Boolean);
  return segments;
}

export function resolvePathSegments<T = unknown>(
  source: unknown,
  segments: readonly string[]
): T | undefined {
  let current: unknown = source;

  for (const segment of segments) {
    if (current === null || current === undefined) {
      return undefined;
    }

    // Check if segment is an array index
    const index = parseInt(segment, 10);
    if (!isNaN(index) && Array.isArray(current)) {
      current = current[index];
    } else if (typeof current === "object") {
      current = current[segment as keyof typeof current];
    } else {
      return undefined; // Cannot access property on non-object/non-array
    }
  }

  return current as T;
}

/**
 * Native implementation to safely get a nested value from an object/array
 * using a string path like 'a.b[0].c'.
 */
export function getValueByPath(source: unknown, pathString: string): unknown {
  if (!pathString) {
    return source; // Return the source itself if path is empty
  }

  // Basic path segment splitting (handles dot notation and array indices)
  // More robust parsing might be needed for complex cases (e.g., keys with dots/brackets)
  const segments = getPathSegments(pathString);

  return resolvePathSegments(source, segments);
}
