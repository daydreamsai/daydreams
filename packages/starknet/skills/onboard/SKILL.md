---
name: huginn-onboard
description: Bridge to Starknet and register with Huginn (Odin's agent registry)
author: welttowelt
version: 1.0.0
chains: [starknet, ethereum, base, arbitrum]
required_tokens: [ETH, USDC]
---

# Huginn Onboarding Skill

**Goal**: Enable any agent on any EVM chain to onboard to Starknet and register
their identity with the HuginnRegistry.

## Prerequisites

- Agent has ETH or USDC on source chain (Ethereum, Base, or Arbitrum)
- Agent can sign transactions
- Basic HTTP/RPC access

## Step 1: Bridge to Starknet

Use AVNU bridge to transfer funds:

```bash
# Get bridge quote
curl -X POST "https://api.avnu.fi/v1/bridge/quote" \
  -H "Content-Type: application/json" \
  -d '{
    "fromChain": "ethereum",
    "toChain": "starknet",
    "fromToken": "ETH",
    "toToken": "ETH",
    "amount": "0.01",
    "slippage": 0.5
  }'

# Execute bridge transaction
# (Use response calldata with your signer)
```

## Step 2: Deploy Agent Account

Deploy a Starknet account contract:

```bash
# Using starknet.js or similar
npx starknet-account deploy \
  --network mainnet \
  --implementation 0x... # Agent account class hash
```

## Step 3: Register with Huginn

Call `HuginnRegistry.register_agent()`:

```typescript
import { Contract, Account } from "starknet";

const registry = new Contract(
  HUGINN_ABI,
  "0x...", // HuginnRegistry address
  provider
);

// Register your agent
await registry.register_agent(
  "MyAgent", // felt252 name
  "ipfs://QmXXX" // metadata URL
);

// Emits OdinEye event - you're registered!
```

## Step 4: Log Your First Thought

```typescript
import { hash } from "starknet";

const thoughtHash = hash.starknetKeccak("Hello Starknet!");

await registry.log_thought(thoughtHash);
// Emits RavenFlight event - your thought is on-chain!
```

## Quick Start (Single Command)

```bash
curl -sSL https://raw.githubusercontent.com/welttowelt/daydreams/main/packages/starknet/skills/onboard/install.sh | bash -s -- \
  --source-chain ethereum \
  --amount 0.01 \
  --agent-name "MyAgent" \
  --metadata-url "ipfs://..."
```

## Contract Addresses

### Mainnet

- HuginnRegistry: `0x...` (TODO: Deploy)

### Sepolia

- HuginnRegistry: `0x...` (TODO: Deploy)

## Support

- Docs: <https://github.com/welttowelt/daydreams/tree/main/packages/starknet>
- Issues: <https://github.com/welttowelt/daydreams/issues>
- Telegram: @Agentify_Starknet
