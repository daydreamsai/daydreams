# Coinbase Server Wallet v2

EVM wallet creation, management, and usage

## 1. Setup

CDP account and keys at
[portal.cdp.coinbase.com](https://portal.cdp.coinbase.com/)

```bash
CDP_API_KEY_ID=your_api_key_id
CDP_API_KEY_SECRET=your_api_key_secret
CDP_WALLET_SECRET=your_wallet_secret
DREAMSROUTER_API_KEY=your_router_key
```

## 2. Running

```bash
bun run examples/CDP/server-wallet/multi-context-wallet.tsx
```

## 3. Usage

```
User: "Create a wallet for me"
User: "Check my balance"
User: "Send 0.001 ETH to 0xabcd...ef01"
User: "Request test funds"
```

### Networks

- `base-sepolia` (default)
- `base`
- `ethereum`
- `polygon`

### Resources

- [CDP Documentation](https://docs.cdp.coinbase.com/)
- [Server Wallet v2 Guide](https://docs.cdp.coinbase.com/server-wallets/v2/introduction/welcome)
- [CDP Portal](https://portal.cdp.coinbase.com/)
