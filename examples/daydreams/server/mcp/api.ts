import { createMcpClient } from "@daydreamsai/mcp";
import { Client as McpClient } from "@modelcontextprotocol/sdk/client/index.js";
import path from "path";
import { env } from "bun";
import { api } from "../utils";

export interface McpServerConfig {
  id: string;
  name: string;
  transport:
    | {
        type: "stdio";
        // For stdio transport
        command?: string;
        args?: string[];
      }
    | {
        type: "sse";
        // For SSE transport
        serverUrl?: string;
        sseEndpoint?: string;
        messageEndpoint?: string;
      };
  capabilities?: {
    prompts?: Record<string, unknown>;
    resources?: Record<string, unknown>;
    tools?: Record<string, unknown>;
  };
  env?: Record<string, string>;
}

export async function createMcpProxyApi({
  servers,
}: {
  servers: McpServerConfig[];
}) {
  const clients = new Map<string, McpClient>();

  for (const config of servers) {
    const client = await createMcpClient(config);
    clients.set(config.id, client);
  }

  return api({
    "/api/mcp/servers": async (req) => {
      return Response.json({
        servers: servers.map(({ id, name }) => ({ id, name })),
      });
    },
    "/api/mcp/servers/:serverId/tools": async (req) => {
      const { serverId } = req.params;
      const client = clients.get(serverId);
      if (!client) throw new Error("Unknow client");
      const { tools } = await client!.listTools();
      return Response.json({
        tools,
      });
    },
    "/api/mcp/servers/:serverId/tools/:tool": async (req) => {
      if (req.method !== "POST") {
        return new Response("Method not allowed", {
          status: 405,
        });
      }

      const { serverId, tool } = req.params;
      const client = clients.get(serverId);
      if (!client) throw new Error("Unknow client");

      const data = (await req.json()) as {
        args: any;
      };

      try {
        const result = await client.callTool({
          name: tool,
          arguments: data.args,
        });

        // const toolResult = JSON.parse((result.content as any)[0].text);
        return Response.json({
          serverId,
          tool: req.params.tool,
          result: result.content,
        });
      } catch (error) {
        return Response.json({
          serverId,
          tool,
          result: {
            error,
            message: error instanceof Error ? error.message : undefined,
          },
        });
      }
    },
    "/api/mcp/servers/:serverId/prompts": async (req) => {
      const { serverId } = req.params;
      const client = clients.get(serverId);
      if (!client) throw new Error("Unknow client");
      const res = await client!.listPrompts();
      return Response.json(res);
    },
    "/api/mcp/servers/:serverId/resources": async (req) => {
      const { serverId } = req.params;
      const client = clients.get(serverId);
      if (!client) throw new Error("Unknow client");
      const res = await client!.listResources();
      return Response.json(res);
    },
  });
}
