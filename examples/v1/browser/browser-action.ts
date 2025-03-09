import { z } from "zod";
import { action, context } from "@daydreamsai/core";
import { spawn } from "child_process";
import path from "path";
import { readFile } from "fs/promises";
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

export const browserAutomationAction = action({
  name: "Search Browser",
  description: "This action is used to search the browser for a given task",
  schema: z.object({
    task: z.string().describe("The task to perform in browser"),
    search_directory: z.string().optional().default("./").describe("File path to save the result"),
    file_path: z.string().optional().default("search_browser_result.md").describe("File path to save the result"),
    timeout: z.number().optional().default(6000000).describe("Timeout in ms"),
  }),

  async handler(call, {memory}) {
    try {
      const { task, file_path, search_directory, timeout } = call.data;

      console.log("task", task);
      console.log("file_path", file_path);
      
      const scriptPath = path.join(__dirname, `${search_directory}/browser-use.py`);
      const filePath = path.join(__dirname, search_directory,file_path);
      const pythonProcess = spawn("python", [
        scriptPath,
        "--task", task,
        "--file-path", filePath
      ], {
        cwd: __dirname
      });

      let stdout = "";
      let stderr = "";

      // Handle standard output
      pythonProcess.stdout.on("data", (data) => {
        const output = data.toString();
        stdout += output;
        console.log("Python output:", output);
      });

      // Handle standard error
      pythonProcess.stderr.on("data", (data) => {
        const error = data.toString();
        stderr += error;
        // Print warning but don't terminate process
        console.warn("Python warning:", error);
      });

      // Wait for process to complete
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pythonProcess.kill();
          reject(new Error(`Process timed out after ${timeout}ms`));
        }, timeout);

        pythonProcess.on("close", (code) => {
          clearTimeout(timer);
          if (code === 0) {
            resolve(code);
          } else {
            reject(new Error(`Process exited with code ${code}`));
          }
        });

        pythonProcess.on("error", reject);
      });

      console.log("Reading the result file");
      // Read result file
      const searchResult = await readFile(filePath, "utf8");

      // Check for real errors (excluding LangChain warnings)
      const isRealError = stderr.includes("Error:") || stderr.includes("Traceback");

      if (isRealError) {
        throw new Error(stderr);
      }

      console.log("Extracting the result");
      // Use LLM to extract the result
      let extractedResult = "";
      try {
        const {text} = await generateText({
          model: anthropic("claude-3-7-sonnet-latest"),
          prompt: `Task: ${task}\n\n This is the result from the browser automation: ${searchResult}\n\n Extract the useful result from the search result and return the result in String format.`,
        });
        extractedResult = text;
        console.log("extractedResult", extractedResult);
      } catch (error: any) {
        console.error("Error extracting the result", error);
        throw new Error("Error extracting the result");
      }

      return {
        success: true,
        result: extractedResult,
        task,
        file_path,
        stdout,
        warnings: stderr || undefined  // Keep warnings but don't treat as errors
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        task: call.data.task,
        stderr: error.stderr?.toString()
      };
    }
  }
}); 