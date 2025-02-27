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
  focusWindowAction,
  resizeWindowAction,
} from "./computer-actions";

// Validate environment variables
validateEnv(
  z.object({
    ANTHROPIC_API_KEY: z.string().min(1, "ANTHROPIC_API_KEY is required"),
  })
);

// Define a context for browser automation
const browserContext = context({
  type: "browser",
  schema: z.object({
    browserName: z.string().default("Google Chrome"),
    url: z.string().optional(),
    windowSize: z
      .object({
        width: z.number(),
        height: z.number(),
      })
      .optional(),
  }),

  key({ browserName }) {
    return browserName;
  },

  create(state) {
    return {
      browserName: state.args.browserName,
      url: state.args.url,
      windowSize: state.args.windowSize || { width: 1280, height: 800 },
      lastAction: "initialized",
      screenshots: [],
    };
  },

  render({ memory }) {
    return render(
      `
Browser: {{browserName}}
Current URL: {{url}}
Window Size: {{width}}x{{height}}
Last Action: {{lastAction}}
      `,
      {
        browserName: memory.browserName,
        url: memory.url || "Not set",
        width: String(memory.windowSize.width),
        height: String(memory.windowSize.height),
        lastAction: memory.lastAction,
      }
    );
  },
});

/**
 * Example demonstrating browser automation using computer actions
 */
async function main() {
  // Create a new Dreams instance with browser automation context and actions
  const agent = await createDreams({
    model: anthropic("claude-3-5-sonnet-20240620"),
    extensions: [cli],
    context: browserContext,
    actions: [
      takeScreenshotAction,
      moveMouseAction,
      clickMouseAction,
      typeTextAction,
      pressKeyAction,
      scrollMouseAction,
      focusWindowAction,
      resizeWindowAction,
    ],
  }).start({
    browserName: "Google Chrome",
    windowSize: { width: 1280, height: 800 },
  });

  console.log("Browser automation agent is ready!");
  console.log("Try asking the agent to:");
  console.log("- 'Open Google Chrome and search for something'");
  console.log("- 'Take a screenshot of the current page'");
  console.log("- 'Scroll down the page'");
  console.log("- 'Click on a specific element'");

  // The CLI extension will handle user input and action execution
}

// Run the example
main().catch(console.error);
