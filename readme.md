<p align="center">
  <img src="/docs/public/Daydreams.png" alt="Daydreams">
</p>

> ⚠️ **Warning**: This is alpha software under active development. Expect
> frequent breaking changes and bugs. The API is not yet stable.

# Cross-chain Generative Agents

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Status](https://img.shields.io/badge/Status-Alpha-orange.svg)]()
[![Documentation](https://img.shields.io/badge/Documentation-docs-blue.svg)](https://docs.dreams.fun)
[![Twitter Follow](https://img.shields.io/twitter/follow/daydreamsai?style=social)](https://twitter.com/daydreamsagents)
[![GitHub stars](https://img.shields.io/github/stars/daydreamsai/daydreams?style=social)](https://github.com/daydreamsai/daydreams)

Daydreams is a powerful framework for building generative agents that can
execute tasks across any blockchain or API.

| Feature                | Description                                                          |
| ---------------------- | -------------------------------------------------------------------- |
| 🔗 Chain Agnostic      | Execute transactions and interact with any blockchain network        |
| 👥 Multi-Expert System | Leverage specialized modules working together to solve complex tasks |
| 🧠 Context Management  | Simple yet powerful memory and context handling system               |
| 🎯 Goal-Oriented       | Long-term planning and goal-oriented behavior capabilities           |
| 💾 Persistent Memory   | Built-in support for storing and retrieving long-term information    |
| 🤔 Advanced Reasoning  | Multi-step reasoning using Hierarchical Task Networks                |

Want to contribute? Check our
[issues](https://github.com/daydreamsai/daydreams/issues) for tasks labeled
`good first issue`.

## Supported Chains

<p> 
  <a href="#chain-support">
  <img src="./.github/eth-logo.svg" height="30" alt="Ethereum" style="margin: 0 10px;" />
  <img src="./.github/arbitrum-logo.svg" height="30" alt="Arbitrum" style="margin: 0 10px;" />
  <img src="./.github/optimism-logo.svg" height="30" alt="Optimism" style="margin: 0 10px;" />
  <img src="./.github/solana-logo.svg" height="30" alt="Hyperledger" style="margin: 0 10px;" />
  <img src="./.github/Starknet.svg" height="30" alt="StarkNet" style="margin: 0 10px;" />
  <img src="./.github/hl-logo.svg" height="30" alt="Hyperledger" style="margin: 0 10px;" />
  </a>
</p>

## Quick Start

### Prerequisites

- Node.js 18+ using [nvm](https://github.com/nvm-sh/nvm)

### LLM Keys

You'll need an API key for the LLM you want to use. We recommend using
[Groq](https://groq.com/) for most use cases.

- [OpenAI](https://openai.com/)
- [Anthropic](https://anthropic.com/)
- [Groq](https://groq.com/)
- [Gemini](https://deepmind.google/technologies/gemini/)

## Your First Dreams Agent

We use [ai-sdk](https://sdk.vercel.ai/docs/introduction) to support multiple
LLMs. You will need to install the ai-sdk for the LLM you want to use.

```bash
npm i @daydreamsai/core @ai-sdk/groq
```

Dreams agents are all functional. `createDreams` is a function that returns an
agent object, which can be run with `await agent.run()`. Inject discord,
telegram, or any other input/output to the agent and define your own actions.

```typescript
import { createGroq } from "@ai-sdk/groq";
import { createDreams } from "@daydreamsai/core";
import { cli } from "@daydreamsai/core/extensions";

// Initialize Groq client
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY!,
});

// Create Dreams agent instance
const agent = createDreams({
  model: groq("deepseek-r1-distill-llama-70b"),
  extensions: [cli],
}).start();
```

Now chat via the CLI with the agent.

Read the [docs](https://docs.dreams.fun) for more information on how to use the
agent.

### Development

We use [bun](https://bun.sh/) for development.

```bash
bun install

bun build:packages --watch
```

Edit the core package and watch for changes, and play with examples.

## Contributing

Looking to contribute? We'd love your help!

If you are a developer and would like to contribute with code, please open an
issue to discuss before opening a Pull Request.

### Star History

[![Star History Chart](https://api.star-history.com/svg?repos=daydreamsai/daydreams&type=Date)](https://star-history.com/#daydreamsai/daydreams&Date)
