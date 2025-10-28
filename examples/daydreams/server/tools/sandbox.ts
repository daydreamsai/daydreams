import { tool } from "ai";
import * as z from "zod";
import { createToolSet } from "../utils";
import { Sandbox } from "@e2b/code-interpreter";
import { env } from "bun";
const e2bApiKey = env.E2B_API_KEY;

export type SandboxTools = typeof sanboxTools;

export const sanboxTools = createToolSet({
  "sandbox.runCode": tool({
    parameters: z.object({
      code: z.string(),
      language: z.enum(["python", "js"]),
      sandboxId: z.string(),
    }),
    execute: async ({ code, language, sandboxId }) => {
      const sdx = sandboxId
        ? await Sandbox.connect(sandboxId, { apiKey: e2bApiKey })
        : await Sandbox.create({ apiKey: e2bApiKey });

      const response = await sdx.runCode(code, {
        language,
        onStdout(output) {
          console.log("out", output);
        },
        onStderr(output) {
          console.log("err", output);
        },
      });

      return response;
    },
  }),
  "sandbox.files.list": tool({
    parameters: z.object({
      path: z.string(),
      sandboxId: z.string(),
    }),
    execute: async ({ path, sandboxId }) => {
      const sdx = sandboxId
        ? await Sandbox.connect(sandboxId, { apiKey: e2bApiKey })
        : await Sandbox.create({ apiKey: e2bApiKey });
      return await sdx.files.list(path);
    },
  }),
  "sandbox.files.read": tool({
    parameters: z.object({
      path: z.string(),
      sandboxId: z.string(),
    }),
    execute: async ({ path, sandboxId }) => {
      const sdx = sandboxId
        ? await Sandbox.connect(sandboxId, { apiKey: e2bApiKey })
        : await Sandbox.create({ apiKey: e2bApiKey });
      return await sdx.files.read(path);
    },
  }),
  "sandbox.files.write": tool({
    parameters: z.object({
      path: z.string(),
      content: z.string(),
      sandboxId: z.string(),
    }),
    execute: async ({ path, content, sandboxId }) => {
      const sdx = sandboxId
        ? await Sandbox.connect(sandboxId, { apiKey: e2bApiKey })
        : await Sandbox.create({ apiKey: e2bApiKey });
      return await sdx.files.write(path, content);
    },
  }),
  "sandbox.files.rename": tool({
    parameters: z.object({
      oldPath: z.string(),
      newPath: z.string(),
      sandboxId: z.string(),
    }),
    execute: async ({ oldPath, newPath, sandboxId }) => {
      const sdx = sandboxId
        ? await Sandbox.connect(sandboxId, { apiKey: e2bApiKey })
        : await Sandbox.create({ apiKey: e2bApiKey });
      return await sdx.files.rename(oldPath, newPath);
    },
  }),
  "sandbox.commands.run": tool({
    parameters: z.object({
      sandboxId: z.string(),
      cmd: z.string(),
      background: z.boolean().optional().default(false),
      // cwd: z.string().optional().describe("the working directory"),
      envs: z.record(z.string()).optional(),
    }),
    execute: async ({ cmd, background, envs, sandboxId }) => {
      const sdx = sandboxId
        ? await Sandbox.connect(sandboxId, { apiKey: e2bApiKey })
        : await Sandbox.create({ apiKey: e2bApiKey });
      return await sdx.commands.run(cmd, {
        background: background as any,
        // cwd,
        envs,
        onStdout(data) {
          console.log(data);
        },
      });
    },
  }),
});
