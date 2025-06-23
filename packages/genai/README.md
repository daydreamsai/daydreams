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
      - `url` (string, URL): URL of the image.
      - `filename` (string, optional): Filename of the image.
      - `contentType` (string, optional): MIME type of the image (e.g.,
        `image/jpeg`).
      - `data` (Buffer, optional): Pre-fetched image data as a Buffer. If
        provided by an input extension (like `@daydreamsai/discord` with
        `PROCESS_ATTACHMENTS=true`), this will be used directly, avoiding
        another fetch.
  - **How it works**: This action leverages the agent's main configured Language
    Model (e.g., a Gemini model via `@ai-sdk/google`). It constructs a
    multimodal prompt with the provided text and image data (either pre-fetched
    `data` or by fetching the `url`) and uses the AI SDK's `generateText`
    function to get a response.

- **`analyzeVideo`**:

  - **Description**: Analyzes provided text and accompanying video attachments,
    then generates a relevant textual response. This action can be used to
    describe videos, answer questions about them, summarize content, or perform
    other video-related tasks.
  - **Input Schema**:
    - `text` (string): The text prompt accompanying the video(s).
    - `attachments` (array of objects, min 1): Video attachments to analyze.
      Each object should contain:
      - `url` (string, URL): URL of the video.
      - `filename` (string, optional): Filename of the video.
      - `contentType` (string, optional): MIME type of the video (e.g.,
        `video/mp4`).
      - `data` (Buffer, optional): Pre-fetched video data as a Buffer. If
        provided by an input extension, this will be used directly, avoiding
        another fetch.
  - **How it works**: Similar to `analyzeImage`, this action uses the agent's
    main configured Language Model. It constructs a multimodal prompt with the
    text and video data. The underlying AI SDK (`ai` package) and the language
    model provider (e.g., `@ai-sdk/google`) are responsible for processing the
    video content. _Note: The exact capabilities depend on the LLM's support for
    video understanding._

- **`generateImage`**:
  - **Description**: Generates an image based on a text prompt using the Gemini
    API. The generated image is saved to a temporary local file, and the action
    returns an object containing the file path and other metadata. This output
    is specifically structured to be easily piped into other actions, such as
    `discord:message-with-attachments`.
  - **Input Schema**:
    - `text` (string): The text prompt to generate the image from.
    - `model` (string, optional): The specific Gemini model to use for
      generation (defaults to `gemini-2.0-flash-preview-image-generation`).
  - **Returns Schema**: An object containing:
    - `success` (boolean): Whether the generation was successful.
    - `message` (string): A status message.
    - `attachments` (array of objects): An array structured for use in
      attachment-based outputs. Contains:
      - `url` (string): The local file path to the generated image.
      - `filename` (string): The name of the saved file.
    - `prompt` (string): The original text prompt used.
  - **How it works**: This action calls the Google Gen AI SDK with the specified
    prompt. Upon receiving the base64-encoded image data from the API, it saves
    the image to a temporary directory on the local file system. It then returns
    a structured object containing the path, making it easy for the AI to pass
    this result to another action that can handle file uploads.

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
        apiKey: env.GEMINI_API_KEY,
      })("gemini-2.5-flash-preview-04-17"),
      logger: new Logger({ level: LogLevel.DEBUG }),
      extensions: [genai],
    });

    await agent.start();
    ```

3.  **Invoking Actions**: Once the agent is running with this extension, the
    Language Model (LLM) can choose to use the `analyzeImage` action when
    appropriate based on the user's input and the action's description. For
    instance, if a user on Discord sends a message like "What is in this
    picture?" along with an image, the LLM should be able to identify that the
    `analyzeImage` action is suitable.

    The input extension (e.g., `@daydreamsai/discord`) is responsible for
    providing the `text` and `attachments` (ideally with pre-fetched `data` if
    `PROCESS_ATTACHMENTS=true` is set for the Discord extension) to the agent.
    The agent's core logic, guided by the LLM, then routes this to the
    `analyzeImage` action.

## Future Possibilities

This package can be expanded to include other general AI actions, such as:

- Advanced video analysis.
- Complex document summarization or Q&A.
- Voice transcription and analysis (if an input extension provides audio data).

By keeping these actions in a dedicated `genai` package, they remain reusable
across different agent types and communication platforms.
