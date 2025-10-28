import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

/**
 * Creates and connects an MCP client to a server
 * @param options Configuration options for the MCP client
 * @returns Connected MCP client instance
 */
export async function createMcpClient(options: {
  // Client identification
  clientInfo?: {
    name: string;
    version: string;
  };
  // Transport configuration
  transport: {
    type: "stdio" | "sse";
    // For stdio transport
    command?: string;
    args?: string[];
    // For SSE transport
    serverUrl?: string;
    sseEndpoint?: string;
    messageEndpoint?: string;
  };
  // Capabilities to request from the server
  capabilities?: {
    prompts?: Record<string, unknown>;
    resources?: Record<string, unknown>;
    tools?: Record<string, unknown>;
  };
  env?: Record<string, string>;
}) {
  // Set default client info if not provided
  const clientInfo = options.clientInfo || {
    name: "generic-mcp-client",
    version: "1.0.0",
  };

  // Set default capabilities if not provided
  const capabilities = options.capabilities || {
    prompts: {},
    resources: {},
    tools: {},
  };

  // Create the appropriate transport based on the type
  let transport;
  if (options.transport.type === "stdio") {
    if (!options.transport.command) {
      throw new Error("Command is required for stdio transport");
    }

    transport = new StdioClientTransport({
      command: options.transport.command,
      args: options.transport.args || [],
      env: options.env,
    });
  } else if (options.transport.type === "sse") {
    if (!options.transport.serverUrl) {
      throw new Error("Server URL is required for SSE transport");
    }

    // Create the SSE transport with the correct configuration
    // Convert string URL to URL object
    const serverUrl = new URL(options.transport.serverUrl);
    transport = new SSEClientTransport(serverUrl);
  } else {
    throw new Error(`Unsupported transport type: ${options.transport.type}`);
  }

  // Create the client
  const client = new Client(clientInfo, { capabilities });

  // Connect to the server
  await client.connect(transport);

  return client;
}
