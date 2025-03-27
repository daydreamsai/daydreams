# Gigaverse Terminal UI

This project provides a terminal-based user interface for the Gigaverse game,
allowing you to play the rock-paper-scissors dungeon crawler game through a
terminal interface.

## Features

- Real-time game state visualization

## Setup

1. Install dependencies:

   ```
   bun i && bun run build:packages
   ```

2. Set up environment variables: Create a `.env` file in the root directory with
   the following variables:

   To get the GIGA_TOKEN you need to login to you:

   1. Login to gigaverse account
   2. Inspect the page. Navigate to 'Application'
   3. Storage -> Local Storage
   4. Within the `authResponse` there will be a value called `jwt` - this is the
      GIGA_TOKEN.
   5. Copy and save in your ENV

   ```
   ANTHROPIC_API_KEY=your_anthropic_api_key
   GIGA_TOKEN=your_gigaverse_token
   OPENAI_API_KEY=your_openai_api_key
   ```

3. Run the application:
   ```
   bun run examples/games/gigaverse/example-gigaverse-simple-ui.ts
   ```
