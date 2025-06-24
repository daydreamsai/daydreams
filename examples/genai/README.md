# GenAI Discord Bot Example

This example demonstrates a multimodal agent in Discord using the
`@daydreamsai/genai` extension.

## Features

- Responds to text messages.
- Generates images from user prompts.

## How to Run

1.  **Environment Variables**

    Create a `.env` file in the project root with the following:

    ```
    GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
    DISCORD_TOKEN="YOUR_DISCORD_BOT_TOKEN"
    DISCORD_BOT_NAME="YourBotName"
    PROCESS_ATTACHMENTS="true"
    ```

2.  **Install & Build**

    From the project root, run:

    ```bash
    pnpm install
    pnpm build:packages
    ```

3.  **Start the Bot**

    ```bash
    bun run examples/genai/example-genai.ts
    ```

## Example Usage

In your Discord server, mention the bot and ask it to generate an image:

`@YourBotName generate an image of a robot developer writing code`
