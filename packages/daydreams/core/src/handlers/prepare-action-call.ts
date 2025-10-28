import type {
  AnyAgent,
  AnyContext,
  ContextState,
  WorkingMemory,
  ActionCtxRef,
  ContextStateApi,
  ActionCall,
  ActionCallContext,
  MaybePromise,
} from "../types";

import { parseActionCallContent } from "./parse-action-call-content";
import { detectTemplates, type TemplateInfo } from "./resolvers";
import { resolveTemplates } from "./resolvers";
import { ParsingError } from "../types";
import { z } from "zod";
import type { Logger } from "../logger";
import { jsonSchema } from "ai";

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
