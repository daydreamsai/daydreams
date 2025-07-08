import type { AnyOutput, Output } from "@/types/components";
import type { AnyContext, Context, ContextState } from "@/types/context";
import type { Engine } from "@/types/engine";
import type { WorkingMemoryCtx } from "@/types/wm";
import type { OutputCtxRef } from "@/types/refs";
import type { OutputMemory } from "@/types/wm";
import type { AnyAgent } from "@/types/agent";
import { NotFoundError, ParsingError } from "./errors";
import { parseContent, parseSchema } from "./parse";
import type { MemoryHandlerParams } from "../router";

export async function resolveOutput({
  memory,
  outputs,
}: {
  memory: OutputMemory;
  outputs: OutputCtxRef[];
}) {
  const output = outputs.find((ref) => ref.output.name === memory.name);
  if (!output) throw new NotFoundError(memory);
  return output;
}

export async function handleOutput({
  agent,
  ...params
}: MemoryHandlerParams<OutputMemory> & {
  output: OutputCtxRef;
}): Promise<OutputMemory> {
  const { output: outputRef, memory } = params;
  if (outputRef.output.handler) {
    await Promise.try(outputRef.output.handler, memory.content, params, agent);
  }
  return memory;
}

export async function prepareOutputMemory({
  memory,
  output: outputRef,
}: {
  memory: OutputMemory;
  output: OutputCtxRef;
}) {
  try {
    if (memory.chunks.length > 0) {
      memory.raw = memory.chunks
        .filter((chunk) => chunk.type === "content")
        .map((c) => c.content)
        .join("")
        .trim();
    }

    memory.content = parseContent({
      content: memory.raw,
      schema: outputRef.output.schema,
      parser: outputRef.output.outputFormat,
    });

    if (outputRef.output.schema) {
      memory.content = parseSchema(outputRef.output.schema, memory.content);
    }
  } catch (error) {
    throw new ParsingError(memory, error);
  }
}

export async function prepareOutput({
  output,
  context,
  ctx,
  wm,
  engine,
}: {
  output: AnyOutput;
  context: AnyContext;
  ctx: ContextState<AnyContext>;
  wm: WorkingMemoryCtx;
  engine: Engine;
}): Promise<OutputCtxRef | undefined> {
  if (output.context && output.context.name !== context.name) return undefined;

  const enabled = output.enabled ? output.enabled({ ctx, wm, engine }) : true;

  return enabled
    ? {
        output,
        ctx: {
          name: ctx.context.name,
          id: ctx.id,
        },
      }
    : undefined;
}

export async function prepareOutputs({
  context,
  ctx,
  wm,
  engine,
  agent,
}: {
  context: Context;
  ctx: ContextState<AnyContext>;
  wm: WorkingMemoryCtx;
  engine: Engine;
  agent: AnyAgent;
}): Promise<OutputCtxRef[]> {
  const uses =
    context.uses && typeof context.uses === "function"
      ? await context.uses(ctx, agent)
      : (context.uses ?? {});

  return uses.outputs
    ? Promise.all(
        Object.entries(uses.outputs).map(([name, output]) =>
          prepareOutput({
            output: {
              name,
              ...output,
            },
            context,
            ctx,
            wm,
            engine,
          })
        )
      ).then((t) => t.filter((t) => !!t))
    : [];
}
