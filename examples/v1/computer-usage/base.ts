import { v4 as uuidv4 } from "uuid";
import * as robot from "@jitsi/robotjs";
import sharp from "sharp";
import * as path from "path";
import { promises as fs } from "fs";

import screenshot from "screenshot-desktop";

/**
 * Base result interface for tool execution
 */
export interface ToolResult {
  output?: string | null;
  error?: string | null;
  base64Image?: string | null;
  system?: string | null;
  mediaType?: "image/png" | "image/jpeg" | "image/gif" | "image/webp";
}

/**
 * Result specifically for CLI outputs
 */
export class CLIResult implements ToolResult {
  constructor(
    public output?: string | null,
    public error?: string | null,
    public base64Image?: string | null,
    public system?: string | null
  ) {}
}

/**
 * Result indicating tool failure
 */
export class ToolFailure implements ToolResult {
  constructor(
    public error: string,
    public output?: string | null,
    public base64Image?: string | null,
    public system?: string | null
  ) {}
}

/**
 * Custom error class for tool-related errors
 */
export class ToolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ToolError";
  }
}

/**
 * Abstract base class for Anthropic-defined tools
 */
export abstract class BaseAnthropicTool {
  /**
   * Executes the tool with given arguments
   */
  abstract execute(params: Record<string, any>): Promise<ToolResult>;

  /**
   * Converts tool to API parameters format
   */
  abstract toParams(): any;

  /**
   * Combines two tool results
   */
  protected combineResults(
    result1: ToolResult,
    result2: ToolResult
  ): ToolResult {
    return {
      output: [result1.output, result2.output].filter(Boolean).join(""),
      error: [result1.error, result2.error].filter(Boolean).join(""),
      base64Image: result2.base64Image || result1.base64Image,
      system: [result1.system, result2.system].filter(Boolean).join(""),
    };
  }
}

/**
 * Collection of tools that can be used together
 */
export class ToolCollection {
  private toolMap: Map<string, BaseAnthropicTool>;

  constructor(tools: BaseAnthropicTool[]) {
    this.toolMap = new Map();
    tools.forEach((tool) => {
      const params = tool.toParams();
      this.toolMap.set(params.name, tool);
    });
  }

  /**
   * Convert all tools to API parameters format
   */
  toParams(): any[] {
    return Array.from(this.toolMap.values()).map((tool) => tool.toParams());
  }

  /**
   * Run a specific tool by name with given input
   */
  async run(name: string, toolInput: Record<string, any>): Promise<ToolResult> {
    const tool = this.toolMap.get(name);
    if (!tool) {
      return new ToolFailure(`Tool ${name} is invalid`);
    }

    try {
      return await tool.execute(toolInput);
    } catch (err) {
      if (err instanceof ToolError) {
        return new ToolFailure(err.message);
      }
      return new ToolFailure(`Unknown error: ${err}`);
    }
  }
}

// Constants
const TYPING_DELAY_MS = 12;
const TYPING_GROUP_SIZE = 50;
const SCREENSHOT_DELAY_MS = 2000;
const SCREENSHOT_RETRY_COUNT = 3;
const SCREENSHOT_RETRY_DELAY_MS = 500;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

// Quality reduction steps for compression
const COMPRESSION_STEPS = {
  initial: { quality: 90, maxDimension: 1920 },
  medium: { quality: 80, maxDimension: 1600 },
  high: { quality: 70, maxDimension: 1280 },
  extreme: { quality: 60, maxDimension: 1024 },
};

// Resolution scaling targets
const MAX_SCALING_TARGETS = {
  XGA: { width: 1024, height: 768 },
  WXGA: { width: 1280, height: 800 },
  FWXGA: { width: 1366, height: 768 },
  UWQHD: { width: 3440, height: 1440 }, // Adding ultrawide resolution
  UW4K: { width: 3840, height: 1600 }, // Another common ultrawide resolution
} as const;

type Action =
  | "mouse_move"
  | "left_click"
  | "left_click_drag"
  | "right_click"
  | "middle_click"
  | "double_click"
  | "mouse_scroll"
  | "mouse_toggle"
  | "screenshot"
  | "cursor_position"
  // Keyboard actions
  | "key"
  | "type"
  | "key_toggle"
  | "key_tap_multiple"
  // Focus actions
  | "focus_window"
  | "move_window"
  | "resize_window"
  | "minimize_window"
  | "maximize_window";

interface ExecuteParams {
  action: Action;
  text?: string;
  coordinate?: [number, number];
  // New parameters
  scrollAmount?: number;
  direction?: "up" | "down" | "left" | "right";
  toggleState?: "up" | "down";
  button?: "left" | "right" | "middle";
  windowTitle?: string;
  size?: { width: number; height: number };
  modifiers?: string[];
  repeat?: number;
  delay?: number;
}

interface ScreenshotMetadata {
  timestamp: string;
  dimensions: {
    width: number;
    height: number;
  };
  format: string;
  quality?: number;
  size: number;
  path: string;
}

// Key mappings for robotJs
const KEY_MAPPINGS: Record<string, string> = {
  Return: "enter",
  Tab: "tab",
  space: "space",
  BackSpace: "backspace",
  Delete: "delete",
  Escape: "escape",
  Up: "up",
  Down: "down",
  Left: "left",
  Right: "right",
  Home: "home",
  End: "end",
  Page_Up: "pageup",
  Page_Down: "pagedown",
  F1: "f1",
  F2: "f2",
  F3: "f3",
  F4: "f4",
  F5: "f5",
  F6: "f6",
  F7: "f7",
  F8: "f8",
  F9: "f9",
  F10: "f10",
  F11: "f11",
  F12: "f12",
};

export class ComputerTool extends BaseAnthropicTool {
  private screenDimensions: { width: number; height: number };
  private displayNum: number | undefined;
  private scalingEnabled = true;
  private screenshotsBaseDir: string;
  private screenshotMetadataFile: string;

  constructor() {
    super();

    // Get screen size
    const screen = robot.getScreenSize();
    this.screenDimensions = {
      width: screen.width,
      height: screen.height,
    };

    // Check if scaling should be disabled via environment variable
    if (process.env.DISABLE_SCREEN_SCALING === "true") {
      this.scalingEnabled = false;
      console.log("Screen coordinate scaling is disabled");
    }

    // Setup screenshots directory
    const projectRoot = process.cwd();
    this.screenshotsBaseDir = path.join(projectRoot, "screenshots");
    this.screenshotMetadataFile = path.join(
      this.screenshotsBaseDir,
      "metadata.json"
    );

    // Initialize directories
    this.initializeScreenshotDirectory();

    console.log(
      `Detected screen dimensions: ${this.screenDimensions.width}x${this.screenDimensions.height}`
    );
    console.log(
      `Screen aspect ratio: ${(this.screenDimensions.width / this.screenDimensions.height).toFixed(2)}`
    );
    console.log(`Scaling enabled: ${this.scalingEnabled}`);
    console.log(`Screenshots will be saved to: ${this.screenshotsBaseDir}`);

    const displayNum = process.env.DISPLAY_NUM;
    if (displayNum) {
      this.displayNum = parseInt(displayNum, 10);
    }

    robot.setKeyboardDelay(TYPING_DELAY_MS);
    robot.setMouseDelay(2);
  }

  private async initializeScreenshotDirectory() {
    try {
      // Create base screenshots directory if it doesn't exist
      await fs.mkdir(this.screenshotsBaseDir, { recursive: true });

      // Initialize metadata file if it doesn't exist
      try {
        await fs.access(this.screenshotMetadataFile);
      } catch {
        await fs.writeFile(
          this.screenshotMetadataFile,
          JSON.stringify([], null, 2)
        );
      }
    } catch (error) {
      console.error("Error initializing screenshot directory:", error);
    }
  }

  private async saveScreenshotMetadata(metadata: ScreenshotMetadata) {
    try {
      let existingMetadata: ScreenshotMetadata[] = [];
      try {
        const data = await fs.readFile(this.screenshotMetadataFile, "utf8");
        existingMetadata = JSON.parse(data);
      } catch {
        // If file doesn't exist or is invalid, start with empty array
      }

      existingMetadata.push(metadata);
      await fs.writeFile(
        this.screenshotMetadataFile,
        JSON.stringify(existingMetadata, null, 2)
      );
    } catch (error) {
      console.error("Error saving screenshot metadata:", error);
    }
  }

  private getScreenshotPath(): { directory: string; filename: string } {
    const now = new Date();
    const datePath = path.join(
      now.getFullYear().toString(),
      (now.getMonth() + 1).toString().padStart(2, "0"),
      now.getDate().toString().padStart(2, "0")
    );

    const timestamp = now.toISOString().replace(/[:.]/g, "-");
    const filename = `screenshot-${timestamp}-${uuidv4().slice(0, 8)}`;

    return {
      directory: path.join(this.screenshotsBaseDir, datePath),
      filename,
    };
  }

  private async takeScreenshot(): Promise<ToolResult> {
    const { directory, filename } = this.getScreenshotPath();
    await fs.mkdir(directory, { recursive: true });

    const originalPath = path.join(directory, `${filename}-original.png`);
    const compressedPath = path.join(directory, `${filename}-compressed`);

    try {
      const screenBuffer = await screenshot({ format: "png" });

      // Save original screenshot
      await fs.writeFile(originalPath, screenBuffer);

      // Initialize sharp with the captured image
      let sharpInstance = sharp(screenBuffer);

      // Try different compression formats
      let imageBuffer: Buffer | null = null;
      let usedFormat: "jpeg" | "png" = "png";
      let quality: number | undefined;
      let finalDimensions = { width: 0, height: 0 };

      // First try PNG with max compression
      try {
        imageBuffer = await sharpInstance
          .resize(1920, undefined, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .png({ compressionLevel: 9 })
          .toBuffer();

        const metadata = await sharp(imageBuffer).metadata();
        finalDimensions = {
          width: metadata.width!,
          height: metadata.height!,
        };

        if (imageBuffer.length <= MAX_IMAGE_SIZE) {
          await fs.writeFile(`${compressedPath}.png`, imageBuffer);
          console.log("Screenshot compressed successfully with PNG:", {
            size: `${(imageBuffer.length / 1024 / 1024).toFixed(2)}MB`,
          });
        } else {
          // If PNG is too large, try JPEG compression steps
          usedFormat = "jpeg";
          for (const [step, settings] of Object.entries(COMPRESSION_STEPS)) {
            try {
              const resizeResult = await sharpInstance
                .resize(settings.maxDimension, undefined, {
                  fit: "inside",
                  withoutEnlargement: true,
                })
                .jpeg({ quality: settings.quality })
                .toBuffer();

              const metadata = await sharp(resizeResult).metadata();
              finalDimensions = {
                width: metadata.width!,
                height: metadata.height!,
              };

              if (resizeResult.length <= MAX_IMAGE_SIZE) {
                imageBuffer = resizeResult;
                quality = settings.quality;
                await fs.writeFile(`${compressedPath}.jpg`, imageBuffer);
                console.log(
                  `Screenshot compressed successfully using ${step} JPEG compression:`,
                  {
                    quality: settings.quality,
                    dimensions: `${finalDimensions.width}x${finalDimensions.height}`,
                    size: `${(imageBuffer.length / 1024 / 1024).toFixed(2)}MB`,
                  }
                );
                break;
              }
            } catch (error) {
              console.error(`Error in compression step ${step}:`, error);
              continue;
            }
          }
        }
      } catch (error) {
        console.error("Error in PNG compression:", error);
        throw error;
      }

      if (!imageBuffer || imageBuffer.length > MAX_IMAGE_SIZE) {
        throw new Error("Unable to compress image below 5MB limit");
      }

      // Save metadata
      const metadata: ScreenshotMetadata = {
        timestamp: new Date().toISOString(),
        dimensions: finalDimensions,
        format: usedFormat,
        quality,
        size: imageBuffer.length,
        path: path.relative(
          this.screenshotsBaseDir,
          compressedPath + (usedFormat === "png" ? ".png" : ".jpg")
        ),
      };
      await this.saveScreenshotMetadata(metadata);

      // Return the result with correct media type
      return {
        base64Image: imageBuffer.toString("base64"),
        mediaType: usedFormat === "png" ? "image/png" : "image/jpeg",
      } as ToolResult & { mediaType: string };
    } catch (error) {
      throw new ToolError(`Failed to take screenshot: ${error}`);
    }
  }

  async execute(params: ExecuteParams): Promise<ToolResult> {
    const {
      action,
      text,
      coordinate,
      scrollAmount = 1,
      direction = "down",
      toggleState,
      button = "left",
      windowTitle,
      size,
      modifiers = [],
      repeat = 1,
      delay = 50,
    } = params;

    let result: ToolResult;

    switch (action) {
      case "mouse_move":
        if (!coordinate) {
          throw new ToolError("coordinate is required for mouse_move");
        }
        const [x, y] = this.scaleCoordinates(
          "api",
          coordinate[0],
          coordinate[1]
        );
        await this.validateCoordinates(x, y);
        robot.moveMouse(x, y);
        result = await this.takeDelayedScreenshot();
        break;

      case "mouse_toggle":
        if (!toggleState || !button) {
          throw new ToolError(
            "toggleState and button are required for mouse_toggle"
          );
        }
        robot.mouseToggle(toggleState, button);
        result = await this.takeDelayedScreenshot();
        break;

      case "left_click_drag":
        if (!coordinate) {
          throw new ToolError("coordinate is required for left_click_drag");
        }
        const [dragX, dragY] = this.scaleCoordinates(
          "api",
          coordinate[0],
          coordinate[1]
        );
        await this.validateCoordinates(dragX, dragY);
        robot.mouseToggle("down", "left");
        robot.dragMouse(dragX, dragY);
        robot.mouseToggle("up", "left");
        result = await this.takeDelayedScreenshot();
        break;

      case "mouse_scroll":
        if (!scrollAmount) {
          throw new ToolError("scrollAmount is required for mouse_scroll");
        }
        switch (direction) {
          case "up":
            robot.scrollMouse(0, -scrollAmount);
            break;
          case "down":
            robot.scrollMouse(0, scrollAmount);
            break;
          case "left":
            robot.scrollMouse(-scrollAmount, 0);
            break;
          case "right":
            robot.scrollMouse(scrollAmount, 0);
            break;
        }
        result = await this.takeDelayedScreenshot();
        break;

      case "key_toggle":
        if (!text) {
          throw new ToolError("text (key) is required for key_toggle");
        }
        if (!toggleState) {
          throw new ToolError("toggleState is required for key_toggle");
        }
        robot.keyToggle(text.toLowerCase(), toggleState);
        result = await this.takeDelayedScreenshot();
        break;

      case "key_tap_multiple":
        if (!text) {
          throw new ToolError("text (key) is required for key_tap_multiple");
        }
        for (let i = 0; i < repeat; i++) {
          robot.keyTap(text.toLowerCase(), modifiers as any[]);
          if (i < repeat - 1) {
            await this.delay(delay);
          }
        }
        result = await this.takeDelayedScreenshot();
        break;

      case "focus_window":
        if (!windowTitle) {
          throw new ToolError("windowTitle is required for focus_window");
        }
        // Using xdotool for Linux, powershell for Windows, or AppleScript for macOS
        if (process.platform === "win32") {
          await this.executeCommand(
            `powershell -Command "(New-Object -ComObject WScript.Shell).AppActivate('${windowTitle}')"`,
            "window focus"
          );
        } else if (process.platform === "darwin") {
          await this.executeCommand(
            `osascript -e 'tell application "${windowTitle}" to activate'`,
            "window focus"
          );
        } else {
          // Linux and other platforms
          try {
            await this.executeCommand(
              `xdotool search --name "${windowTitle}" windowactivate`,
              "window focus"
            );
          } catch (error) {
            throw new ToolError(
              `Failed to focus window: xdotool may not be installed. Please install it with your package manager (e.g., 'sudo apt-get install xdotool' on Ubuntu).`
            );
          }
        }
        result = await this.takeDelayedScreenshot();
        break;

      case "move_window":
        if (!windowTitle || !coordinate) {
          throw new ToolError(
            "windowTitle and coordinate are required for move_window"
          );
        }
        const [moveX, moveY] = this.scaleCoordinates(
          "api",
          coordinate[0],
          coordinate[1]
        );
        if (process.platform === "win32") {
          await this.executeCommand(
            `powershell -Command "$wshell = New-Object -ComObject WScript.Shell; $wshell.AppActivate('${windowTitle}'); [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${moveX}, ${moveY})"`,
            "window move"
          );
        } else if (process.platform === "darwin") {
          await this.executeCommand(
            `osascript -e 'tell application "${windowTitle}" to set bounds of window 1 to {${moveX}, ${moveY}, ${moveX + 800}, ${moveY + 600}}'`,
            "window move"
          );
        } else {
          // Linux and other platforms
          try {
            await this.executeCommand(
              `xdotool search --name "${windowTitle}" windowmove ${moveX} ${moveY}`,
              "window move"
            );
          } catch (error) {
            throw new ToolError(
              `Failed to move window: xdotool may not be installed. Please install it with your package manager (e.g., 'sudo apt-get install xdotool' on Ubuntu).`
            );
          }
        }
        result = await this.takeDelayedScreenshot();
        break;

      case "resize_window":
        if (!windowTitle || !size) {
          throw new ToolError(
            "windowTitle and size are required for resize_window"
          );
        }
        if (process.platform === "win32") {
          await this.executeCommand(
            `powershell -Command "$wshell = New-Object -ComObject WScript.Shell; $wshell.AppActivate('${windowTitle}'); $window = Get-Process | Where-Object {$_.MainWindowTitle -eq '${windowTitle}'} | Select-Object -First 1; $window.MainWindowHandle.Size = New-Object System.Drawing.Size(${size.width}, ${size.height})"`,
            "window resize"
          );
        } else if (process.platform === "darwin") {
          // Get current position to maintain it while resizing
          const currentPos = await this.executeCommand(
            `osascript -e 'tell application "${windowTitle}" to get the position of window 1'`,
            "get window position"
          );
          const posMatch = currentPos?.match(/(\d+), (\d+)/);
          const posX = posMatch ? parseInt(posMatch[1]) : 0;
          const posY = posMatch ? parseInt(posMatch[2]) : 0;

          await this.executeCommand(
            `osascript -e 'tell application "${windowTitle}" to set bounds of window 1 to {${posX}, ${posY}, ${posX + size.width}, ${posY + size.height}}'`,
            "window resize"
          );
        } else {
          // Linux and other platforms
          try {
            await this.executeCommand(
              `xdotool search --name "${windowTitle}" windowsize ${size.width} ${size.height}`,
              "window resize"
            );
          } catch (error) {
            throw new ToolError(
              `Failed to resize window: xdotool may not be installed. Please install it with your package manager (e.g., 'sudo apt-get install xdotool' on Ubuntu).`
            );
          }
        }
        result = await this.takeDelayedScreenshot();
        break;

      // Original cases remain the same
      case "left_click":
      case "right_click":
      case "middle_click":
      case "double_click":
        if (text) {
          throw new ToolError(`text is not accepted for ${action}`);
        }
        if (coordinate) {
          throw new ToolError(`coordinate is not accepted for ${action}`);
        }
        await this.handleMouseClick(action);
        result = await this.takeDelayedScreenshot();
        break;

      case "key":
      case "type":
        if (!text) {
          throw new ToolError(`text is required for ${action}`);
        }
        if (coordinate) {
          throw new ToolError(`coordinate is not accepted for ${action}`);
        }
        if (action === "key") {
          await this.handleKeyPress(text);
        } else {
          await this.handleTypeString(text);
        }
        result = await this.takeDelayedScreenshot();
        break;

      case "screenshot":
        result = await this.takeDelayedScreenshot();
        break;

      case "cursor_position":
        const mouse = robot.getMousePos();
        const [scaledX, scaledY] = this.scaleCoordinates(
          "computer",
          mouse.x,
          mouse.y
        );
        result = { output: `X=${scaledX},Y=${scaledY}` };
        break;

      default:
        throw new ToolError(`Invalid action: ${action}`);
    }

    return result;
  }

  // Helper method for executing system commands
  private async executeCommand(
    command: string,
    operation: string
  ): Promise<string | undefined> {
    try {
      const { exec } = require("child_process");
      return await new Promise<string | undefined>((resolve, reject) => {
        exec(command, (error: Error | null, stdout: string, stderr: string) => {
          if (error) {
            reject(
              new ToolError(`Failed to execute ${operation}: ${error.message}`)
            );
          }
          resolve(stdout ? stdout.trim() : undefined);
        });
      });
    } catch (error) {
      throw new ToolError(`Failed to execute ${operation}: ${error}`);
    }
  }

  toParams() {
    // If scaling is disabled, use actual screen dimensions
    let width = this.screenDimensions.width;
    let height = this.screenDimensions.height;

    // Only apply scaling if enabled
    if (this.scalingEnabled) {
      // Find the best matching target resolution
      const ratio = width / height;
      let targetDimension = null;

      // Check for exact match first
      for (const dimension of Object.values(MAX_SCALING_TARGETS)) {
        if (dimension.width === width && dimension.height === height) {
          targetDimension = dimension;
          break;
        }
      }

      // If no exact match, find similar aspect ratio
      if (!targetDimension) {
        for (const dimension of Object.values(MAX_SCALING_TARGETS)) {
          const dimensionRatio = dimension.width / dimension.height;
          if (Math.abs(dimensionRatio - ratio) < 0.1) {
            targetDimension = dimension;
            break;
          }
        }
      }

      // If we found a target dimension, use it
      if (targetDimension) {
        width = targetDimension.width;
        height = targetDimension.height;
        console.log(`Reporting scaled dimensions: ${width}x${height}`);
      } else {
        console.log(`Reporting actual dimensions: ${width}x${height}`);
      }
    } else {
      console.log(
        `Scaling disabled, reporting actual dimensions: ${width}x${height}`
      );
    }

    return {
      name: "computer",
      type: "computer_20241022",
      display_width_px: width,
      display_height_px: height,
      display_number: this.displayNum,
    };
  }

  private async handleKeyPress(text: string): Promise<void> {
    const keyParts = text.split("+");
    const key = keyParts.pop()!;
    const modifiers = keyParts;

    const robotKey = KEY_MAPPINGS[key] || key.toLowerCase();

    if (modifiers.length > 0) {
      robot.keyTap(robotKey, modifiers as any[]);
    } else {
      robot.keyTap(robotKey);
    }
  }

  private async handleTypeString(text: string): Promise<void> {
    const chunks = this.chunkString(text, TYPING_GROUP_SIZE);
    for (const chunk of chunks) {
      robot.typeString(chunk);
      await this.delay(chunk.length * TYPING_DELAY_MS);
    }
  }

  private async handleMouseClick(action: string): Promise<void> {
    const button = {
      left_click: "left",
      right_click: "right",
      middle_click: "middle",
    }[action] as "left" | "right" | "middle";

    if (action === "double_click") {
      robot.mouseClick("left", true);
    } else {
      robot.mouseClick(button);
    }
  }

  private async takeDelayedScreenshot(): Promise<ToolResult> {
    // Wait for UI to settle
    await this.delay(SCREENSHOT_DELAY_MS);

    // Try multiple times if needed
    for (let attempt = 1; attempt <= SCREENSHOT_RETRY_COUNT; attempt++) {
      try {
        return await this.takeScreenshot();
      } catch (error) {
        if (attempt === SCREENSHOT_RETRY_COUNT) {
          throw error;
        }
        console.log(`Screenshot attempt ${attempt} failed, retrying...`);
        await this.delay(SCREENSHOT_RETRY_DELAY_MS);
      }
    }

    throw new ToolError("Failed to take screenshot after multiple attempts");
  }

  private scaleCoordinates(
    source: "api" | "computer",
    x: number,
    y: number
  ): [number, number] {
    if (!this.scalingEnabled) return [x, y];

    const ratio = this.screenDimensions.width / this.screenDimensions.height;
    let targetDimension = null;

    // First try to find an exact match for the current screen resolution
    for (const [name, dimension] of Object.entries(MAX_SCALING_TARGETS)) {
      if (
        dimension.width === this.screenDimensions.width &&
        dimension.height === this.screenDimensions.height
      ) {
        console.log(`Found exact resolution match: ${name}`);
        // If we have an exact match, no scaling needed
        return [x, y];
      }
    }

    // If no exact match, try to find a resolution with a similar aspect ratio
    for (const [name, dimension] of Object.entries(MAX_SCALING_TARGETS)) {
      const dimensionRatio = dimension.width / dimension.height;
      if (Math.abs(dimensionRatio - ratio) < 0.1) {
        targetDimension = dimension;
        console.log(`Using similar aspect ratio resolution: ${name}`);
        break;
      }
    }

    // If no similar aspect ratio found, use the screen dimensions as is
    if (!targetDimension) {
      console.log("No suitable scaling target found, using raw coordinates");
      return [x, y];
    }

    const xScalingFactor = targetDimension.width / this.screenDimensions.width;
    const yScalingFactor =
      targetDimension.height / this.screenDimensions.height;

    if (source === "api") {
      if (x > targetDimension.width || y > targetDimension.height) {
        throw new ToolError(
          `Coordinates ${x}, ${y} are outside scaled screen bounds ` +
            `(${targetDimension.width}x${targetDimension.height})`
        );
      }
      return [Math.round(x / xScalingFactor), Math.round(y / yScalingFactor)];
    }

    return [Math.round(x * xScalingFactor), Math.round(y * yScalingFactor)];
  }

  private chunkString(str: string, size: number): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < str.length; i += size) {
      chunks.push(str.slice(i, i + size));
    }
    return chunks;
  }

  private async validateCoordinates(x: number, y: number): Promise<void> {
    if (
      x < 0 ||
      x > this.screenDimensions.width ||
      y < 0 ||
      y > this.screenDimensions.height
    ) {
      throw new ToolError(
        `Coordinates (${x}, ${y}) are outside screen bounds ` +
          `(${this.screenDimensions.width}x${this.screenDimensions.height})`
      );
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
