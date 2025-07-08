import { system } from "..";
import { jsonPath } from "./jsonpath";
import type { ActionCallContext, ActionResultLog, MaybePromise } from "@/types";

type TemplateRunParams = Partial<{
  resolvers: Record<string, TemplateResolver>;
}>;

const prompt = `
<template-engine>
Purpose: Utilize the template engine ({{...}} syntax) primarily to streamline workflows by transferring data between different components within the same turn. This includes passing outputs from actions into subsequent action arguments, or embedding data from various sources directly into response outputs. This enhances efficiency and reduces interaction latency.

Data Referencing: You can reference data from:
Action Results: Use {{calls[index].path.to.value}} to access outputs from preceding actions in the current turn (e.g., {{calls[0].sandboxId}}). Ensure the index correctly points to the intended action call.
Short-Term Memory: Retrieve values stored in short-term memory using {{shortTermMemory.key}}

When to Use:
Data Injection: Apply templating when an action argument or a response output requires specific data (like an ID, filename, status, or content) from an action result, configuration, or short-term memory available within the current turn.
Direct Dependencies: Particularly useful when an action requires a specific result from an action called immediately before it in the same turn.
</template-engine>
`;

const templateSystem = system({
  name: "template",
  setup(state, params: TemplateRunParams) {
    const defaultResolvers: Record<string, TemplateResolver> = {
      // calls: createResultsTemplateResolver(state.results),
      // shortTermMemory: async (path) => {
      //   const shortTermMemory = state.contexts.find(
      //     (state) => state.context.type === "shortTermMemory"
      //   );
      //   if (!shortTermMemory) throw new Error("short term memory not found");
      //   const value = getValueByPath(shortTermMemory.memory, path);
      //   if (value === undefined)
      //     throw new Error("invalid short term memory resultPath");
      //   return value;
      // },
    };

    return { defaultResolvers };
  },

  // render: prompt,
  handlers: {
    async prepareActionCall(params, next, ctx) {
      const templateResolvers: Record<
        string,
        TemplateResolver<ActionCallContext>
      > = {
        ...defaultResolvers,
        // ...ctxState.context.__templateResolvers,
        // ...options.templateResolvers,
      };

      const { log } = params;

      const templates: TemplateInfo[] = [];
      templates.push(...detectTemplates(log.data));

      const actionTemplateResolver = templateResolver;

      const callCtx = await handler(params);

      if (templates.length > 0)
        await resolveTemplates(log.data, templates, (key, path) =>
          actionTemplateResolver(key, path, callCtx, templateResolvers)
        );

      return callCtx;
    },
  },
});

export type TemplateResolver<Ctx = any> = (
  path: string,
  ctx: Ctx
) => MaybePromise<any>;

export interface TemplateInfo {
  path: (string | number)[];
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
    currentPath: (string | number)[]
  ): void {
    if (typeof currentObj === "object" && currentObj !== null) {
      if (Array.isArray(currentObj)) {
        currentObj.forEach((item, index) => {
          traverse(item, [...currentPath, index]);
        });
      } else {
        // Handle non-array objects (assuming Record<string, unknown> or similar)
        for (const key in currentObj) {
          if (Object.prototype.hasOwnProperty.call(currentObj, key)) {
            // Use type assertion if necessary, depending on your exact object types
            traverse((currentObj as Record<string, unknown>)[key], [
              ...currentPath,
              key,
            ]);
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

export function getPathSegments(pathString: string) {
  const segments = pathString.split(/[.\[\]]+/).filter(Boolean);
  return segments;
}

export function resolvePathSegments<T = any>(
  source: any,
  segments: string[]
): T | undefined {
  let current: any = source;

  for (const segment of segments) {
    if (current === null || current === undefined) {
      return undefined;
    }

    // Check if segment is an array index
    const index = parseInt(segment, 10);
    if (!isNaN(index) && Array.isArray(current)) {
      current = current[index];
    } else if (typeof current === "object") {
      current = current[segment];
    } else {
      return undefined; // Cannot access property on non-object/non-array
    }
  }

  return current;
}

/**
 * Native implementation to safely get a nested value from an object/array
 * using a string path like 'a.b[0].c'.
 */
export function getValueByPath(source: any, pathString: string): any {
  if (!pathString) {
    return source; // Return the source itself if path is empty
  }

  // Basic path segment splitting (handles dot notation and array indices)
  // More robust parsing might be needed for complex cases (e.g., keys with dots/brackets)
  const segments = getPathSegments(pathString);

  return resolvePathSegments(source, segments);
}

/**
 * Native implementation to safely set a nested value in an object/array
 * using a path array (like the one from detectTemplates).
 * Creates nested structures if they don't exist.
 */
function setValueByPath(
  target: any,
  path: (string | number)[],
  value: any
): void {
  let current: any = target;
  const lastIndex = path.length - 1;

  for (let i = 0; i < lastIndex; i++) {
    const key = path[i];
    const nextKey = path[i + 1];

    if (current[key] === null || current[key] === undefined) {
      // If the next key looks like an array index, create an array, otherwise an object
      current[key] = typeof nextKey === "number" ? [] : {};
    }
    current = current[key];

    // Safety check: if current is not an object/array, we can't proceed
    if (typeof current !== "object" || current === null) {
      console.error(
        `Cannot set path beyond non-object at segment ${i} ('${key}') for path ${path.join(".")}`
      );
      return;
    }
  }

  // Set the final value
  const finalKey = path[lastIndex];
  if (typeof current === "object" && current !== null) {
    current[finalKey] = value;
  } else {
    console.error(
      `Cannot set final value, parent at path ${path.slice(0, -1).join(".")} is not an object.`
    );
  }
}

/**
 * Resolves detected templates in an arguments object using provided data sources.
 * Modifies the input object directly. Uses native helper functions.
 */
export async function resolveTemplates(
  argsObject: any, // The object containing templates (will be mutated)
  detectedTemplates: TemplateInfo[],
  resolver: (primary_key: string, path: string) => Promise<any>
): Promise<void> {
  for (const templateInfo of detectedTemplates) {
    let resolvedValue: any = undefined;

    if (!templateInfo.primary_key) {
      console.warn(
        `Template at path ${templateInfo.path.join(".")} has no primary key: ${templateInfo.template_string}`
      );
      continue;
    }

    const valuePath = templateInfo.expression
      .substring(templateInfo.primary_key.length)
      .replace(/^\./, "");

    try {
      resolvedValue = await resolver(templateInfo.primary_key, valuePath);
    } catch (error) {
      console.error(
        `Error resolving template at path ${templateInfo.path.join(".")}: ${error}`
      );
    }

    if (resolvedValue === undefined) {
      console.warn(
        `Could not resolve template "${templateInfo.template_string}" at path ${templateInfo.path.join(".")}. Path or source might be invalid.`
      );
      throw new Error(
        `Could not resolve template "${templateInfo.template_string}" at path ${templateInfo.path.join(".")}. Path or source might be invalid.`
      );
    }

    // Use the native setValueByPath function
    setValueByPath(argsObject, templateInfo.path, resolvedValue);
  }
}

export async function templateResultsResolver(
  arr: MaybePromise<ActionResultLog>[],
  path: string
) {
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
  arr: Array<MaybePromise<any>>
): TemplateResolver {
  return (path) => templateResultsResolver(arr, path);
}

export function createObjectTemplateResolver(obj: object): TemplateResolver {
  return async function templateObjectResolver(path) {
    const res = jsonPath(obj, path);
    if (!res) throw new Error("invalid path: " + path);
    return res.length > 1 ? res : res[0];
  };
}

async function templateResolver(
  key: string,
  path: string,
  ctx: ActionCallContext,
  resolvers: Record<string, TemplateResolver<ActionCallContext>>
) {
  if (resolvers[key]) return resolvers[key](path, ctx);
  throw new Error("template engine key not implemented");
}
