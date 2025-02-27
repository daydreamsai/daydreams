import {
  createDreams,
  validateEnv,
  context,
  render,
  action,
} from "@daydreamsai/core";
import { cli } from "@daydreamsai/core/extensions";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import path from "path";
import fs from "fs/promises";
import {
  takeScreenshotAction,
  moveMouseAction,
  clickMouseAction,
  typeTextAction,
  pressKeyAction,
  scrollMouseAction,
  getCursorPositionAction,
  focusWindowAction,
  resizeWindowAction,
} from "./computer-actions";
import {
  executeBashAction,
  executeLongRunningBashAction,
  getSystemInfoAction,
  findFilesAction,
  grepFilesAction,
} from "./bash-actions";

// Validate environment variables
validateEnv(
  z.object({
    ANTHROPIC_API_KEY: z.string().min(1, "ANTHROPIC_API_KEY is required"),
  })
);

// Define a context for advanced automation
const automationContext = context({
  type: "automation",
  schema: z.object({
    workingDirectory: z.string().default(process.cwd()),
    taskName: z.string().default("system-analysis"),
    outputDirectory: z.string().optional(),
  }),

  key({ taskName }) {
    return taskName;
  },

  create(state) {
    const outputDir =
      state.args.outputDirectory ||
      path.join(process.cwd(), "automation-output");

    return {
      workingDirectory: state.args.workingDirectory || process.cwd(),
      taskName: state.args.taskName,
      outputDirectory: outputDir,
      commandHistory: [],
      screenshotHistory: [],
      taskStatus: "initialized",
      taskSteps: [],
      taskResults: {},
      startTime: Date.now(),
    };
  },

  render({ memory }) {
    const elapsedTime = Math.floor((Date.now() - memory.startTime) / 1000);
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;

    return render(
      `
Advanced Automation Task: {{taskName}}
--------------------------------------
Status: {{taskStatus}}
Working Directory: {{workingDirectory}}
Output Directory: {{outputDirectory}}
Elapsed Time: {{minutes}}m {{seconds}}s

Recent Commands:
{{commandHistory}}

Recent Screenshots:
{{screenshotHistory}}

Task Steps:
{{taskSteps}}
      `,
      {
        taskName: memory.taskName,
        taskStatus: memory.taskStatus,
        workingDirectory: memory.workingDirectory,
        outputDirectory: memory.outputDirectory,
        minutes: String(minutes),
        seconds: String(seconds),
        commandHistory:
          memory.commandHistory.length > 0
            ? memory.commandHistory.slice(-3).join("\n")
            : "No commands executed yet",
        screenshotHistory:
          memory.screenshotHistory.length > 0
            ? memory.screenshotHistory.slice(-3).join("\n")
            : "No screenshots taken yet",
        taskSteps:
          memory.taskSteps.length > 0
            ? memory.taskSteps
                .map(
                  (step: { name: string; status: string }, i: number) =>
                    `${i + 1}. ${step.name} - ${step.status}`
                )
                .join("\n")
            : "No task steps defined yet",
      }
    );
  },
});

// Custom action to update task status
const updateTaskAction = action({
  name: "updateTask",
  description: "Update the status of the current automation task",
  schema: z.object({
    status: z.string().describe("New status for the task"),
    addStep: z.boolean().optional().describe("Whether to add a new step"),
    stepName: z.string().optional().describe("Name of the new step"),
    stepStatus: z.string().optional().describe("Status of the new step"),
    updateStepIndex: z.number().optional().describe("Index of step to update"),
    updateStepStatus: z
      .string()
      .optional()
      .describe("New status for the step to update"),
  }),
  async handler(call, ctx) {
    try {
      const memory = ctx.agentMemory;

      // Update task status
      memory.taskStatus = call.data.status;

      // Add new step if requested
      if (call.data.addStep && call.data.stepName) {
        memory.taskSteps.push({
          name: call.data.stepName,
          status: call.data.stepStatus || "pending",
          timestamp: Date.now(),
        });
      }

      // Update existing step if requested
      if (
        call.data.updateStepIndex !== undefined &&
        call.data.updateStepStatus
      ) {
        if (memory.taskSteps[call.data.updateStepIndex]) {
          memory.taskSteps[call.data.updateStepIndex].status =
            call.data.updateStepStatus;
          memory.taskSteps[call.data.updateStepIndex].lastUpdated = Date.now();
        }
      }

      return {
        success: true,
        taskStatus: memory.taskStatus,
        taskSteps: memory.taskSteps,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

// Custom action to create output directory
const createOutputDirectoryAction = action({
  name: "createOutputDirectory",
  description: "Create the output directory for storing task results",
  schema: z.object({}),
  async handler(call, ctx) {
    try {
      const memory = ctx.agentMemory;
      const outputDir = memory.outputDirectory;

      // Create directory using Node.js fs
      await fs.mkdir(outputDir, { recursive: true });

      // Add command to history
      memory.commandHistory.push(`mkdir -p "${outputDir}"`);

      return {
        success: true,
        outputDirectory: outputDir,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

// Custom action to save task results
const saveTaskResultsAction = action({
  name: "saveTaskResults",
  description: "Save task results to a file in the output directory",
  schema: z.object({
    filename: z.string().describe("Filename to save results to"),
    content: z.string().describe("Content to save to the file"),
    append: z
      .boolean()
      .optional()
      .describe("Whether to append to the file instead of overwriting"),
  }),
  async handler(call, ctx) {
    try {
      const memory = ctx.agentMemory;
      const outputPath = path.join(memory.outputDirectory, call.data.filename);

      // Ensure directory exists
      await fs.mkdir(memory.outputDirectory, { recursive: true });

      // Write file using Node.js fs
      if (call.data.append) {
        await fs.appendFile(outputPath, call.data.content);
      } else {
        await fs.writeFile(outputPath, call.data.content);
      }

      // Add command to history
      const command = call.data.append
        ? `echo "${call.data.content}" >> "${outputPath}"`
        : `echo "${call.data.content}" > "${outputPath}"`;
      memory.commandHistory.push(command);

      return {
        success: true,
        outputPath,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

// Custom action to save a screenshot
const saveScreenshotAction = action({
  name: "saveScreenshot",
  description: "Save a screenshot to the output directory",
  schema: z.object({
    base64Image: z.string().describe("Base64-encoded image data"),
    filename: z
      .string()
      .optional()
      .describe("Filename to save screenshot to (without extension)"),
  }),
  async handler(call, ctx) {
    try {
      const memory = ctx.agentMemory;

      // Generate filename if not provided
      const filename = call.data.filename || `screenshot-${Date.now()}`;
      const outputPath = path.join(memory.outputDirectory, `${filename}.png`);

      // Ensure directory exists
      await fs.mkdir(memory.outputDirectory, { recursive: true });

      // Convert base64 to buffer and save
      const imageBuffer = Buffer.from(call.data.base64Image, "base64");
      await fs.writeFile(outputPath, imageBuffer);

      // Add to screenshot history
      memory.screenshotHistory.push(`${filename}.png`);

      return {
        success: true,
        outputPath,
        filename: `${filename}.png`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

// Custom action to perform system analysis
const analyzeSystemAction = action({
  name: "analyzeSystem",
  description: "Analyze the system and save results to the output directory",
  schema: z.object({
    includeScreenshot: z
      .boolean()
      .optional()
      .describe("Whether to include a screenshot"),
    outputFilename: z.string().optional().describe("Filename for the report"),
  }),
  async handler(call, ctx) {
    try {
      const memory = ctx.agentMemory;
      const outputFilename = call.data.outputFilename || "system-analysis.txt";
      const outputPath = path.join(memory.outputDirectory, outputFilename);

      // Ensure directory exists
      await fs.mkdir(memory.outputDirectory, { recursive: true });

      // Collect system information using Node.js
      const os = require("os");
      const systemInfo = {
        hostname: os.hostname(),
        platform: os.platform(),
        release: os.release(),
        type: os.type(),
        arch: os.arch(),
        cpus: os.cpus(),
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        uptime: os.uptime(),
        loadAvg: os.loadavg(),
        userInfo: os.userInfo(),
      };

      // Format report
      const report = `
System Analysis Report
=====================
Generated: ${new Date().toISOString()}

Hostname: ${systemInfo.hostname}
Platform: ${systemInfo.platform}
OS Type: ${systemInfo.type}
OS Release: ${systemInfo.release}
Architecture: ${systemInfo.arch}

CPU Information:
${systemInfo.cpus.map((cpu: any, i: number) => `  CPU ${i}: ${cpu.model} (${cpu.speed} MHz)`).join("\n")}

Memory:
  Total: ${Math.round(systemInfo.totalMemory / (1024 * 1024 * 1024))} GB
  Free: ${Math.round(systemInfo.freeMemory / (1024 * 1024 * 1024))} GB
  Used: ${Math.round((systemInfo.totalMemory - systemInfo.freeMemory) / (1024 * 1024 * 1024))} GB

System Uptime: ${Math.floor(systemInfo.uptime / 3600)} hours, ${Math.floor((systemInfo.uptime % 3600) / 60)} minutes
Load Average: ${systemInfo.loadAvg.join(", ")}

User: ${systemInfo.userInfo.username}
Home Directory: ${systemInfo.userInfo.homedir}
`;

      // Write report to file
      await fs.writeFile(outputPath, report);

      // Add command to history
      memory.commandHistory.push(`System analysis saved to ${outputFilename}`);

      return {
        success: true,
        outputPath,
        systemInfo,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

/**
 * Example demonstrating advanced automation with computer and bash actions
 */
async function main() {
  // Create a new Dreams instance with both computer and bash actions
  const agent = await createDreams({
    model: anthropic("claude-3-7-sonnet-latest"),
    extensions: [cli],
    // context: automationContext,
    actions: [
      // Computer actions
      // takeScreenshotAction,
      // moveMouseAction,
      // clickMouseAction,
      // typeTextAction,
      // pressKeyAction,
      // scrollMouseAction,
      // getCursorPositionAction,
      // focusWindowAction,
      // resizeWindowAction,
      // // Bash actions
      // executeBashAction,
      // executeLongRunningBashAction,
      // getSystemInfoAction,
      // findFilesAction,
      // grepFilesAction,
      // // Custom task management actions
      // updateTaskAction,
      // createOutputDirectoryAction,
      // saveTaskResultsAction,
      // saveScreenshotAction,
      // analyzeSystemAction,
    ],
  }).start({
    taskName: "system-analysis",
    workingDirectory: "process.cwd()",
  });

  console.log("Advanced Automation Agent is ready!");
  console.log(
    "This agent combines computer control and bash execution capabilities with task management."
  );

  console.log("\nTry asking the agent to perform complex tasks like:");
  console.log("- 'Analyze my system and save the results'");
  console.log("- 'Take a screenshot of my desktop and save it'");
  console.log("- 'Find all JavaScript files in the project'");
  console.log("- 'Execute a command to list all processes'");

  // The CLI extension will handle user input and action execution
}

// Run the example
main().catch(console.error);
