import { context, createDreams, LogLevel, render, validateEnv } from "@daydreamsai/core";
import { cli } from "@daydreamsai/core/extensions";
import { anthropic } from "@ai-sdk/anthropic";
import { browserAutomationAction } from "./browser-action";
import { z } from "zod";
import { executeBashAction, executeLongRunningBashAction } from "../computer-usage/bash-actions";

// 验证环境变量
validateEnv(
  z.object({
    ANTHROPIC_API_KEY: z.string(),
    OPENAI_API_KEY: z.string(),
  })
);


const BrowserSearchContext = context({
  type: "BrowserSearch",
  description: "Browser search context",
  schema: z.object({
    workingDirectory: z.string().default(process.cwd()),
    task: z.string().optional().default(""),
  }),

  create(state) {
    return {
      workingDirectory: state.args.workingDirectory || process.cwd(),
      search_result: null,
      task: state.args.task || "",
      search_directory: "./examples/v1/web3-manus",
      file_path: "search_browser_result.md",
    };
  },

  render({ memory }) {
    return render(
      `
      Browser Search Result
      ----------------------
      Working Directory: {{workingDirectory}}
      Search Result: {{search_result}}
      Task: {{task}}
      File Path: {{file_path}}
      `,
      {
        workingDirectory: memory.workingDirectory,
        search_result: memory.search_result || "None",
        task: memory.task,
        file_path: memory.file_path,
      }
    );
  },
});
async function main() {

  const agent = await createDreams({
    logger: LogLevel.DEBUG,
    model: anthropic("claude-3-7-sonnet-latest"),
    extensions: [cli],
    context: BrowserSearchContext,
    actions: [
        browserAutomationAction
    ],
  }).start({
    workingDirectory: process.cwd(),
    task: "",
  });

  console.log("agent has started");
}



main().catch(console.error); 