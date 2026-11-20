# Daydreams Pre-Execution Firewall (`x402-nullclear-firewall`)

Protects autonomous Daydreams agents across **Base, Ethereum, Arbitrum, Optimism, Polygon, BSC, and Solana** using the [NullClear Pre-Execution Firewall](https://nullclear.dev) (`Check → Enforce → Monitor`).

## Capabilities

1. **1-Call Pre-Sign Firewall (`POST https://api.nullclear.dev/v1/guard`)**:
   - Recursively unwraps Multicall3, Universal Router, and Safe multisig calldata
   - Audits EIP-712 Permit2 & Seaport typed-data signatures for unlimited drainer approvals
   - Parses Solana wire transactions (`rawTransactionBase64`) and audits SPL / Token-2022 extensions (`TransferHook`, `PermanentDelegate`, active `MintAuthority` / `FreezeAuthority`)
   - Executes stateful `eth_simulateV1` / `simulateTransaction` preflight and returns an explicit `recommendedAgentAction` (`EXECUTE_SAFE`, `CAUTION_HIGH_RISK`, `ABORT_CRITICAL_TRAP`, `ABORT_DRAINER_APPROVAL`, or `ABORT_WILL_REVERT`)
2. **Drop-In Guarded JSON-RPC (`https://api.nullclear.dev/rpc/:chain/:apiKey`)**:
   - Zero-credit read passthrough (`<5ms` edge KV auth) with automatic pre-broadcast transaction screening on every `eth_sendRawTransaction` / `sendTransaction` call
3. **Zero-Key Free Tier + x402 Prepaid Passes**:
   - Runs with zero configuration on the free tier (`10` live forensic scans/day/IP, cached scans free) or with an `nc_live_...` Prepaid Pass minted via x402 (`POST https://api.nullclear.dev/v1/pass/buy` on Base USDC).

## Quickstart

```bash
cp .env.example .env
bun test
bun run agent.ts
```
