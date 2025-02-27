import { z } from "zod";
import { action } from "@daydreamsai/core";
import { ComputerTool } from "./base";
import type { ToolResult } from "./base";
import type { WorkingMemory } from "@daydreamsai/core";

// Initialize the ComputerTool instance
const computerTool = new ComputerTool();

// Get screen dimensions from the ComputerTool
const screenDimensions = {
  width: computerTool.toParams().display_width_px,
  height: computerTool.toParams().display_height_px,
};

/**
 * Helper function to store a screenshot in working memory
 * This avoids storing the base64 image data in the action result
 */
function storeScreenshotInMemory(
  ctx: any,
  base64Image?: string | null,
  mediaType?: string | null
) {
  if (base64Image && mediaType) {
    const dataUrl = `data:${mediaType};base64,${base64Image}`;
    (
      ctx.workingMemory as WorkingMemory & {
        currentImage?: URL;
        screenDimensions?: { width: number; height: number };
      }
    ).currentImage = new URL(dataUrl);
  }

  // Store screen dimensions in working memory
  (
    ctx.workingMemory as WorkingMemory & {
      screenDimensions?: { width: number; height: number };
    }
  ).screenDimensions = screenDimensions;

  // Update context memory if available
  if (
    ctx.agentMemory &&
    ctx.agentMemory.lastScreenshotTimestamp !== undefined
  ) {
    ctx.agentMemory.lastScreenshotTimestamp = Date.now();
    ctx.agentMemory.observations = ctx.agentMemory.observations || [];
    ctx.agentMemory.observations.push(
      `Screenshot taken at ${new Date().toLocaleTimeString()}`
    );
  }
}

/**
 * Action to take a screenshot
 */
export const takeScreenshotAction = action({
  name: "takeScreenshot",
  description: `Capture a screenshot of the current screen state.

  USE WHEN:
  - You need to observe the current state of the screen
  - You want to verify the results of previous actions
  - You need to analyze UI elements before interacting with them
  - You're starting a new task and need to see what's on screen

  BEHAVIOR:
  - Captures the entire screen including all visible windows and applications
  - The screenshot is automatically stored in working memory for future reference
  - Returns screen dimensions for coordinate-based actions

  BEST PRACTICE:
  - Take a screenshot after performing actions to verify their effects
  - Use screenshots to identify UI elements and their coordinates
  `,
  schema: z.object({}),
  async handler(call, ctx) {
    try {
      const result = await computerTool.execute({ action: "screenshot" });

      // Store the screenshot in working memory
      storeScreenshotInMemory(ctx, result.base64Image, result.mediaType);

      return {
        success: true,
        // Don't include the base64Image in the action result to avoid storing it in memory
        mediaType: result.mediaType,
        message: "Screenshot captured successfully",
        screenDimensions,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        screenDimensions,
      };
    }
  },
});

/**
 * Action to move the mouse to specific coordinates
 */
export const moveMouseAction = action({
  name: "moveMouse",
  description: `Move the mouse cursor to specific X,Y coordinates on the screen.

  USE WHEN:
  - You need to position the cursor over a specific UI element
  - You're preparing to click on something at known coordinates
  - You want to hover over an element to reveal additional options

  BEHAVIOR:
  - Moves the cursor to the exact X,Y position specified
  - Takes a screenshot after movement to show the new cursor position
  - Does NOT perform any clicking action

  COORDINATES:
  - X: Horizontal position (0 is left edge, increases moving right)
  - Y: Vertical position (0 is top edge, increases moving down)
  - Coordinates must be within screen bounds (see screenDimensions)

  BEST PRACTICE:
  - Use getCursorPosition first if you need to know the current position
  - Follow with clickMouse if you need to click at the new position
  `,
  schema: z.object({
    x: z.number().describe("X coordinate to move the mouse to"),
    y: z.number().describe("Y coordinate to move the mouse to"),
  }),
  async handler(call, ctx) {
    try {
      const result = await computerTool.execute({
        action: "mouse_move",
        coordinate: [call.data.x, call.data.y],
      });

      // Store the screenshot in working memory
      storeScreenshotInMemory(ctx, result.base64Image, result.mediaType);

      return {
        success: true,
        message: `Mouse moved to coordinates (${call.data.x}, ${call.data.y})`,
        screenDimensions,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        screenDimensions,
      };
    }
  },
});

/**
 * Action to perform a mouse click
 */
export const clickMouseAction = action({
  name: "clickMouse",
  description: `Perform a mouse click at the current cursor position.

  USE WHEN:
  - You need to click on a UI element after positioning the cursor
  - You want to select an item, button, or control
  - You need to activate a context menu (right click)
  - You need to double-click to open an item

  BEHAVIOR:
  - Clicks at the CURRENT cursor position (use moveMouse first if needed)
  - Takes a screenshot after clicking to show the result
  - Can perform left, right, middle, or double clicks

  PARAMETERS:
  - button: Choose "left" for normal clicks, "right" for context menus, "middle" for special actions
  - doubleClick: Set to true when you need to open files or perform double-click actions

  BEST PRACTICE:
  - Always position the cursor with moveMouse before clicking
  - Use right-click when you need to access context menus
  - Use double-click when you need to open files or applications
  `,
  schema: z.object({
    button: z
      .enum(["left", "right", "middle"])
      .default("left")
      .describe("Mouse button to click (left, right, or middle)"),
    doubleClick: z
      .boolean()
      .default(false)
      .describe("Whether to perform a double-click"),
  }),
  async handler(call, ctx) {
    try {
      const action = call.data.doubleClick
        ? "double_click"
        : call.data.button === "left"
          ? "left_click"
          : call.data.button === "right"
            ? "right_click"
            : "middle_click";

      const result = await computerTool.execute({ action });

      // Store the screenshot in working memory
      storeScreenshotInMemory(ctx, result.base64Image, result.mediaType);

      return {
        success: true,
        message: `Performed ${call.data.doubleClick ? "double-" : ""}${call.data.button} click`,
        screenDimensions,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        screenDimensions,
      };
    }
  },
});

/**
 * Action to type text
 */
export const typeTextAction = action({
  name: "typeText",
  description: `Type text at the current cursor position.

  USE WHEN:
  - You need to enter text into a focused input field, form, or text area
  - You want to type commands in a terminal or command prompt
  - You need to input search terms, URLs, or other text content

  BEHAVIOR:
  - Types the specified text at the current cursor position
  - Works only when a text input field is already focused
  - Takes a screenshot after typing to show the result
  - Types at a natural speed with slight delays between characters

  PARAMETERS:
  - text: The exact text string to type (supports all standard characters)

  BEST PRACTICE:
  - Ensure the target input field is focused before typing
  - For special keys (Enter, Tab, etc.), use pressKey instead
  - Break long text into smaller chunks if needed for reliability
  - Verify the text was entered correctly using the returned screenshot
  `,
  schema: z.object({
    text: z.string().describe("Text to type"),
  }),
  async handler(call, ctx) {
    try {
      const result = await computerTool.execute({
        action: "type",
        text: call.data.text,
      });

      // Store the screenshot in working memory
      storeScreenshotInMemory(ctx, result.base64Image, result.mediaType);

      return {
        success: true,
        message: `Typed text: "${call.data.text}"`,
        screenDimensions,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        screenDimensions,
      };
    }
  },
});

/**
 * Action to press a specific key
 */
export const pressKeyAction = action({
  name: "pressKey",
  description: `Press a specific key or key combination.

  USE WHEN:
  - You need to use special keys like Enter, Tab, Escape, arrows, etc.
  - You want to trigger keyboard shortcuts (Ctrl+C, Command+S, etc.)
  - You need to navigate using keyboard (arrows, tab, etc.)
  - You want to submit forms (Enter) or cancel dialogs (Escape)

  BEHAVIOR:
  - Presses the specified key or key combination
  - Takes a screenshot after the key press to show the result
  - Supports modifier keys (shift, control, alt, command) for shortcuts

  PARAMETERS:
  - key: The main key to press (e.g., 'Return', 'Tab', 'a', 'F5')
  - modifiers: Optional array of modifier keys to hold while pressing the main key
    Examples: ['shift'], ['control'], ['command', 'shift']

  COMMON KEYS:
  - Navigation: 'Return' (Enter), 'Tab', 'Escape', 'Up', 'Down', 'Left', 'Right'
  - Editing: 'BackSpace', 'Delete', 'Home', 'End', 'Page_Up', 'Page_Down'
  - Function keys: 'F1' through 'F12'

  BEST PRACTICE:
  - Use for special keys that can't be typed with typeText
  - For keyboard shortcuts, specify modifiers correctly for the OS
  - For text input, prefer typeText over individual key presses
  `,
  schema: z.object({
    key: z.string().describe("Key to press (e.g., 'Return', 'Tab', 'a', etc.)"),
    modifiers: z
      .array(z.string())
      .optional()
      .describe(
        "Modifier keys to hold while pressing the key (e.g., ['shift', 'control'])"
      ),
  }),
  async handler(call, ctx) {
    try {
      const result = await computerTool.execute({
        action: "key",
        text: call.data.modifiers
          ? call.data.modifiers.join("+") + "+" + call.data.key
          : call.data.key,
      });

      // Store the screenshot in working memory
      storeScreenshotInMemory(ctx, result.base64Image, result.mediaType);

      const keyCombo = call.data.modifiers
        ? `${call.data.modifiers.join("+")}+${call.data.key}`
        : call.data.key;

      return {
        success: true,
        message: `Pressed key: ${keyCombo}`,
        screenDimensions,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        screenDimensions,
      };
    }
  },
});

/**
 * Action to scroll the mouse wheel
 */
export const scrollMouseAction = action({
  name: "scrollMouse",
  description: `Scroll the mouse wheel in a specified direction.

  USE WHEN:
  - You need to scroll up/down on a webpage, document, or scrollable area
  - You want to navigate through a long list or content that doesn't fit on screen
  - You need to scroll horizontally in applications that support it
  - You want to reveal content that's currently off-screen

  BEHAVIOR:
  - Scrolls in the specified direction (up, down, left, right)
  - Amount determines how far to scroll (higher values = more scrolling)
  - Takes a screenshot after scrolling to show the new view
  - Scrolls at the current cursor position

  PARAMETERS:
  - direction: Which way to scroll ("up", "down", "left", "right")
  - amount: How much to scroll (positive number, higher = more scrolling)

  BEST PRACTICE:
  - Position the cursor over the scrollable area first with moveMouse
  - Start with smaller amounts (1-3) and increase if needed
  - Take screenshots between scrolls to verify content position
  - For precise navigation, use multiple smaller scrolls rather than one large scroll
  `,
  schema: z.object({
    direction: z
      .enum(["up", "down", "left", "right"])
      .default("down")
      .describe("Direction to scroll"),
    amount: z
      .number()
      .default(1)
      .describe("Amount to scroll (positive number)"),
  }),
  async handler(call, ctx) {
    try {
      const result = await computerTool.execute({
        action: "mouse_scroll",
        direction: call.data.direction,
        scrollAmount: call.data.amount,
      });

      // Store the screenshot in working memory
      storeScreenshotInMemory(ctx, result.base64Image, result.mediaType);

      return {
        success: true,
        message: `Scrolled ${call.data.direction} by ${call.data.amount}`,
        screenDimensions,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        screenDimensions,
      };
    }
  },
});

/**
 * Action to drag the mouse
 */
export const dragMouseAction = action({
  name: "dragMouse",
  description: `Click and drag the mouse from current position to target coordinates.

  USE WHEN:
  - You need to drag and drop items (files, UI elements, etc.)
  - You want to select text by dragging across it
  - You need to move sliders, resize windows by dragging edges
  - You want to draw in graphics applications

  BEHAVIOR:
  - Performs a click-and-hold at the current cursor position
  - Drags to the specified target X,Y coordinates
  - Releases the mouse button at the target position
  - Takes a screenshot after the drag operation completes

  PARAMETERS:
  - x: Target X coordinate to drag to (horizontal position)
  - y: Target Y coordinate to drag to (vertical position)

  BEST PRACTICE:
  - First use moveMouse to position cursor at the starting point
  - Ensure both start and end positions are visible on screen
  - For complex drag operations, break into multiple smaller drags
  - Verify the drag result with the returned screenshot
  `,
  schema: z.object({
    x: z.number().describe("Target X coordinate to drag to"),
    y: z.number().describe("Target Y coordinate to drag to"),
  }),
  async handler(call, ctx) {
    try {
      const result = await computerTool.execute({
        action: "left_click_drag",
        coordinate: [call.data.x, call.data.y],
      });

      // Store the screenshot in working memory
      storeScreenshotInMemory(ctx, result.base64Image, result.mediaType);

      return {
        success: true,
        message: `Dragged mouse to coordinates (${call.data.x}, ${call.data.y})`,
        screenDimensions,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        screenDimensions,
      };
    }
  },
});

/**
 * Action to get the current cursor position
 */
export const getCursorPositionAction = action({
  name: "getCursorPosition",
  description: `Get the current X,Y coordinates of the mouse cursor.

  USE WHEN:
  - You need to know the current cursor position before taking action
  - You want to record a position for later use
  - You're debugging cursor positioning issues
  - You need to verify cursor placement

  BEHAVIOR:
  - Returns the exact X,Y coordinates of the current cursor position
  - Does NOT move the cursor or take any visible action
  - Does NOT take a screenshot (unlike most other actions)

  RETURNS:
  - x: Horizontal position (0 is left edge, increases moving right)
  - y: Vertical position (0 is top edge, increases moving down)
  - screenDimensions: The total width and height of the screen

  BEST PRACTICE:
  - Use before moveMouse when you need to know the starting position
  - Use after moveMouse to verify the cursor reached the intended position
  - Store coordinates when you find important UI elements for later use
  `,
  schema: z.object({}),
  async handler(call, ctx) {
    try {
      const result = await computerTool.execute({
        action: "cursor_position",
      });

      // Parse the output string (format: X=123,Y=456)
      const positionMatch = result.output?.match(/X=(\d+),Y=(\d+)/);

      if (positionMatch) {
        const x = parseInt(positionMatch[1], 10);
        const y = parseInt(positionMatch[2], 10);

        // Update context memory if available
        if (ctx.agentMemory && ctx.agentMemory.mousePosition !== undefined) {
          ctx.agentMemory.mousePosition = { x, y };
          ctx.agentMemory.observations = ctx.agentMemory.observations || [];
          ctx.agentMemory.observations.push(
            `Cursor position: (${x}, ${y}) at ${new Date().toLocaleTimeString()}`
          );
        }

        return {
          success: true,
          x,
          y,
          screenDimensions,
        };
      } else {
        return {
          success: false,
          error: "Failed to parse cursor position",
          screenDimensions,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        screenDimensions,
      };
    }
  },
});

/**
 * Action to focus a window by title
 */
export const focusWindowAction = action({
  name: "focusWindow",
  description: `Focus a window by its title to bring it to the foreground.

  USE WHEN:
  - You need to switch to a specific application window
  - You want to bring a background window to the front
  - You need to interact with a window that's not currently focused
  - You're starting a new task in a different application

  BEHAVIOR:
  - Searches for a window with the specified title
  - Brings that window to the foreground and gives it focus
  - Takes a screenshot after focusing to show the window
  - Uses platform-specific methods (macOS, Windows, Linux)

  PARAMETERS:
  - windowTitle: The exact title of the window to focus (case-sensitive)

  BEST PRACTICE:
  - Use exact window titles for reliable focusing
  - For applications with dynamic titles, use a consistent part of the title
  - Take a screenshot first to see available window titles
  - If focusing fails, try with a partial window title
  `,
  schema: z.object({
    windowTitle: z.string().describe("Title of the window to focus"),
  }),
  async handler(call, ctx) {
    try {
      const result = await computerTool.execute({
        action: "focus_window",
        windowTitle: call.data.windowTitle,
      });

      // Store the screenshot in working memory
      storeScreenshotInMemory(ctx, result.base64Image, result.mediaType);

      // Update context memory if available
      if (ctx.agentMemory && ctx.agentMemory.activeWindow !== undefined) {
        ctx.agentMemory.activeWindow = call.data.windowTitle;
        ctx.agentMemory.observations = ctx.agentMemory.observations || [];
        ctx.agentMemory.observations.push(
          `Focused window: "${call.data.windowTitle}" at ${new Date().toLocaleTimeString()}`
        );
      }

      return {
        success: true,
        message: `Focused window: "${call.data.windowTitle}"`,
        screenDimensions,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        screenDimensions,
      };
    }
  },
});

/**
 * Action to resize a window
 */
export const resizeWindowAction = action({
  name: "resizeWindow",
  description: `Resize a window to specific width and height dimensions.

  USE WHEN:
  - You need a window to be a specific size for interaction
  - You want to make a window larger to see more content
  - You need to make a window smaller to reveal other elements
  - You're preparing a window for screen recording or screenshots

  BEHAVIOR:
  - Finds the window with the specified title
  - Resizes it to the exact width and height specified
  - Maintains the window's current position (top-left corner stays fixed)
  - Takes a screenshot after resizing to show the result

  PARAMETERS:
  - windowTitle: The exact title of the window to resize (case-sensitive)
  - width: The desired width in pixels
  - height: The desired height in pixels

  BEST PRACTICE:
  - Focus the window first with focusWindow before resizing
  - Use reasonable dimensions that fit within the screen
  - Consider the minimum size limitations of the application
  - Verify the resize worked correctly with the returned screenshot
  `,
  schema: z.object({
    windowTitle: z.string().describe("Title of the window to resize"),
    width: z.number().describe("New width of the window"),
    height: z.number().describe("New height of the window"),
  }),
  async handler(call, ctx) {
    try {
      const result = await computerTool.execute({
        action: "resize_window",
        windowTitle: call.data.windowTitle,
        size: {
          width: call.data.width,
          height: call.data.height,
        },
      });

      // Store the screenshot in working memory
      storeScreenshotInMemory(ctx, result.base64Image, result.mediaType);

      return {
        success: true,
        message: `Resized window "${call.data.windowTitle}" to ${call.data.width}x${call.data.height}`,
        screenDimensions,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        screenDimensions,
      };
    }
  },
});
