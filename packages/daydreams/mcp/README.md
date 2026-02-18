# MCP Integration for Daydreams

This module provides integration with the Model Context Protocol (MCP), allowing
Daydreams agents to connect to any MCP server and access its resources, prompts,
and tools.

## Overview

The Model Context Protocol (MCP) allows applications to provide context for LLMs
in a standardized way, separating the concerns of providing context from the
actual LLM interaction. This integration enables Daydreams agents to:

- Connect to multiple MCP servers simultaneously
- Access resources from MCP servers
- Execute tools provided by MCP servers
- Use prompts defined on MCP servers

## Usage

### Basic Setup

To connect your Daydreams agent to one or more MCP servers, add the MCP
extension to your agent configuration:

```typescript
import { createDreams } from "@daydreamsai/core";
import { createMcpExtension } from "@daydreamsai/mcp";

const agent = createDreams({
  // ... other agent configuration
  extensions: [
    createMcpExtension([
      {
        id: "sqlite-explorer",
        name: "SQLite Explorer",
        transport: {
          type: "stdio",
          command: "node",
          args: ["path/to/sqlite-explorer-server.js"],
        },
      },
      {
        id: "web-search",
        name: "Web Search Service",
        transport: {
          type: "sse",
          serverUrl: "http://localhost:3001",
        },
      },
    ]),
    // ... other extensions
  ],
});

await agent.start();
```

### Available Actions

The MCP extension adds the following actions to your agent:

#### List MCP Servers

```typescript
// List all connected MCP servers
const result = await ctx.callAction("mcp.listServers", {});
```

#### List Prompts

```typescript
// List all prompts available on a specific MCP server
const result = await ctx.callAction("mcp.listPrompts", {
  serverId: "sqlite-explorer",
});
```

#### Get a Prompt

```typescript
// Get a specific prompt from an MCP server
const result = await ctx.callAction("mcp.getPrompt", {
  serverId: "sqlite-explorer",
  name: "query-database",
  arguments: {
    table: "users",
  },
});
```

#### List Resources

```typescript
// List all resources available on a specific MCP server
const result = await ctx.callAction("mcp.listResources", {
  serverId: "sqlite-explorer",
});
```

#### Read a Resource

```typescript
// Read a specific resource from an MCP server
const result = await ctx.callAction("mcp.readResource", {
  serverId: "sqlite-explorer",
  uri: "schema://main",
});
```

#### Call a Tool

```typescript
// Call a tool on an MCP server
const result = await ctx.callAction("mcp.callTool", {
  serverId: "sqlite-explorer",
  name: "query",
  arguments: {
    sql: "SELECT * FROM users LIMIT 10",
  },
});
```

## Transport Types

The MCP extension supports two types of transports:

### stdio

Use this for local MCP servers that run as separate processes:

```typescript
{
  id: "local-server",
  name: "Local MCP Server",
  transport: {
    type: "stdio",
    command: "node",
    args: ["server.js"],
  },
}
```

### SSE (Server-Sent Events)

Use this for remote MCP servers that expose an HTTP API with SSE:

```typescript
{
  id: "remote-server",
  name: "Remote MCP Server",
  transport: {
    type: "sse",
    serverUrl: "http://example.com",
    sseEndpoint: "/sse",      // Optional, defaults to "/sse"
    messageEndpoint: "/messages", // Optional, defaults to "/messages"
  },
}
```

## Error Handling

All MCP actions return an `error` field if something goes wrong. You can check
for this field to handle errors:

```typescript
const result = await ctx.callAction("mcp.callTool", {
  serverId: "sqlite-explorer",
  name: "query",
  arguments: {
    sql: "SELECT * FROM users LIMIT 10",
  },
});

if (result.error) {
  console.error("Error calling MCP tool:", result.error);
} else {
  console.log("Tool result:", result.result);
}
```
