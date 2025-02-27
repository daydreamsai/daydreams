import { createDreams, validateEnv, context, render } from "@daydreamsai/core";
import { cli } from "@daydreamsai/core/extensions";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
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

// Define a context for system automation
const systemContext = context({
  type: "system",
  schema: z.object({
    workingDirectory: z.string().default(process.cwd()),
    lastCommand: z.string().optional(),
    lastScreenshot: z.string().optional(),
  }),

  key() {
    return "system";
  },

  create(state) {
    return {
      workingDirectory: state.args.workingDirectory || process.cwd(),
      lastCommand: null,
      lastScreenshot: null,
      commandHistory: [],
      systemInfo: null,
    };
  },

  render({ memory }) {
    return render(
      `
System Automation Context
-------------------------
Working Directory: {{workingDirectory}}
Last Command: {{lastCommand}}
Last Screenshot: {{lastScreenshot}}
Command History: {{commandHistory}}
      `,
      {
        workingDirectory: memory.workingDirectory,
        lastCommand: memory.lastCommand || "None",
        lastScreenshot: memory.lastScreenshot || "None",
        commandHistory:
          memory.commandHistory.length > 0
            ? memory.commandHistory.slice(-5).join("\n")
            : "No commands executed yet",
      }
    );
  },
});

/**
 * Example demonstrating combined computer and bash automation
 */
async function main() {
  // Create a new Dreams instance with both computer and bash actions
  const agent = await createDreams({
    model: anthropic("claude-3-7-sonnet-latest"),
    extensions: [cli],
    context: systemContext,
    actions: [
      // Computer actions
      takeScreenshotAction,
      moveMouseAction,
      clickMouseAction,
      typeTextAction,
      pressKeyAction,
      scrollMouseAction,
      getCursorPositionAction,
      focusWindowAction,
      resizeWindowAction,

      // Bash actions
      executeBashAction,
      executeLongRunningBashAction,
      getSystemInfoAction,
      findFilesAction,
      grepFilesAction,
    ],
  }).start({
    workingDirectory: process.cwd(),
  });

  console.log("System automation agent is ready!");
  console.log(
    "This agent combines computer control and bash execution capabilities."
  );
  console.log("\nAvailable Computer Actions:");
  console.log("- takeScreenshot: Capture a screenshot of the current screen");
  console.log("- moveMouse: Move the mouse cursor to specific coordinates");
  console.log(
    "- clickMouse: Perform a mouse click at the current cursor position"
  );
  console.log("- typeText: Type text at the current cursor position");
  console.log("- pressKey: Press a specific key or key combination");
  console.log("- scrollMouse: Scroll the mouse wheel");
  console.log(
    "- getCursorPosition: Get the current position of the mouse cursor"
  );
  console.log("- focusWindow: Focus a window by its title");
  console.log("- resizeWindow: Resize a window by its title");

  console.log("\nAvailable Bash Actions:");
  console.log("- executeBash: Execute a bash command and return the output");
  console.log(
    "- executeLongRunningBash: Execute a long-running bash command with streaming output"
  );
  console.log("- getSystemInfo: Get system information using bash commands");
  console.log(
    "- findFiles: Find files matching a pattern using the find command"
  );
  console.log("- grepFiles: Search for patterns in files using grep");

  console.log("\nTry asking the agent to:");
  console.log("- 'Get system information and take a screenshot'");
  console.log("- 'Find all JavaScript files in the current directory'");
  console.log("- 'Open a terminal, type ls -la, and press Enter'");
  console.log(
    "- 'Search for files containing the word \"example\" and show the results'"
  );

  // The CLI extension will handle user input and action execution
}

// Run the example
main().catch(console.error);
