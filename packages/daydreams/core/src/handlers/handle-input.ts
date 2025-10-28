import type { MemoryResult, RecallOptions } from "../memory";
import {
  NotFoundError,
  ParsingError,
  type AnyAgent,
  type ContextState,
  type Input,
  type InputRef,
  type RetrievalPolicy,
} from "../types";
import type { WorkingMemoryData } from "../memory";
import type { Logger } from "../logger";
import z from "zod";

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
