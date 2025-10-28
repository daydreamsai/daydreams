import { type CoreMessage } from "ai";
import { z } from "zod";
import { randomUUIDv7, type RouterTypes } from "bun";
import { api, type ToolSet } from "../utils";

export function createToolsApi<Tools extends ToolSet>({
  tools,
}: {
  tools: {
    [K in keyof Tools]: Tools[K];
  };
}) {
  return api(() => {
    const state = {
      tools: Object.entries(tools as ToolSet).map(([name, tool]) => ({
        name,
        ...tool,
      })),
    };
    return {
      "/api/tools": {
        GET: async () => {
          return Response.json({
            tools: state.tools.map((tool) => ({
              name: tool.name,
              description: tool.description,
              parameters: z.toJSONSchema(tool.parameters).definitions![
                "schema"
              ],
            })),
          });
        },
      },
      "/api/tools/:tool": {
        POST: async (req) => {
          const data = (await req.json()) as {
            args: any;
            messages?: CoreMessage[];
            toolCallId?: string;
          };

          const tool = state.tools.find(
            (tool) => tool.name === req.params.tool
          )!;
          const args = tool.parameters.parse(data.args);
          const toolCallId = data.toolCallId ?? randomUUIDv7();

          try {
            const result = tool.execute
              ? await tool.execute(args, {
                  messages: data.messages ?? [],
                  toolCallId,
                  abortSignal: req.signal,
                })
              : args;
            return Response.json({
              tool: req.params.tool,
              toolCallId,
              result,
            });
          } catch (error) {
            return Response.json({
              tool: req.params.tool,
              toolCallId,
              result: {
                error,
                message: error instanceof Error ? error.message : undefined,
              },
            });
          }
        },
      },
    };
  });
}
