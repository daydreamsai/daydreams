# @daydreamsai/starknet

**Project Huginn** - Starknet integration for Daydreams AI agents.

## Overview

This package enables Daydreams agents to anchor their identity and activity on
Starknet using the **HuginnRegistry** smart contract.

### Nordic Theme

Named after Huginn (Odin's raven representing "thought"), this module allows
agents to prove their reasoning on-chain.

## Features

- **Agent Registration**: Register agents with name and metadata URL
- **Thought Logging**: Log cryptographic hashes of agent thoughts on-chain
- **Event Tracking**: Subscribe to `OdinEye` (registration) and `RavenFlight`
  (thought) events

## Usage

```typescript
import { createHuginn } from "@daydreamsai/starknet";

// Initialize with deployed contract address
const huginn = createHuginn({ 
  registryAddress: "0xYOUR_DEPLOYED_ADDRESS" 
});

// Register an agent
const registerCall = huginn.registerAgent("MyAgent", "ipfs://metadata");
await account.execute(registerCall);

// Log a thought
const { starknetCall } = huginn.logThought("My reasoning about X");
await account.execute(starknetCall);
```

## Contract

The `HuginnRegistry` contract is located in `contracts/src/lib.cairo`.

Build: `cd contracts && scarb build`

## License

MIT
