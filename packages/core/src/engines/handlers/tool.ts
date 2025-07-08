import type { ToolCallContext, ToolConfig, AnyTool } from "@/types/tool";
import type {
  ToolCallMemory,
  ToolResultMemory,
  WorkingMemoryCtx,
} from "@/types/wm";
import { parseContent, parseSchema } from "./parse";
import { NotFoundError, ParsingError } from "./errors";
import type { ToolCtxRef } from "@/types/refs";
import type { AnyContext, Context, ContextState } from "@/types/context";
import type { AnyAgent } from "@/types/agent";
import type { Engine } from "@/types/engine";
import { workingMemories } from "@/wm";

export function parseToolCallContent({
  memory,
  tool,
}: {
  memory: ToolCallMemory;
  tool: AnyTool;
}) {
  try {
    if (tool.parser) {
      return tool.parser(memory);
    } else {
      return parseContent({
        content: memory.content.trim(),
        schema: tool.schema,
        parser: tool.callFormat,
      });
    }
  } catch (error) {
    throw new ParsingError(memory, error);
  }
}

export async function resolveToolCall({
  memory,
  tools,
}: {
  memory: ToolCallMemory;
  tools: ToolCtxRef[];
}) {
  const [_, name] = memory.kind.split(".");
  const tool = tools.find((ref) => ref.tool.name === name);
  if (!tool) throw new NotFoundError(memory);
  return tool;
}

export async function prepareTool({
  tool,
  ctx,
}: {
  tool: AnyTool;
  ctx: ContextState<AnyContext>;
}): Promise<ToolCtxRef | undefined> {
  return {
    tool,
    ctx: {
      name: ctx.context.name,
      id: ctx.id,
    },
  };
}

export async function prepareTools(params: {
  context: Context;
  ctx: ContextState<AnyContext>;
  agent: AnyAgent;
  tools: AnyTool[] | Record<string, ToolConfig>;
}): Promise<ToolCtxRef[]> {
  return Promise.all(
    Array.isArray(params.tools)
      ? params.tools.map((tool) =>
          prepareTool({
            tool,
            ...params,
          })
        )
      : Object.entries(params.tools).map(([name, tool]) =>
          prepareTool({
            tool: {
              name,
              ...tool,
            },
            ...params,
          })
        )
  ).then((t) => t.filter((t) => !!t));
}

export async function handleToolCall({
  tool,
  agent,
  ctx,
}: {
  ctx: ToolCallContext;
  tool: AnyTool;
  agent: AnyAgent;
}): Promise<ToolResultMemory> {
  const data = await tool.handler(ctx.memory.content, ctx, agent);
  const result = workingMemories.tool_result({
    name: tool.name,
    schema: tool.schema,
    content: data,
  });

  if (tool.onSuccess) {
    await Promise.try(tool.onSuccess, result, ctx, agent);
  }
  return result;
}

export async function prepareToolCall({
  memory,
  tool,
  ctx,
  wm,
  abortSignal,
  engine,
}: {
  memory: ToolCallMemory;
  tool: AnyTool;
  ctx: ContextState<AnyContext>;
  wm: WorkingMemoryCtx;
  abortSignal: AbortSignal;
  engine: Engine;
}) {
  const callCtx: ToolCallContext = {
    ctx,
    wm,
    engine,
    memory,
    abortSignal,
    tool,
  };

  memory.content = memory.raw
    ? parseSchema(tool.schema, memory.raw)
    : parseToolCallContent({ memory, tool });

  return callCtx;
}
