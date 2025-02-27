# Computer Automation Actions

This module provides a set of actions for automating computer interactions using
the Daydreams AI framework. These actions allow you to control the mouse,
keyboard, take screenshots, and manage windows programmatically.

## Prerequisites

- Node.js 18+
- Required environment variables:
  - `ANTHROPIC_API_KEY`: API key for Anthropic's Claude model

## Installation

Make sure you have the required dependencies installed:

```bash
npm install @daydreamsai/core @ai-sdk/anthropic robotjs sharp screenshot-desktop uuid
```

## Available Actions

### Mouse Actions

- **takeScreenshot**: Capture a screenshot of the current screen
- **moveMouse**: Move the mouse cursor to specific coordinates
- **clickMouse**: Perform a mouse click (left, right, or middle button)
- **dragMouse**: Click and drag the mouse from current position to target
  coordinates
- **scrollMouse**: Scroll the mouse wheel in a specified direction
- **getCursorPosition**: Get the current position of the mouse cursor

### Keyboard Actions

- **typeText**: Type text at the current cursor position
- **pressKey**: Press a specific key or key combination

### Window Management Actions

- **focusWindow**: Focus a window by its title
- **resizeWindow**: Resize a window by its title

## Usage Example

```typescript
import { createDreams, validateEnv } from "@daydreamsai/core";
import { cli } from "@daydreamsai/core/extensions";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import {
  takeScreenshotAction,
  moveMouseAction,
  clickMouseAction,
} from "./computer-actions";

// Validate environment variables
validateEnv(
  z.object({
    ANTHROPIC_API_KEY: z.string().min(1, "ANTHROPIC_API_KEY is required"),
  })
);

async function main() {
  const agent = await createDreams({
    model: anthropic("claude-3-5-sonnet-20240620"),
    extensions: [cli],
    actions: [takeScreenshotAction, moveMouseAction, clickMouseAction],
  }).start();

  console.log("Computer automation actions are now available!");
}

main().catch(console.error);
```

## Implementation Details

These actions are built on top of the `ComputerTool` class from `base.ts`, which
provides the core functionality for interacting with the operating system. The
actions are designed to be used with the Daydreams AI framework, making it easy
to integrate computer automation into your AI agents.

## Security Considerations

These actions have direct control over your computer's mouse and keyboard, so
use them with caution. Be careful when running scripts that use these actions,
especially if they come from untrusted sources.

## License

This project is licensed under the terms of the license included in the
repository.
