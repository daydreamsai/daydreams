import { env, type RouterTypes } from "bun";
import { sanboxTools } from "./tools/sandbox";
import { basicTools } from "./tools/utils";
import { createToolsApi } from "./tools/api";
import { createMcpProxyApi, type McpServerConfig } from "./mcp/api";
import path from "path";
import { createStorageApi } from "./storage";
import fsLiteDriver from "unstorage/drivers/fs-lite";

export function createServer<
  R extends { [K in keyof R]: RouterTypes.RouteValue<K & string> },
>(params: { routes: R }) {
  const server = Bun.serve({
    port: 5555,
    routes: {
      "/ping": () => {
        return new Response("pong");
      },
      ...params.routes,
    },
  });
  return server;
}

const tools = {
  ...sanboxTools,
  ...basicTools,
};

export type ServerTools = typeof tools;

const mcpServers: McpServerConfig[] = [
  {
    id: "example-server",
    name: "Example Resource Server",
    transport: {
      type: "stdio",
      command: "tsx",
      args: [path.join(__dirname, "./mcp/servers/example.ts")],
    },
  },
  {
    id: "github",
    name: "GitHub MCP Server",
    transport: {
      type: "stdio",
      command: "docker",
      args: [
        "run",
        "-i",
        "--rm",
        "-e",
        "GITHUB_PERSONAL_ACCESS_TOKEN",
        "ghcr.io/github/github-mcp-server",
      ],
    },
    env: {
      GITHUB_PERSONAL_ACCESS_TOKEN: env.GITHUB_TOKEN!,
    },
  },
];

const mcpApi = await createMcpProxyApi({
  servers: mcpServers,
});

const server = createServer({
  routes: {
    ...createToolsApi({ tools }),
    ...createStorageApi(fsLiteDriver({ base: "./data/storage" })),
    ...mcpApi,
  },
});
