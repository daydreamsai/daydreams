import { z, ZodSchema } from "zod";
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
  EventRef,
  Input,
  InputConfig,
  InputRef,
  Log,
  Memory,
  Output,
  OutputCtxRef,
  OutputRef,
  WorkingMemory,
} from "./types";
import { randomUUIDv7 } from "./utils";
import { pushToWorkingMemory } from "./context";
import { parse } from "./xml";

export class NotFoundError extends Error {
  constructor(public ref: ActionCall | OutputRef | InputRef) {
    super();
  }
}

export class ParsingError extends Error {
  constructor(
    public ref: ActionCall | OutputRef | InputRef,
    public parsingError: unknown
  ) {
    super();
  }
}

function parseJSONContent(content: string) {
  if (content.startsWith("```json")) {
    content = content.slice("```json".length, -3);
  }

  return JSON.parse(content);
}

function parseXMLContent(content: string) {
  const nodes = parse(content, (node) => {
    return node;
  });

  const data = nodes.reduce(
    (data, node) => {
      if (node.type === "element") {
        data[node.name] = node.content;
      }
      return data;
    },
    {} as Record<string, string>
  );

  return data;
}

export interface TemplateInfo {
  path: (string | number)[];
  template_string: string;
  expression: string;
  primary_key: string | null;
}

function detectTemplates(obj: unknown): TemplateInfo[] {
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

export async function prepareActionCall({
  call,
  actions,
  logger,
}: {
  call: ActionCall;
  actions: ActionCtxRef[];
  logger: Logger;
}) {
  const contextKey = call.params?.contextKey;

  const action = actions.find(
    (a) =>
      a.name === call.name && (contextKey ? contextKey === a.ctxRef.key : true)
  );

  console.log({ call, contextKey, action });

  if (!action) {
    logger.error("agent:action", "ACTION_MISMATCH", {
      name: call.name,
      data: call.content,
      contextKey,
    });

    throw new NotFoundError(call);
  }

  try {
    const content = call.content.trim();

    let data: any;
    const templates: TemplateInfo[] = [];

    if (action.parser) {
      data = action.parser(call);
    } else if (action.schema && action.schema?._def?.typeName !== "ZodString") {
      if (action.callFormat === "xml") {
        data = parseXMLContent(content);
      } else {
        data = parseJSONContent(content);
      }

      templates.push(...detectTemplates(data));
    } else {
      data = content;
    }

    return { action, data, templates };
  } catch (error) {
    console.log({ error });
    throw new ParsingError(call, error);
  }
}

export async function handleActionCall({
  state,
  workingMemory,
  action,
  logger,
  call,
  taskRunner,
  agent,
  agentState,
  abortSignal,
  pushLog,
}: {
  state: ContextState<AnyContext>;
  workingMemory: WorkingMemory;
  call: ActionCall;
  action: AnyAction;
  logger: Logger;
  taskRunner: TaskRunner;
  agent: AnyAgent;
  agentState?: ContextState;
  abortSignal?: AbortSignal;
  pushLog?: (log: Log) => void;
}) {
  let actionMemory: Memory<any> | undefined = undefined;

  if (action.memory) {
    actionMemory =
      (await agent.memory.store.get(action.memory.key)) ??
      action.memory.create();
  }

  const callCtx: ActionCallContext = {
    ...state,
    workingMemory,
    actionMemory,
    agentMemory: agentState?.memory,
    abortSignal,
    call,
    push(ref) {
      if (pushLog) pushLog(ref);
      else pushToWorkingMemory(workingMemory, ref);
    },
    emit(event, args, options) {
      console.log("emitting", { event, args });

      const eventRef: EventRef = {
        ref: "event",
        id: randomUUIDv7(),
        name: event as string,
        data: args,
        processed: options?.processed ?? true,
        timestamp: Date.now(),
      };

      if (pushLog) pushLog(eventRef);
      else workingMemory.events.push(eventRef);
    },
  };

  call.processed = true;

  const result: ActionResult = {
    ref: "action_result",
    id: randomUUIDv7(),
    callId: call.id,
    data: undefined,
    name: call.name,
    timestamp: Date.now(),
    processed: false,
  };

  const queueKey = action.queueKey
    ? typeof action.queueKey === "function"
      ? action.queueKey(callCtx)
      : action.queueKey
    : undefined;

  result.data = await taskRunner.enqueueTask(
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

  if (action.format) result.formatted = action.format(result);

  if (action.memory) {
    await agent.memory.store.set(action.memory.key, actionMemory);
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
  outputs: OutputCtxRef[];
  logger: Logger;
}) {
  const output = outputs.find((output) => output.type === outputRef.type);

  console.log({ output, outputRef });

  if (!output) {
    throw new NotFoundError(outputRef);
  }

  logger.debug("agent:output", outputRef.type, outputRef.data);

  if (output.schema) {
    const schema = (
      "parse" in output.schema ? output.schema : z.object(output.schema)
    ) as z.AnyZodObject | z.ZodString;

    let parsedContent = outputRef.content;

    try {
      if (typeof parsedContent === "string") {
        if (schema._def.typeName !== "ZodString") {
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
}): Promise<ActionCtxRef[]> {
  const { context, state } = params;
  const actions =
    typeof context.actions === "function"
      ? await Promise.try(context.actions, state)
      : context.actions;

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
  workingMemory,
  agent,
  agentCtxState,
}: {
  output: AnyOutput;
  context: AnyContext;
  state: ContextState<AnyContext>;
  workingMemory: WorkingMemory;
  agent: AnyAgent;
  agentCtxState: ContextState<AnyContext> | undefined;
}): Promise<OutputCtxRef | undefined> {
  if (output.context && output.context.type !== context.type) return undefined;
  const enabled = output.enabled
    ? output.enabled({
        ...state,
        context,
        workingMemory,
      })
    : true;

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
}): Promise<OutputCtxRef[]> {
  return Promise.all(
    Object.entries(params.context.outputs).map(([type, output]) =>
      prepareOutput({
        output: {
          type,
          ...output,
        },
        ...params,
      })
    )
  ).then((t) => t.filter((t) => !!t));
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

  let actionMemory: Memory | undefined = undefined;

  if (action.memory) {
    actionMemory =
      (await agent.memory.store.get(action.memory.key)) ??
      action.memory.create();
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

  if (action.enabled && actionMemory) {
    await agent.memory.store.set(actionMemory.key, actionMemory);
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

export async function prepareContext({
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
    outputs?: Record<string, Omit<Output, "type">>;
    inputs?: Record<string, InputConfig>;
    actions?: AnyAction[];
    contexts?: ContextRef[];
  };
}) {
  await agentCtxState?.context.loader?.(agentCtxState, agent);

  await ctxState?.context.loader?.(ctxState, agent);

  const inputs: Input[] = Object.entries({
    ...agent.inputs,
    ...ctxState.context.inputs,
    ...(params?.inputs ?? {}),
  }).map(([type, input]) => ({
    type,
    ...input,
  }));

  const outputs: OutputCtxRef[] = await Promise.all(
    Object.entries({
      ...agent.outputs,
      ...ctxState.context.outputs,
      ...(params?.outputs ?? {}),
    }).map(([type, output]) =>
      prepareOutput({
        output: {
          type,
          ...output,
        },
        agent,
        agentCtxState,
        context: ctxState.context,
        state: ctxState,
        workingMemory,
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

  const ctxActions = await prepareContextActions({
    agent,
    agentCtxState,
    context: ctxState.context,
    state: ctxState,
    workingMemory,
  });

  actions.push(...ctxActions);

  const subCtxsStates = await Promise.all([
    ...(ctxState?.contexts ?? []).map((ref) => agent.getContextById(ref)),
    ...(params?.contexts ?? []).map((ref) => agent.getContext(ref)),
  ]).then((res) => res.filter((r) => !!r));

  await Promise.all(
    subCtxsStates.map((state) => state.context.loader?.(state, agent))
  );

  const subCtxsStatesInputs: Input[] = subCtxsStates
    .map((state) => Object.entries(state.context.inputs))
    .flat()
    .map(([type, input]) => ({
      type,
      ...input,
    }));

  inputs.push(...subCtxsStatesInputs);

  const subCtxsStatesOutputs: OutputCtxRef[] = await Promise.all(
    subCtxsStates.map((state) =>
      prepareContextOutputs({
        agent,
        agentCtxState,
        context: state.context,
        state: state,
        workingMemory,
      })
    )
  ).then((r) => r.flat());

  outputs.push(...subCtxsStatesOutputs);

  const subCtxsActions = await Promise.all(
    subCtxsStates.map((state) =>
      prepareContextActions({
        agent,
        agentCtxState,
        context: state.context,
        state: state,
        workingMemory,
      })
    )
  );

  actions.push(...subCtxsActions.flat());

  const contexts = [agentCtxState, ctxState, ...subCtxsStates].filter(
    (t) => !!t
  );

  return {
    contexts,
    outputs,
    actions,
    inputs,
  };
}

export async function handleInput({
  inputs,
  inputRef,
  logger,
  ctxState,
  workingMemory,
  agent,
}: {
  inputs: Record<string, InputConfig>;
  inputRef: InputRef;
  logger: Logger;
  workingMemory: WorkingMemory;
  ctxState: ContextState;
  agent: AnyAgent;
}) {
  const input = inputs[inputRef.type];

  if (!input) {
    throw new NotFoundError(inputRef);
  }

  try {
    if (input.schema) {
      const schema = (
        "parse" in input.schema ? input.schema : z.object(input.schema)
      ) as z.AnyZodObject | z.ZodString;
      inputRef.data = schema.parse(inputRef.content);
    } else {
      inputRef.data = z.string().parse(inputRef.content);
    }
  } catch (error) {
    throw new ParsingError(inputRef, error);
  }

  logger.debug("agent:send", "Querying episodic memory");

  const episodicMemory = await agent.memory.vector.query(
    `${ctxState.id}`,
    JSON.stringify(inputRef.data)
  );

  logger.trace("agent:send", "Episodic memory retrieved", {
    episodesCount: episodicMemory.length,
  });

  workingMemory.episodicMemory = {
    episodes: episodicMemory,
  };

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
