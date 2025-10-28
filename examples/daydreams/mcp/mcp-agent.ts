import { createDreams, Logger } from "@daydreamsai/core";
import { createMcpExtension } from "@daydreamsai/mcp";
import { LogLevel } from "@daydreamsai/core";
import path from "path";
import { groq } from "@ai-sdk/groq";
import { cli } from "@daydreamsai/cli";

/**
 * This example demonstrates how to create an agent that connects to an MCP server
 * and uses its resources through the MCP extension.
 *
 * It sets up a connection to a local MCP server that provides access to resources
 * like application logs.
 */

// Create an agent with the MCP extension
createDreams({
  model: groq("deepseek-r1-distill-llama-70b"),
  logger: new Logger({
    level: LogLevel.INFO,
  }),
  contexts: [cli],
  // Add the MCP extension with the example server configuration
  extensions: [
    createMcpExtension([
      {
        id: "example-server",
        name: "Example Resource Server",
        transport: {
          type: "stdio",
          command: "tsx",
          args: [path.join(__dirname, "mcp-server-example.ts")],
        },
      },
    ]),
  ],
}).start();
