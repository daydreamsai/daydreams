# @daydreamsai/starknet

**Project Huginn** - Starknet integration for Daydreams AI agents.

## Overview

This package enables Daydreams agents to anchor their identity and activity on Starknet using the **HuginnRegistry** smart contract.

### Nordic Theme

Named after Huginn (Odin's raven representing "thought"), this module allows agents to prove their reasoning on-chain.

## Features

- **Agent Registration**: Register agents with name and metadata URL
- **Thought Logging**: Log cryptographic hashes of agent thoughts on-chain
- **Event Tracking**: Subscribe to `OdinEye` (registration) and `RavenFlight` (thought) events

## Usage

```typescript
import { Huginn } from '@daydreamsai/starknet';

// Register an agent
const registerCall = Huginn.registerAgent("MyAgent", "ipfs://metadata");

// Log a thought
const logCall = Huginn.logThought("My reasoning about X");
```

## Contract

The `HuginnRegistry` contract is located in `contracts/src/lib.cairo`.

Build: `cd contracts && scarb build`

## License

MIT
