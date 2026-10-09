# @daydreamsai/peer-cash

[Peer Cash](https://peer.xyz/cash-sdk) extension for Daydreams agents: cash out
Base USDC to fiat in payment apps (Venmo, Revolut, Wise, Zelle, and more)
through the Peer P2P protocol.

The extension wraps the
[`@zkp2p/cash`](https://www.npmjs.com/package/@zkp2p/cash) SDK. It is offramp
only and non-custodial: the agent wallet deposits USDC into the Peer escrow
contract, a buyer pays the payee fiat and proves the payment, and the protocol
releases the USDC. There is no API key, no hosted widget, and no custody by any
provider. Pricing is the live Chainlink oracle rate at fill time with zero
spread.

## Installation

```bash
pnpm add @daydreamsai/peer-cash
```

## Quick start

```ts
import { createDreams } from "@daydreamsai/core";
import { createPeerCashExtension } from "@daydreamsai/peer-cash";

const agent = createDreams({
  model,
  extensions: [
    createPeerCashExtension({
      environment: "production",
      referralCode: "ABC123", // optional, see "Earn the integration share"
    }),
  ],
});
```

Set the agent wallet through the environment:

```bash
export PEER_CASH_PRIVATE_KEY=0x... # wallet holding Base USDC
```

Without a wallet the read actions still work; transaction-signing actions return
a `WALLET_NOT_CONFIGURED` error result instead of throwing.

## Configuration

`createPeerCashExtension(config)` validates its configuration when called and
throws on invalid values.

| Option         | Env fallback            | Default        | Description                                                          |
| -------------- | ----------------------- | -------------- | -------------------------------------------------------------------- |
| `environment`  | `PEER_CASH_ENVIRONMENT` | `"production"` | `production`, `preproduction`, or `staging`                          |
| `referralCode` |                         |                | Six-character Peer referral code; earns the 50 bps integration share |
| `referrer`     |                         |                | Analytics-only ERC-8021 attribution code(s); carries no payout       |
| `privateKey`   | `PEER_CASH_PRIVATE_KEY` |                | Agent wallet key for signing Base transactions                       |
| `rpcUrl`       | `PEER_CASH_RPC_URL`     | public Base    | Base RPC endpoint                                                    |
| `client`       |                         |                | Preconstructed `CashClient`, used by tests and advanced hosts        |

## Actions

| Action                   | Signs transactions | Description                                                                     |
| ------------------------ | ------------------ | ------------------------------------------------------------------------------- |
| `peer-cash.capabilities` | No                 | Supported platforms, currencies, payee format hints, and amount bounds          |
| `peer-cash.fillStats`    | No                 | 30-day fill counts and median first-fill time per `platform:currency` pair      |
| `peer-cash.estimate`     | No                 | Oracle rate, fiat receive amount, and historical ETA for a prospective cash-out |
| `peer-cash.cashout`      | Yes                | Create a cash-out order: platform, currency, payee handle, USDC amount          |
| `peer-cash.order`        | No                 | Live order state by deposit id, with a plain-language explanation               |
| `peer-cash.orders`       | No                 | List orders for a wallet (defaults to the agent wallet)                         |
| `peer-cash.withdraw`     | Yes                | The one unwind verb: partial with an amount, full close without                 |
| `peer-cash.topUp`        | Yes                | Add USDC to a live order at the same payee and market rate                      |

Amounts cross the action boundary as decimal USDC strings (`"25.50"`); results
are returned through the SDK's JSON codecs, so every action result is
serializable and safe to persist in working memory.

## Safety notes

- Non-custodial. Funds sit in the Peer escrow contract. Only the agent wallet
  can withdraw an unmatched deposit.
- The agent's wallet signs. `cashout`, `withdraw`, and `topUp` sign and submit
  Base transactions from the configured wallet. All three share one task queue
  so the wallet never signs concurrently, and none of them auto-retry.
- An estimate is not a locked quote. `peer-cash.estimate` reports the current
  oracle read; the binding rate resolves at the Chainlink oracle when a buyer
  fills, always with zero spread.
- Errors are data. Failures return
  `{ error: { code, message, retryable, remediation } }` so the agent can decide
  what to do next instead of crashing the run. Transaction-unknown states
  include recovery evidence; inspect before retrying anything that moves funds.
- The payee must be a real account on the payout platform. New Wise and PayPal
  payees require an identity attestation minted by Peer's TEE browser extension;
  such cash-outs fail with `PAYEE_VERIFICATION_REQUIRED` before any funds move.

## Earn the integration share

Pass the six-character referral code shown in your Peer mobile or web app:

```ts
createPeerCashExtension({ referralCode: "ABC123" });
```

Deposits created by the extension then carry the `peer-ref-ABC123` ERC-8021
marker. When that liquidity fills, the protocol pays the code owner a 50 bps
integration share, capped by the configured Peer service fee. The code-to-wallet
mapping is permanent. No registration, API key, or separate receiving address is
needed.

The `referrer` option is separate: it stamps analytics-only attribution codes
and never pays out.

## Links

- npm: <https://www.npmjs.com/package/@zkp2p/cash>
- Peer Cash: <https://peer.xyz/cash-sdk>
- SDK documentation: <https://docs.peer.xyz/developer/peer-cash>

## Support

Questions and integration help: the Peer Builders Club on Telegram at
<https://t.me/zk_p2p/167174>.
