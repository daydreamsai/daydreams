# x402 Research Buyer

The buyer-side companion to the [nanoservice](../nanoservice) example in this
directory. The nanoservice shows a Daydreams agent **charging** for requests
over x402; this example shows a Daydreams agent **paying** for generic web
utilities mid-task — the side of the protocol the nanoservice leaves out.

The agent's research context buys two utilities from
[StallRow](https://stall-row-production.up.railway.app), a live pay-per-call
service, with no API key, account, or subscription. Payment is the auth:

- **`check-page-metadata`** — `POST /v1/page-metadata`, **$0.005 USDC**. One
  page's declared metadata: title, description, canonical URL, OpenGraph/Twitter
  card fields, language, favicon, the h1/h2 heading outline, and word count. The
  cheap head-read before deciding whether the full page is worth fetching.
- **`get-video-transcript`** — `POST /v1/video-transcript`, **$0.01 USDC**. One
  YouTube video's caption text with timed segments, in the language you ask for.
  Use it to learn what a video says before citing or summarizing it.

> **Disclosure:** this example's author operates StallRow. The service is a
> real, live endpoint listed in the CDP Bazaar; the tool is first-party in the
> same way the Apify/Firecrawl-style service tools in other frameworks are
> first-party. The prices, spend caps, and failure behaviour described here are
> enforced in `stallrow.ts`, in the open.

## The spend contract

An agent that signs payments needs its guardrails in code, not in a prompt.
`StallRowBuyer` enforces all of these _before_ anything is signed:

- **Per-call cap** — the challenge's asset must be USDC on Base (`eip155:8453`)
  and its amount at or under the route's known price. A `PaymentPolicy` on the
  x402 client filters every other challenge out before selection, and the SDK's
  own spend controls cap the payment a second time.
- **Validity-window ceiling (300s)** — the EVM signing scheme builds the
  EIP-3009 `validBefore` from the challenge's `maxTimeoutSeconds` internally,
  with no parameter to cap it. The ceiling is therefore enforced with an
  `onBeforePaymentCreation` hook that aborts before the payload (and its
  signature) is created when a challenge asks for a longer window — a hostile
  endpoint cannot mint an authorization that stays settleable for months and
  keep it after a failed response.
- **Per-task cap** — settled spend is tracked across calls
  (`STALLROW_MAX_TASK_USDC`, default **$0.05**). Once the next call would exceed
  the cap it is refused before any request is made.
- **Fail closed** — with no wallet configured, every action returns a clear
  error naming the price it _would_ have paid, and pays nothing.
- The wallet key comes from the environment only and is never logged; the agent
  prints the payer **address** at startup, never the key.

## Why `@x402/fetch`, not the nanoservice's `x402-fetch`

StallRow speaks **x402 v2 only**: its challenge is a v2 `PaymentRequired`
(CAIP-2 network `eip155:8453`, `amount` field) carried in the `payment-required`
header, and payment is presented in the `payment-signature` header. The
`x402-fetch` package the nanoservice client uses is the v1 client — it parses
the v1 challenge shape and answers with the v1 `x-payment` header, so it cannot
pay a v2-only endpoint. This example uses the current official TypeScript stack
— `@x402/fetch` + `@x402/evm` (the v2 successor packages) — with the same
structure and conventions as the nanoservice client.

## Setup

1. Install dependencies (from the repo root):

```bash
bun install
```

2. Create a `.env` file (see `.env.example`):

```env
# Payer wallet for x402 payments (Base mainnet, holding a little USDC).
# Without it the agent runs but its research actions fail closed.
STALLROW_WALLET_PRIVATE_KEY=0x...

# Optional: per-task spend cap in USDC (default 0.05)
STALLROW_MAX_TASK_USDC=0.05

# Model provider key for the agent itself
OPENAI_API_KEY=...
```

3. Run the agent:

```bash
bun run agent.ts my-research-task
```

Then ask it to research a topic involving a web page or a YouTube video; watch
it buy the metadata/transcript checks inside its task budget.

## Programmatic use

The buyer is a standalone class, usable without the agent:

```typescript
import { StallRowBuyer } from "./stallrow";

const buyer = StallRowBuyer.fromEnv();
const metadata = await buyer.pageMetadata("https://www.x402.org/");
const transcript = await buyer.videoTranscript("dQw4w9WgXcQ", "en");
console.log(buyer.tracker.spentUnits); // settled spend, USDC base units
```

## Tests

Offline tests fake the HTTP layer at the fetch seam and sign locally with a
public Hardhat test account — no network, no real funds:

```bash
bun test
```

They cover the paid happy path (including the signed authorization's fields and
its ≤300s validity window) and every refusal: no wallet, over-price challenge,
non-USDC asset, excessive validity window, and the per-task spend cap.

## Files

- `agent.ts` — the Daydreams research agent: context, the two buying actions,
  memory of what was checked and spent.
- `stallrow.ts` — the guarded x402 buyer (spend contract above).
- `stallrow.test.ts` — offline tests for the buyer.
