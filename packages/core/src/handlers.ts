import { z } from "zod";
import type { Logger } from "./logger";
import type { TaskRunner } from "./task";
import { runAction } from "./tasks";
import type {
  ActionCall,
  ActionCallContext,
  ActionCtxRef,
  ActionResult,
  AnyAction,
  AnyAgent,
  AnyContext,
  AnyOutput,
  Context,
  ContextRef,
  ContextState,
  ContextStateApi,
  Input,
  InputConfig,
  InputRef,
  MaybePromise,
  ActionState,
  Output,
  OutputCtxRef,
  OutputRef,
  Resolver,
  TemplateResolver,
  WorkingMemory,
} from "./types";
import { randomUUIDv7 } from "./utils";
import { parse } from "./xml";
import { jsonPath } from "./jsonpath";
import { jsonSchema } from "ai";

import type { WorkingMemoryData } from "./memory";
import type { RecallOptions, MemoryResult } from "./memory";
import type { RetrievalPolicy } from "./types";

/**
 * Formats a memory content string with an ISO timestamp from metadata (if present).
 * Keeps vector content clean at storage time and only decorates for display/use here.
 */
function formatMemoryWithTimestamp(
  content: unknown,
  metadata?: Record<string, unknown>
): string {
  const tsVal =
    metadata && typeof (metadata as any).timestamp === "number"
      ? ((metadata as any).timestamp as number)
      : undefined;
  const iso = tsVal ? new Date(tsVal).toISOString() : undefined;
  const text =
    typeof content === "string" ? content : JSON.stringify(content ?? "");
  return iso ? `${iso} — ${text}` : text;
}

export class NotFoundError extends Error {
  name = "NotFoundError";
  constructor(public ref: ActionCall | OutputRef | InputRef) {
    super(`${ref.ref} not found: ${ref.ref || "unknown"}`);
  }
}

export class ParsingError extends Error {
  name = "ParsingError";
  constructor(
    public ref: ActionCall | OutputRef | InputRef,
    public parsingError: unknown
  ) {
    super(
      `Parsing failed for ${ref.ref}: ${
        parsingError instanceof Error
          ? parsingError.message
          : String(parsingError)
      }`
    );
  }
}

function parseJSONContent(content: string): unknown {
  if (content.startsWith("```json")) {
    content = content.slice("```json".length, -3);
  }

  return JSON.parse(content);
}

function parseXMLContent(content: string): Record<string, string> {
  const nodes = parse(content, (node) => {
    return node;
  });

  const data = nodes.reduce((data, node) => {
    if (node.type === "element") {
      data[node.name] = node.content;
    }
    return data;
  }, {} as Record<string, string>);

  return data;
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

export function parseActionCallContent({
  call,
  action,
}: {
  call: ActionCall;
  action: AnyAction;
}) {
  try {
    const content = call.content.trim();

    let data: unknown;

    if (action.parser) {
      data = action.parser(call);
    } else if (action.schema && action.schema?._def?.typeName !== "ZodString") {
      if (action.callFormat === "xml") {
        data = parseXMLContent(content);
      } else {
        data = parseJSONContent(content);
      }
    } else {
      data = content;
    }

    return data;
  } catch (error) {
    throw new ParsingError(call, error);
  }
}

export function resolveActionCall({
  call,
  actions,
  logger,
}: {
  call: ActionCall;
  actions: readonly ActionCtxRef[];
  logger: Logger;
}): ActionCtxRef {
  const contextKey = call.params?.contextKey;

  const action = actions.find(
    (a) =>
      (contextKey ? contextKey === a.ctxRef.key : true) && a.name === call.name
  );

  if (!action) {
    const availableActions = actions.map((a) => a.name);
    const errorDetails = {
      error: "ACTION_MISMATCH",
      requestedAction: call.name,
      availableActions,
      contextKey,
      callContent: call.content,
      callId: call.id,
    };

    logger.error(
      "agent:action",
      `Action '${
        call.name
      }' not found. Available actions: ${availableActions.join(", ")}`,
      errorDetails
    );

    throw new NotFoundError(call);
  }

  return action;
}

export async function prepareActionCall({
  call,
  action,
  logger,
  templateResolver,
  state,
  api,
  workingMemory,
  agent,
  agentState,
  abortSignal,
}: {
  agent: AnyAgent;
  state: ContextState<AnyContext>;
  api: ContextStateApi<AnyContext>;
  workingMemory: WorkingMemory;
  agentState?: ContextState;
  call: ActionCall;
  action: ActionCtxRef;
  logger: Logger;
  templateResolver: (
    primary_key: string,
    path: string,
    callCtx: ActionCallContext
  ) => MaybePromise<unknown>;
  abortSignal?: AbortSignal;
}): Promise<ActionCallContext> {
  let actionMemory: unknown = undefined;

  if (action.actionState) {
    actionMemory =
      (await agent.memory.kv.get(action.actionState.key)) ??
      action.actionState.create();
  }

  const callCtx: ActionCallContext = {
    ...state,
    ...api,
    workingMemory,
    actionMemory,
    agentMemory: agentState?.memory,
    abortSignal,
    call,
  };

  const data = call.data ?? parseActionCallContent({ call, action });

  const templates: TemplateInfo[] = [];

  if (action.templateResolver !== false) {
    templates.push(...detectTemplates(data));

    const actionTemplateResolver =
      typeof action.templateResolver === "function"
        ? action.templateResolver
        : templateResolver;

    if (templates.length > 0)
      await resolveTemplates(
        data,
        templates,
        (key, path) => actionTemplateResolver(key, path, callCtx),
        logger
      );
  }

  if (action.schema) {
    try {
      const schema =
        "parse" in action.schema || "validate" in action.schema
          ? action.schema
          : "$schema" in action.schema
          ? jsonSchema(action.schema)
          : z.object(action.schema);

      call.data =
        "parse" in schema
          ? (schema as z.ZodType).parse(data)
          : "validate" in schema && schema.validate
          ? schema.validate(data)
          : data;
    } catch (error) {
      throw new ParsingError(call, error);
    }
  } else {
    call.data = data;
  }

  return callCtx;
}

export async function handleActionCall({
  action,
  logger,
  call,
  taskRunner,
  agent,
  abortSignal,
  callCtx,
  queueKey,
}: {
  callCtx: ActionCallContext;
  call: ActionCall;
  action: AnyAction;
  logger: Logger;
  taskRunner: TaskRunner;
  agent: AnyAgent;
  abortSignal?: AbortSignal;
  queueKey?: string;
}): Promise<ActionResult> {
  queueKey =
    queueKey ??
    (action.queueKey
      ? typeof action.queueKey === "function"
        ? action.queueKey(callCtx)
        : action.queueKey
      : undefined);

  const data = await taskRunner.enqueueTask(
    runAction,
    {
      action,
      agent,
      logger,
      ctx: callCtx,
    },
    {
      retry: action.retry,
      abortSignal,
      queueKey,
    }
  );

  const result: ActionResult = {
    ref: "action_result",
    id: randomUUIDv7(),
    callId: call.id,
    data,
    name: call.name,
    timestamp: Date.now(),
    processed: false,
  };

  if (action.format) result.formatted = action.format(result);

  if (callCtx.actionMemory && action.actionState) {
    await agent.memory.kv.set(action.actionState.key, callCtx.actionMemory);
  }

  if (action.onSuccess) {
    await Promise.try(action.onSuccess, result, callCtx, agent);
  }

  return result;
}

export function prepareOutputRef({
  outputRef,
  outputs,
  logger,
}: {
  outputRef: OutputRef;
  outputs: readonly OutputCtxRef[];
  logger: Logger;
}): { output: OutputCtxRef } {
  const output = outputs.find((output) => output.name === outputRef.name);

  if (!output) {
    const availableOutputs = outputs.map((o) => o.name);
    const errorDetails = {
      error: "OUTPUT_NAME_MISMATCH",
      requestedName: outputRef.name,
      availableNames: availableOutputs,
      outputData: outputRef.data,
      outputId: outputRef.id,
    };

    logger.error(
      "agent:output",
      `Output name '${
        outputRef.name
      }' not found. Available names: ${availableOutputs.join(", ")}`,
      errorDetails
    );

    throw new NotFoundError(outputRef);
  }

  logger.debug("agent:output", outputRef.name, outputRef.data);

  if (output.schema) {
    const schema = (
      "parse" in output.schema ? output.schema : z.object(output.schema)
    ) as z.ZodType | z.ZodString;

    let parsedContent = outputRef.content;

    try {
      if (typeof parsedContent === "string") {
        if (schema.constructor.name !== "ZodString") {
          parsedContent = JSON.parse(parsedContent.trim());
        }
      }

      outputRef.data = schema.parse(parsedContent);
    } catch (error) {
      throw new ParsingError(outputRef, error);
    }
  }

  return { output };
}

export async function handleOutput({
  outputRef,
  output,
  logger,
  state,
  workingMemory,
  agent,
}: {
  output: OutputCtxRef;
  outputRef: OutputRef;
  logger: Logger;
  workingMemory: WorkingMemory;
  state: ContextState;
  agent: AnyAgent;
}): Promise<OutputRef | OutputRef[]> {
  if (output.handler) {
    const response = await Promise.try(
      output.handler,
      outputRef.data,
      {
        ...state,
        workingMemory,
        outputRef,
      },
      agent
    );

    if (Array.isArray(response)) {
      const refs: OutputRef[] = [];
      for (const res of response) {
        const ref: OutputRef = {
          ...outputRef,
          id: randomUUIDv7(),
          processed: res.processed ?? true,
          ...res,
        };

        ref.formatted = output.format ? output.format(ref) : undefined;
        refs.push(ref);
      }
      return refs;
    } else if (response) {
      const ref: OutputRef = {
        ...outputRef,
        ...response,
        processed: response.processed ?? true,
      };

      ref.formatted = output.format ? output.format(ref) : undefined;

      return ref;
    }
  }

  return {
    ...outputRef,
    formatted: output.format ? output.format(outputRef.data) : undefined,
    processed: true,
  };
}

export async function prepareContextActions(params: {
  context: Context;
  state: ContextState<AnyContext>;
  workingMemory: WorkingMemory;
  agent: AnyAgent;
  agentCtxState: ContextState<AnyContext> | undefined;
}): Promise<readonly ActionCtxRef[]> {
  const { context, state } = params;
  const actions =
    typeof context.actions === "function"
      ? await Promise.try(context.actions, state)
      : context.actions ?? [];

  return Promise.all(
    actions.map((action) =>
      prepareAction({
        action,
        ...params,
      })
    )
  ).then((t) => t.filter((t) => !!t));
}

async function prepareOutput({
  output,
  context,
  state,
}: {
  output: AnyOutput;
  context: AnyContext;
  state: ContextState<AnyContext>;
}): Promise<OutputCtxRef | undefined> {
  if (output.context && output.context.type !== context.type) return undefined;

  const enabled = output.enabled ? output.enabled(state) : true;

  return enabled
    ? {
        ...output,
        ctxRef: {
          type: state.context.type,
          id: state.id,
          key: state.key,
        },
      }
    : undefined;
}

export async function prepareContextOutputs(params: {
  context: Context;
  state: ContextState<AnyContext>;
  workingMemory: WorkingMemory;
  agent: AnyAgent;
  agentCtxState: ContextState<AnyContext> | undefined;
}): Promise<readonly OutputCtxRef[]> {
  return params.context.outputs
    ? Promise.all(
        Object.entries(params.context.outputs).map(([name, output]) =>
          prepareOutput({
            output: {
              name,
              ...output,
            },
            ...params,
          })
        )
      ).then((t) => t.filter((t) => !!t))
    : [];
}

export async function prepareAction({
  action,
  context,
  state,
  workingMemory,
  agent,
  agentCtxState,
}: {
  action: AnyAction;
  context: AnyContext;
  state: ContextState<AnyContext>;
  workingMemory: WorkingMemory;
  agent: AnyAgent;
  agentCtxState: ContextState<AnyContext> | undefined;
}): Promise<ActionCtxRef | undefined> {
  if (action.context && action.context.type !== context.type) return undefined;

  let actionMemory: unknown = undefined;

  if (action.actionState) {
    actionMemory =
      (await agent.memory.kv.get(action.actionState.key)) ??
      action.actionState.create();
  }

  const enabled = action.enabled
    ? action.enabled({
        ...state,
        context,
        workingMemory,
        actionMemory,
        agentMemory: agentCtxState?.memory,
      })
    : true;

  if (action.enabled && action.actionState && actionMemory) {
    await agent.memory.kv.set(action.actionState.key, actionMemory);
  }

  return enabled
    ? {
        ...action,
        ctxRef: {
          type: state.context.type,
          id: state.id,
          key: state.key,
        },
      }
    : undefined;
}

function resolve<Value = unknown, Ctx = unknown>(
  value: Value,
  ctx: Ctx
): Promise<Value extends (ctx: Ctx) => infer R ? R : Value> {
  return typeof value === "function"
    ? value(ctx)
    : (Promise.resolve(value) as Promise<
        Value extends (ctx: Ctx) => infer R ? R : Value
      >);
}

export async function prepareContext(
  {
    agent,
    ctxState,
    workingMemory,
    agentCtxState,
  }: {
    agent: AnyAgent;
    ctxState: ContextState;
    workingMemory: WorkingMemory;
    agentCtxState?: ContextState;
  },
  state: {
    inputs: Input[];
    outputs: OutputCtxRef[];
    actions: ActionCtxRef[];
    contexts: ContextState[];
  }
) {
  state.contexts.push(ctxState);

  await ctxState.context.loader?.(ctxState, agent);

  const inputs: Input[] = ctxState.context.inputs
    ? Object.entries(ctxState.context.inputs).map(([type, input]) => ({
        type,
        ...input,
      }))
    : [];

  state.inputs.push(...inputs);

  const outputs: OutputCtxRef[] = ctxState.context.outputs
    ? await Promise.all(
        Object.entries(await resolve(ctxState.context.outputs, ctxState)).map(
          ([name, output]) =>
            prepareOutput({
              output: {
                name,
                ...output,
              },
              context: ctxState.context,
              state: ctxState,
            })
        )
      ).then((r) => r.filter((a) => !!a))
    : [];

  state.outputs.push(...outputs);

  const actions = await prepareContextActions({
    agent,
    agentCtxState,
    context: ctxState.context,
    state: ctxState,
    workingMemory,
  });

  state.actions.push(...actions);

  const ctxRefs: ContextRef[] = [];

  if (ctxState.context.__composers) {
    for (const composer of ctxState.context.__composers) {
      ctxRefs.push(...composer(ctxState));
    }
  }

  // Parallelize context preparation for composed contexts
  if (ctxRefs.length > 0) {
    await Promise.all(
      ctxRefs.map(async ({ context, args }) => {
        const composedCtxState = await agent.getContext({ context, args });
        return prepareContext(
          {
            agent,
            ctxState: composedCtxState,
            workingMemory,
            agentCtxState,
          },
          state
        );
      })
    );
  }

  return state;
}

export async function prepareContexts({
  agent,
  ctxState,
  agentCtxState,
  workingMemory,
  params,
}: {
  agent: AnyAgent;
  ctxState: ContextState;
  agentCtxState?: ContextState;
  workingMemory: WorkingMemory;
  params?: {
    outputs?: Record<string, Omit<Output, "name">>;
    inputs?: Record<string, InputConfig>;
    actions?: AnyAction[];
    contexts?: ContextRef[];
  };
}) {
  await agentCtxState?.context.loader?.(agentCtxState, agent);

  const inputs: Input[] = Object.entries({
    ...agent.inputs,
    ...(params?.inputs ?? {}),
  }).map(([type, input]) => ({
    type,
    ...input,
  }));

  const outputs: OutputCtxRef[] = await Promise.all(
    Object.entries({
      ...agent.outputs,
      ...(params?.outputs ?? {}),
    }).map(([name, output]) =>
      prepareOutput({
        output: {
          name,
          ...output,
        },
        context: ctxState.context,
        state: ctxState,
      })
    )
  ).then((r) => r.filter((a) => !!a));

  const actions = await Promise.all(
    [agent.actions, params?.actions]
      .filter((t) => !!t)
      .flat()
      .map((action: AnyAction) =>
        prepareAction({
          action,
          agent,
          agentCtxState,
          context: ctxState.context,
          state: ctxState,
          workingMemory,
        })
      )
  ).then((r) => r.filter((a) => !!a));

  const contexts: ContextState[] = agentCtxState ? [agentCtxState] : [];

  const state = {
    inputs,
    outputs,
    actions,
    contexts,
  };

  await prepareContext(
    { agent, ctxState, workingMemory, agentCtxState },
    state
  );

  if (params?.contexts) {
    // Parallelize context preparation for better performance
    await Promise.all(
      params.contexts.map(async (ctxRef) => {
        const ctxState = await agent.getContext(ctxRef);
        return prepareContext(
          {
            agent,
            ctxState,
            workingMemory,
            agentCtxState,
          },
          state
        );
      })
    );
  }

  return state;
}

export async function handleInput({
  inputs,
  inputRef,
  logger,
  ctxState,
  workingMemory,
  agent,
}: {
  inputs: readonly Input[];
  inputRef: InputRef;
  logger: Logger;
  workingMemory: WorkingMemoryData;
  ctxState: ContextState;
  agent: AnyAgent;
}): Promise<void> {
  const input = inputs.find((input) => input.type === inputRef.type);

  if (!input) {
    const availableInputs = inputs.map((i) => i.type);
    const errorDetails = {
      error: "INPUT_TYPE_MISMATCH",
      requestedType: inputRef.type,
      availableTypes: availableInputs,
      inputContent: inputRef.content,
      inputId: inputRef.id,
    };

    logger.error(
      "agent:input",
      `Input type '${
        inputRef.type
      }' not found. Available types: ${availableInputs.join(", ")}`,
      errorDetails
    );

    throw new NotFoundError(inputRef);
  }

  try {
    if (input.schema) {
      const schema = (
        "parse" in input.schema ? input.schema : z.object(input.schema)
      ) as z.ZodType | z.ZodString;
      inputRef.data = schema.parse(inputRef.content);
    } else {
      inputRef.data = z.string().parse(inputRef.content);
    }
  } catch (error) {
    throw new ParsingError(inputRef, error);
  }

  const queryText =
    typeof inputRef.data === "string"
      ? inputRef.data
      : JSON.stringify(inputRef.data);

  let policy: RetrievalPolicy | undefined;
  if ("retrieval" in ctxState.context && ctxState.context.retrieval) {
    const raw = ctxState.context.retrieval;
    policy = typeof raw === "function" ? raw(ctxState) : raw;
  }

  const baseRecall: RecallOptions = {
    contextId: ctxState.id,
    scope: policy?.scope ?? "all",
    include: policy?.include ?? { content: true, metadata: true },
    groupBy: policy?.groupBy ?? "docId",
    dedupeBy: policy?.dedupeBy ?? "docId",
    topK: policy?.topK ?? 4,
    minScore: policy?.minScore ?? 0,
    weighting:
      policy?.weighting ??
      ({
        salience: 0.25,
        recencyHalfLifeMs: 1000 * 60 * 60 * 24 * 7,
      } as RecallOptions["weighting"]),
  };

  // Namespaces order from policy or sensible default
  const namespaces: (string | undefined)[] =
    Array.isArray(policy?.namespaces) && policy.namespaces.length > 0
      ? policy.namespaces
      : [`episodes:${ctxState.id}`, undefined]; // undefined => general (no namespace filter)

  logger.debug("agent:send", "Querying relevant memories", {
    inputRef,
    namespaces,
    queryText,
    baseRecall,
  });

  // Query namespaces in order, stopping after filling topK, while deduping as we go
  const collected: MemoryResult[] = [];
  const seen = new Set<string>();
  for (const ns of namespaces) {
    const remaining = (baseRecall.topK ?? 5) - collected.length;
    if (remaining <= 0) break;
    const hits = await agent.memory.recall(queryText, {
      ...baseRecall,
      namespace: ns,
      topK: remaining,
    });
    for (const r of hits) {
      const key = ((r.metadata as any)?.docId as string) || r.id;
      if (!seen.has(key)) {
        seen.add(key);
        collected.push(r);
      }
      if (collected.length >= (baseRecall.topK ?? 5)) break;
    }
  }
  // Decorate memory content with display timestamp from metadata; no KV dependency
  const relevantMemories = collected.map((r) => {
    const md = (r.metadata || {}) as Record<string, unknown>;
    if (typeof md.timestamp === "number") {
      (md as any).displayTimestamp = new Date(md.timestamp).toISOString();
      r.metadata = md;
    }
    r.content = formatMemoryWithTimestamp(r.content, md);
    return r;
  });

  logger.trace("agent:send", "Relevant memories retrieved", {
    memoriesCount: relevantMemories.length,
    memories: relevantMemories,
  });

  workingMemory.relevantMemories = relevantMemories;

  if (input.handler) {
    logger.debug("agent:send", "Using custom input handler", {
      type: inputRef.type,
    });

    const { data, params } = await Promise.try(
      input.handler,
      inputRef.data,
      {
        ...ctxState,
        workingMemory,
      },
      agent
    );

    inputRef.data = data;

    if (params) {
      inputRef.params = {
        ...inputRef.params,
        ...params,
      };
    }
  }

  inputRef.formatted = input.format ? input.format(inputRef) : undefined;
}
