# @daydreamsai/genai

This package provides a DaydreamsAI SDK extension with general-purpose
Generative AI (GenAI) capabilities and actions that can be easily added to any
Daydream agent.

## Overview

The primary goal of this package is to encapsulate reusable AI functionalities,
making them independent of specific communication channels (like Discord,
Telegram, Web UI, etc.). By adding this extension to an agent, the agent gains
access to these core AI actions.

Communication-specific extensions (e.g., `@daydreamsai/discord`) are responsible
for handling the specifics of their platform and preparing data in a format that
these general AI actions can consume.

## Current Features

### Actions

- **`analyzeImage`**:

  - **Description**: Analyzes provided text and accompanying image attachments,
    then generates a relevant textual response. This action can be used to
    describe images, answer questions about them, or perform other
    vision-related tasks.
  - **Input Schema**:
    - `text` (string): The text prompt accompanying the image(s).
    - `attachments` (array of objects, min 1): Image attachments to analyze.
      Each object should contain:
      - `url` (string, URL): URL of the image. This is the primary way image
        data is expected.
      - `filename` (string, optional): Filename of the image.
      - `contentType` (string, optional): MIME type of the image (e.g.,
        `image/jpeg`).
      - `data` (Buffer, optional): Raw image data as a Buffer. While the action
        can process this if provided, most input extensions will primarily pass
        the `url`.
  - **How it works**: This action leverages the agent's main configured Language
    Model (e.g., a Gemini model via `@ai-sdk/google`). It constructs a
    multimodal prompt with the provided text and image data (typically by
    fetching the `url`, or using `data` if directly available) and uses the AI
    SDK's `generateText` function to get a response.

- **`analyzeVideo`**:

  - **Description**: Analyzes provided text and accompanying video attachments,
    then generates a relevant textual response. This action can be used to
    describe videos, answer questions about them, summarize content, or perform
    other video-related tasks.
  - **Input Schema**:
    - `text` (string): The text prompt accompanying the video(s).
    - `attachments` (array of objects, min 1): Video attachments to analyze.
      Each object should contain:
      - `url` (string, URL): URL of the video. This is the primary way video
        data is expected.
      - `filename` (string, optional): Filename of the video.
      - `contentType` (string, optional): MIME type of the video (e.g.,
        `video/mp4`).
      - `data` (Buffer, optional): Raw video data as a Buffer. While the action
        can process this if provided, most input extensions will primarily pass
        the `url`.
  - **How it works**: Similar to `analyzeImage`, this action uses the agent's
    main configured Language Model. It constructs a multimodal prompt with the
    text and video data (typically by fetching the `url`). The underlying AI SDK
    (`ai` package) and the language model provider (e.g., `@ai-sdk/google`) are
    responsible for processing the video content. _Note: The exact capabilities
    depend on the LLM's support for video understanding._

- **`generateImageAction`**:
  - **Description**: Generates an image based on a textual prompt using the
    agent's configured model. The generated image is then uploaded to a hosting
    service (Catbox.moe), and the action returns an object containing the image
    URL, name, and MIME type.
  - **Input Schema**:
    - `prompt` (string): The text prompt to generate an image from.
  - **Output Schema (Returns)**:
    - `name` (string): Filename of the generated image.
    - `mimeType` (string): MIME type of the generated image.
    - `url` (string, URL): URL of the uploaded image on Catbox.
  - **How it works**: This action sends the prompt to the agent's configured
    Language Model (e.g., a Google Gemini model capable of image generation).
    The model returns the image data (e.g., as base64). The action then decodes
    this data, uploads it to `Catbox.moe` as a file, and returns the Catbox URL
    along with the image's name and MIME type.

## Usage

1.  **Installation** (assuming it's part of your monorepo/workspace): Ensure
    it's correctly set up in your project's package management (e.g., pnpm
    workspaces).

2.  **Add to Agent Configuration**: In your agent's main setup file (e.g., where
    you use `createDreams`):

    ```typescript
    import { createDreams } from "@daydreamsai/core";
    import { genai } from "@daydreamsai/genai";
    import { createGoogleGenerativeAI } from "@ai-sdk/google";

    const agent = createDreams({
      model: createGoogleGenerativeAI({
        // apiKey: env.GEMINI_API_KEY, // Make sure API key is configured
      })("gemini-2.0-flash-exp"), // Example model
      // logger: new Logger({ level: LogLevel.DEBUG }),
      extensions: [genai], // Add the genai extension
    });

    // To start the agent (if it's not started elsewhere)
    // async function main() {
    //   await agent.start();
    // }
    // main();
    ```

3.  **Invoking Actions**: Once the agent is running with this extension, the
    Language Model (LLM) can choose to use the available actions
    (`analyzeImage`, `analyzeVideo`, `generateImageAction`) when appropriate,
    based on the user's input and the action's description.

    For instance:

    - If a user on Discord sends a message like "What is in this picture?" along
      with an image, the LLM should be able to identify that the `analyzeImage`
      action is suitable. The input extension (e.g., `@daydreamsai/discord`) is
      responsible for providing the `text` and `attachments` (containing the
      image `url`) to the agent.
    - If a user asks "Generate an image of a futuristic city," the LLM can
      utilize the `generateImageAction` with the provided text as the `prompt`.
      The action will then return the URL of the generated image.

## Future Possibilities

This package can be expanded to include other general AI actions, such as:

- Advanced video analysis (e.g., specific object tracking, action recognition).
- Complex document summarization or Q&A over large texts.
- Voice transcription and analysis (if an input extension provides audio data).

By keeping these actions in a dedicated `genai` package, they remain reusable
across different agent types and communication platforms.
