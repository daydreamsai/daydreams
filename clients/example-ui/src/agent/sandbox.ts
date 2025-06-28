import { action, context, extension, randomUUIDv7 } from "@daydreamsai/core";
import { Sandbox, SandboxInfo } from "@e2b/code-interpreter";
import * as z from "zod/v4";
import { createToolClient, createToolClientProxy } from "./serverTools";
import { SandboxTools } from "../../../../examples/server/tools/sandbox";

export const sandbox = extension({
  name: "sanddox",
});

export const sandboxContext = context({
  type: "sandbox",
  description: "Access a Linux sandbox environment with internet connection",
  instructions: `\
<command_rules>
- Avoid commands requiring interactive confirmation; use flags like -y or -f for automatic confirmation where appropriate.
- Avoid commands that produce excessively large amounts of output directly to stdout/stderr. Redirect lengthy output to files within the sandbox when necessary.
- Chain multiple related commands using &amp;&amp; to minimize interruptions and separate action calls.
- Use the pipe operator (|) to pass output between commands within a single cmd execution for efficient processing.
</command_rules>

<file_rules>
- Key Principle: Manage files efficiently, especially large ones. Avoid transferring large amounts of raw file data directly into the chat context unless absolutely necessary.

- Reading Files (sandbox.files.read):
    - Use sandbox.files.read primarily for small configuration files, scripts, or text-based data that you need to process or analyze directly.
    - AVOID using sandbox.files.read for large files, such as images, PDFs, executables, large datasets, or extensive logs. Reading large files directly into the context is inefficient and often provides data in an unusable format (e.g., base64 encoding).
    
- Writing Files (sandbox.files.write):
    - Use file writing tools for creating or modifying files. This is generally safer and more reliable than using complex shell commands like echo "..." > file for substantial content, as it avoids shell escaping issues.
    - Actively save intermediate results of commands or analyses to files within the sandbox.
    - Store different types of reference information or outputs in separate, appropriately named files.
    - When merging text files, use the append capability of file writing tools if available, or appropriate shell commands like cat file1 file2 >> target_file.
    
- Transferring Files Out (sandbox.files.download):
    - This is the preferred method for sharing files (especially larger ones or binary files) generated in the sandbox with the user.
    - This makes the file's content accessible to the user without loading it into the chat context.

- Transferring Files Out (artifact.createFromSandboxFile):
    - This is the method for sharing files (especially small files, or files that has the same contentTypes available in artifacts) generated in the sandbox with the user.
    - Use artifact.createFromSandboxFile to create an artifact directly from a file within the sandbox, this will also load the file into the chat context.
    
- Transferring Files In (sandbox.files.createFromArtifact):
  - Use this action to load data from an existing artifact into a file within the sandbox for processing.
</file_rules>
`,
  schema: z.object({ user: z.string() }),
  key: ({ user }) => user,
  async setup(args, agent) {
    const tools = createToolClientProxy<SandboxTools>(
      createToolClient("/proxy/tools-server")
    );

    // get key by user
    return {
      apiKey: import.meta.env.VITE_EB2_API_KEY,
      tools,
    };
  },
  create({}): { sandboxes: SandboxInfo[] } {
    return {
      sandboxes: [],
    };
  },
  async loader({ memory, options }) {
    memory.sandboxes = await Sandbox.list({ apiKey: options.apiKey });
  },
}).setActions([
  action({
    name: "sandbox.list",
    schema: undefined,
    handler: async ({ context, options }) => {
      return Sandbox.list({
        apiKey: options.apiKey,
      });
    },
  }),
  action({
    name: "sandbox.create",
    instructions: "Use this to create a sandbox it will return a sandboxId",
    schema: {
      timeoutMins: z
        .number()
        .max(60)
        .default(5)
        .describe("The timeout of the sandbox in minutes"),
    },
    handler: async ({ timeoutMins }, { options }) => {
      const timeoutMs = timeoutMins * 60 * 1000;
      const sbx = await Sandbox.create({
        apiKey: options.apiKey,
        timeoutMs,
      });
      return {
        sandboxId: sbx.sandboxId,
        timeout: new Date(Date.now() + timeoutMs).toISOString(),
      };
    },
  }),
  action({
    name: "sandbox.setTimeout",
    schema: {
      sandboxId: z.string(),
      timeoutMins: z
        .number()
        .max(60)
        .describe("The timeout of the sandbox in minutes"),
    },
    description:
      "Set the timeout of the specified sandbox. After the timeout expires the sandbox will be automatically killed.",
    instructions: `\
This method can extend or reduce the sandbox timeout set when creating the sandbox or from the last call to sandbox.setTimeout.
Maximum time a sandbox can be kept alive is 1 hour`,
    handler: async ({ sandboxId, timeoutMins }, { options }) => {
      await Sandbox.setTimeout(sandboxId, timeoutMins * 60 * 1000, {
        apiKey: options.apiKey,
      });
      return { success: true };
    },
  }),
  action({
    name: "sandbox.kill",
    schema: {
      sandboxId: z.string(),
    },
    handler: async ({ sandboxId }, { context, options }) => {
      console.log({ context });
      const success = await Sandbox.kill(sandboxId, { apiKey: options.apiKey });
      return { success };
    },
  }),
  action({
    name: "sandbox.files.createFromArtifact",
    schema: {
      artifactId: z.string().describe("The identifier of the source artifact."),
      sandboxId: z.string(),
      path: z.string(),
    },
    handler: async (
      { sandboxId, path, artifactId },
      { workingMemory, options }
    ) => {
      const artifact = workingMemory.outputs.findLast(
        (output) =>
          output.type === "artifact" && output.params!.identifier === artifactId
      );

      const res = await options.tools["sandbox.files.write"]({
        path,
        sandboxId,
        content: artifact!.content,
      });

      return res;
    },
  }),
  action({
    name: "sandbox.files.download",
    schema: {
      path: z.string(),
      sandboxId: z.string(),
    },
    handler: async ({ sandboxId, path }, { options }, agent) => {
      const content = await options.tools["sandbox.files.read"]({
        path,
        sandboxId,
      });

      console.log(`sandbox:://${sandboxId}/${path}`);

      await agent.memory.kv.set(`sandbox:://${sandboxId}/${path}`, content);

      return "Saved";
    },
  }),
  action({
    name: "artifact.createFromSandboxFile",
    schema: {
      sandboxId: z.string(),
      path: z
        .string()
        .describe("The path within the sandbox of the file to read."),

      identifier: z.string().describe("Identifier of the artifact"),
      title: z.string().describe("The title of the artifact"),

      contentType: z
        .string()
        .describe(
          "Content type hint for the artifact (e.g., 'application/vnd.ant.code', 'text/markdown')"
        ),
    },
    handler: async (
      { path, sandboxId, identifier, title, contentType },
      { options, push }
    ) => {
      const content = await options.tools["sandbox.files.read"]({
        path,
        sandboxId,
      });

      push({
        ref: "output",
        id: randomUUIDv7(),
        type: "artifact",
        content: content,
        processed: true,
        timestamp: Date.now(),
        params: { identifier, title, contentType },
        data: undefined,
      });

      return "Success";
    },
  }),
]);
