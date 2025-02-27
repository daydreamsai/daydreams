import {
  createDreams,
  LogLevel,
  validateEnv,
  context,
  render,
  action,
} from "@daydreamsai/core";
import { cli } from "@daydreamsai/core/extensions";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import {
  takeScreenshotAction,
  // Commenting out other actions that might depend on robotjs
  moveMouseAction,
  clickMouseAction,
  typeTextAction,
  pressKeyAction,
  scrollMouseAction,
  dragMouseAction,
  getCursorPositionAction,
  focusWindowAction,
  resizeWindowAction,
} from "./computer-actions";
import { executeBashAction } from "./bash-actions";
// Validate environment variables
validateEnv(
  z.object({
    ANTHROPIC_API_KEY: z.string().min(1, "ANTHROPIC_API_KEY is required"),
  })
);

/**
 * Define a context to help the agent remember what it's doing
 * This maintains state across interactions
 */
const computerMemoryContext = context({
  type: "computer-memory",
  schema: z.object({
    id: z.string(),
  }),

  key(state) {
    // Return a default ID if state or state.id is undefined
    return state?.id || "default-memory-id";
  },

  create(state) {
    return {
      currentTask: null as null | string,
      taskHistory: [] as string[],
      observations: [] as string[],
      lastScreenshotTimestamp: null as null | number,
      mousePosition: null as null | { x: number; y: number },
      activeWindow: null as null | string,
      notes: [] as string[],
    };
  },

  render({ memory }) {
    return render(
      `
Current Task: {{currentTask}}

Task History:
{{taskHistory}}

Recent Observations:
{{observations}}

Mouse Position: {{mousePosition}}
Active Window: {{activeWindow}}

Notes:
{{notes}}
`,
      {
        currentTask: memory.currentTask ?? "No active task",
        taskHistory: memory.taskHistory?.join("\n") ?? "No task history",
        observations:
          memory.observations?.slice(-5).join("\n") ?? "No observations",
        mousePosition: memory.mousePosition
          ? `x: ${memory.mousePosition.x}, y: ${memory.mousePosition.y}`
          : "Unknown",
        activeWindow: memory.activeWindow ?? "Unknown",
        notes: memory.notes?.join("\n") ?? "No notes",
      }
    );
  },
});

/**
 * Action to update the current task in memory
 */
const updateTaskAction = action({
  name: "updateTask",
  description: `Update the current task in memory.
  
  USE WHEN:
  - You're starting a new task or subtask
  - You want to record what you're currently working on
  - You need to track progress through a multi-step process
  
  BEHAVIOR:
  - Updates the current task in memory
  - Adds the previous task to task history
  - Helps maintain context across interactions
  
  PARAMETERS:
  - task: Description of the current task
  - addNote: Optional note to add about the task
  `,
  schema: z.object({
    task: z.string().describe("Description of the current task"),
    addNote: z
      .string()
      .optional()
      .describe("Optional note to add about the task"),
  }),
  handler(call, ctx) {
    if (ctx.agentMemory) {
      // Save current task to history if it exists
      if (ctx.agentMemory.currentTask) {
        ctx.agentMemory.taskHistory = ctx.agentMemory.taskHistory || [];
        ctx.agentMemory.taskHistory.push(
          `${new Date().toLocaleTimeString()}: ${ctx.agentMemory.currentTask}`
        );
      }

      // Update current task
      ctx.agentMemory.currentTask = call.data.task;

      // Add note if provided
      if (call.data.addNote) {
        ctx.agentMemory.notes = ctx.agentMemory.notes || [];
        ctx.agentMemory.notes.push(
          `${new Date().toLocaleTimeString()}: ${call.data.addNote}`
        );
      }

      return {
        success: true,
        message: `Current task updated to: ${call.data.task}`,
        previousTasks: ctx.agentMemory.taskHistory || [],
      };
    } else {
      return {
        success: false,
        error: "Agent memory context not available",
      };
    }
  },
});

/**
 * Action to add a note to memory
 */
const addNoteAction = action({
  name: "addNote",
  description: `Add a note to memory without changing the current task.
  
  USE WHEN:
  - You want to record an observation or finding
  - You need to remember something for later
  - You want to document a decision or reasoning
  - You discover something important during a task
  
  BEHAVIOR:
  - Adds a note to the notes list in memory
  - Does not change the current task
  - Notes are timestamped automatically
  
  PARAMETERS:
  - note: The note text to add
  `,
  schema: z.object({
    note: z.string().describe("The note text to add"),
  }),
  handler(call, ctx) {
    if (ctx.agentMemory) {
      // Add note
      ctx.agentMemory.notes = ctx.agentMemory.notes || [];
      ctx.agentMemory.notes.push(
        `${new Date().toLocaleTimeString()}: ${call.data.note}`
      );

      return {
        success: true,
        message: `Note added: ${call.data.note}`,
        notes: ctx.agentMemory.notes,
      };
    } else {
      return {
        success: false,
        error: "Agent memory context not available",
      };
    }
  },
});

/**
 * Example demonstrating how to use computer actions to automate tasks
 */
async function main() {
  // Create a new Dreams instance with only the screenshot action
  const agent = await createDreams({
    logger: LogLevel.DEBUG,
    model: anthropic("claude-3-7-sonnet-latest"),
    extensions: [cli],
    context: computerMemoryContext,
    actions: [
      takeScreenshotAction,
      // Commenting out other actions
      moveMouseAction,
      clickMouseAction,
      typeTextAction,
      pressKeyAction,
      scrollMouseAction,
      dragMouseAction,
      getCursorPositionAction,
      focusWindowAction,
      resizeWindowAction,
      executeBashAction,
      updateTaskAction,
      addNoteAction,
    ],
  }).start();

  console.log("You can use the following actions:");
  console.log("- takeScreenshot: Capture a screenshot of the current screen");
  console.log(
    "  (Screenshots are automatically included in the AI's context for multimodal understanding)"
  );
  console.log("- moveMouse: Move the mouse cursor to specific coordinates");
  console.log(
    "- clickMouse: Perform a mouse click at the current cursor position"
  );
  console.log("- typeText: Type text at the current cursor position");
  console.log("- pressKey: Press a specific key or key combination");
  console.log("- scrollMouse: Scroll the mouse wheel");
  console.log(
    "- dragMouse: Click and drag the mouse from current position to target coordinates"
  );
  console.log(
    "- getCursorPosition: Get the current position of the mouse cursor"
  );
  console.log("- focusWindow: Focus a window by its title");
  console.log("- resizeWindow: Resize a window by its title");
  console.log("- updateTask: Update the current task being worked on");
  console.log(
    "- addNote: Add a note to memory without changing the current task"
  );
  console.log("");
  console.log("Note: All computer actions automatically capture screenshots");
  console.log(
    "and include them in the AI's context for multimodal understanding."
  );
  console.log("");
  console.log("The agent maintains memory of:");
  console.log("- Current task and task history");
  console.log("- Recent observations");
  console.log("- Mouse position");
  console.log("- Active window");
  console.log("- Notes you've added");
  console.log("");
  console.log(
    "This memory helps the agent maintain context across interactions."
  );

  // The CLI extension will handle user input and action execution
}

// Run the example
main().catch(console.error);
