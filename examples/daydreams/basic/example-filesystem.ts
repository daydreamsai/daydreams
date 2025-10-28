/**
 * An agent that can interact with the local file system in a sandboxed way.
 * It can list, read, and write files within a specific workspace directory.
 */
import {
  createDreams,
  action,
  validateEnv,
  LogLevel,
  Logger,
  context,
} from "@daydreamsai/core";
import { cliExtension } from "@daydreamsai/cli";
import { anthropic } from "@ai-sdk/anthropic";
import * as z from "zod";
import fs from "node:fs/promises";
import path from "node:path";

// 1. Validate environment variables
validateEnv(
  z.object({
    OPENROUTER_API_KEY: z.string().min(1),
  })
);

// Create a workspace directory for safety
const workspaceDir = path.resolve("./file-agent-workspace");
fs.mkdir(workspaceDir, { recursive: true });

// Helper to resolve safe paths and prevent directory traversal
const resolveSafePath = (userPath: string) => {
  const resolvedPath = path.resolve(workspaceDir, userPath);
  if (!resolvedPath.startsWith(workspaceDir)) {
    throw new Error("Access to paths outside the workspace is denied.");
  }
  return resolvedPath;
};

// 2. Define file system actions
const listFilesAction = action({
  name: "listFiles",
  description:
    "Lists files and directories in a specified path within the workspace.",
  schema: z.object({
    path: z
      .string()
      .default(".")
      .describe("The path to list files from, relative to the workspace."),
  }),
  async handler({ path: dirPath }) {
    const safePath = resolveSafePath(dirPath);
    const files = await fs.readdir(safePath);
    return { files };
  },
});

const readFileAction = action({
  name: "readFile",
  description: "Reads the content of a specified file within the workspace.",
  schema: z.object({
    path: z
      .string()
      .describe("The path of the file to read, relative to the workspace."),
  }),
  async handler({ path: filePath }) {
    const safePath = resolveSafePath(filePath);
    const content = await fs.readFile(safePath, "utf-8");
    return { content };
  },
});

const writeFileAction = action({
  name: "writeFile",
  description:
    "Writes content to a specified file within the workspace. Overwrites existing files.",
  schema: z.object({
    path: z
      .string()
      .describe("The path of the file to write to, relative to the workspace."),
    content: z.string().describe("The content to write to the file."),
  }),
  async handler({ path: filePath, content }) {
    const safePath = resolveSafePath(filePath);
    await fs.writeFile(safePath, content, "utf-8");
    return { success: true, path: filePath };
  },
});

// 3. Define a context to instruct the agent
const fileAgentContext = context({
  type: "filesystem-agent",
  schema: z.object({}),
  instructions: `You are a helpful AI assistant that can interact with a file system. You can list, read, and write files within the './file-agent-workspace' directory.
    When asked to perform a file operation, use the available tools.
    For example:
    - "List all files" should call listFiles with path ".".
    - "Read the file named 'hello.txt'" should call readFile with path "hello.txt".
    - "Create a file 'test.txt' with content 'hello world'" should call writeFile with path "test.txt" and the content.
  `,
});

// 4. Create the agent
const agent = createDreams({
  model: anthropic("claude-4-sonnet"),
  logger: new Logger({ level: LogLevel.DEBUG }),
  extensions: [cliExtension],
  actions: [listFilesAction, readFileAction, writeFileAction],
  contexts: [fileAgentContext],
});

// 5. Start the agent
agent.start();

console.log(
  `File system agent started. You can now interact with files in the '${workspaceDir}' directory via the CLI.`
);
