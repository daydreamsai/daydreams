import { describe, expect, it } from "vitest";
import {
  capabilitiesFromJson,
  cashoutResultFromJson,
  errors,
  estimateFromJson,
  fillStatsFromJson,
  orderFromJson,
  topUpResultFromJson,
  withdrawResultFromJson,
} from "@zkp2p/cash";
import type {
  CashClient,
  CashoutInput,
  CashoutOptions,
  EstimateInput,
  EstimateOptions,
  OrdersOptions,
  SignerOptions,
  WithdrawOptions,
} from "@zkp2p/cash";
import { createPeerCashExtension } from "../peer-cash";

/** Well-known local development key (anvil account 0). Never funded. */
const TEST_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const TEST_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

const USDC_TOKEN = {
  address: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
  symbol: "USDC" as const,
  decimals: 6,
};

const CAPABILITIES_JSON = {
  chainId: 8453,
  token: USDC_TOKEN,
  environment: "production" as const,
  destination: { chainId: 8453, token: USDC_TOKEN },
  source: { default: { chainId: 8453, token: USDC_TOKEN } },
  platforms: [
    {
      platform: "venmo",
      currencies: ["USD"],
      payeeHint: "Venmo username, e.g. @user",
      requiresIdentityAttestation: false,
      // Deprecated wire-compat field; always false.
      requiresAtomicAccessPolicy: false,
    },
    {
      platform: "revolut",
      currencies: ["EUR", "GBP", "USD"],
      payeeHint: "Revtag",
      requiresIdentityAttestation: false,
      requiresAtomicAccessPolicy: false,
    },
  ],
  currencies: ["USD", "EUR", "GBP"],
  amount: { min: "10000", recommendedMin: "10000000", max: null },
  pricing: { kind: "oracle-market-rate" as const, spreadBps: 0 as const },
};

const FILL_STATS_JSON = {
  "venmo:USD": { fills: 42, medianFillSeconds: 900 },
  "revolut:EUR+GBP+USD": { fills: 7 },
};

const ESTIMATE_JSON = {
  kind: "oracle-estimate" as const,
  currency: "EUR",
  amount: "1500000",
  rate: 0.92,
  receiveAmount: 1.38,
  asOf: 1723500000,
};

const ORDER_JSON = {
  depositId: "0x71e18f1b6a1c1a4dfa5c1728f5b70cf4a4d5c111_12",
  state: "awaiting-buyer" as const,
  fills: [],
  totalAmount: "25500000",
  filledAmount: "0",
  pendingAmount: "0",
  returnedAmount: "0",
  nextActions: ["wait", "withdraw"] as const,
  isInFlight: true,
};

const CASHOUT_RESULT_JSON = {
  depositId: ORDER_JSON.depositId,
  txHash: `0x${"ab".repeat(32)}`,
  escrowAddress: "0x71e18f1b6a1c1a4dfa5c1728f5b70cf4a4d5c111",
  onchainDepositId: "12",
  order: ORDER_JSON,
};

const WITHDRAW_RESULT_JSON = {
  depositId: ORDER_JSON.depositId,
  withdrawTxHash: `0x${"cd".repeat(32)}`,
};

const TOP_UP_RESULT_JSON = {
  depositId: ORDER_JSON.depositId,
  txHash: `0x${"ef".repeat(32)}`,
};

/** Builds a CashClient test double; every unexpected call throws. */
function mockClient(overrides: Partial<CashClient>): CashClient {
  return new Proxy(overrides, {
    get(target, property: string) {
      if (property in target) {
        return target[property as keyof typeof target];
      }
      return () => {
        throw new Error(`unexpected CashClient call: ${property}`);
      };
    },
  }) as CashClient;
}

type PeerCashExtension = ReturnType<typeof createPeerCashExtension>;

function getAction(ext: PeerCashExtension, name: string) {
  const found = ext.actions?.find((candidate) => candidate.name === name);
  if (!found) throw new Error(`missing action: ${name}`);
  return found;
}

async function callAction(
  ext: PeerCashExtension,
  name: string,
  args?: Record<string, unknown>
) {
  const handler = getAction(ext, name).handler as (
    ...handlerArgs: unknown[]
  ) => unknown;
  return await handler(args, {}, {});
}

describe("createPeerCashExtension", () => {
  it("exposes the peer-cash extension surface", () => {
    const ext = createPeerCashExtension({ client: mockClient({}) });

    expect(ext.name).toBe("peer-cash");
    expect(ext.actions?.map((action) => action.name)).toEqual([
      "peer-cash.capabilities",
      "peer-cash.fillStats",
      "peer-cash.estimate",
      "peer-cash.cashout",
      "peer-cash.order",
      "peer-cash.orders",
      "peer-cash.withdraw",
      "peer-cash.topUp",
    ]);
  });

  it("serializes every transaction-signing action on one queue", () => {
    const ext = createPeerCashExtension({ client: mockClient({}) });

    for (const name of [
      "peer-cash.cashout",
      "peer-cash.withdraw",
      "peer-cash.topUp",
    ]) {
      expect(getAction(ext, name).queueKey).toBe("peer-cash:transactions");
    }
    for (const name of [
      "peer-cash.capabilities",
      "peer-cash.fillStats",
      "peer-cash.estimate",
      "peer-cash.order",
      "peer-cash.orders",
    ]) {
      expect(getAction(ext, name).queueKey).toBeUndefined();
    }
  });

  it("rejects an unknown environment", () => {
    expect(() =>
      createPeerCashExtension({
        environment: "testnet" as never,
        client: mockClient({}),
      })
    ).toThrow(/invalid environment "testnet"/);
  });

  it("rejects a malformed referral code", () => {
    expect(() =>
      createPeerCashExtension({
        referralCode: "not-a-code",
        client: mockClient({}),
      })
    ).toThrow(/invalid referralCode/);
  });

  it("accepts a six-character referral code", () => {
    expect(() =>
      createPeerCashExtension({
        referralCode: "ABC123",
        client: mockClient({}),
      })
    ).not.toThrow();
  });

  it("rejects a malformed private key", () => {
    expect(() =>
      createPeerCashExtension({
        privateKey: "0x1234" as never,
        client: mockClient({}),
      })
    ).toThrow(/invalid privateKey/);
  });

  it("reads the agent wallet from PEER_CASH_PRIVATE_KEY", async () => {
    process.env.PEER_CASH_PRIVATE_KEY = TEST_PRIVATE_KEY;
    try {
      let seenOwner: string | undefined;
      const ext = createPeerCashExtension({
        client: mockClient({
          orders: async (owner) => {
            seenOwner = owner;
            return [orderFromJson(ORDER_JSON)];
          },
        }),
      });

      await callAction(ext, "peer-cash.orders", {});
      expect(seenOwner).toBe(TEST_ADDRESS);
    } finally {
      delete process.env.PEER_CASH_PRIVATE_KEY;
    }
  });
});

describe("peer-cash.capabilities", () => {
  it("returns the serialized capability catalog", async () => {
    const ext = createPeerCashExtension({
      client: mockClient({
        capabilities: (() =>
          capabilitiesFromJson(
            CAPABILITIES_JSON
          )) as CashClient["capabilities"],
      }),
    });

    const result = await callAction(ext, "peer-cash.capabilities");
    expect(result).toEqual({ capabilities: CAPABILITIES_JSON });
  });
});

describe("peer-cash.fillStats", () => {
  it("returns serialized 30-day pair stats", async () => {
    const ext = createPeerCashExtension({
      client: mockClient({
        fillStats: async () => fillStatsFromJson(FILL_STATS_JSON),
      }),
    });

    const result = await callAction(ext, "peer-cash.fillStats");
    expect(result).toEqual({ fillStats: FILL_STATS_JSON });
  });
});

describe("peer-cash.estimate", () => {
  it("converts the amount, uppercases the currency, and serializes", async () => {
    let seenInput: EstimateInput | undefined;
    let seenOptions: EstimateOptions | undefined;
    const ext = createPeerCashExtension({
      client: mockClient({
        estimate: async (input, options) => {
          seenInput = input;
          seenOptions = options;
          return estimateFromJson(ESTIMATE_JSON);
        },
      }),
    });

    const result = await callAction(ext, "peer-cash.estimate", {
      amountUsdc: "1.50",
      currency: "eur",
      platform: "revolut",
    });

    expect(seenInput?.amount).toBe(1_500_000n);
    expect(seenInput?.currency).toBe("EUR");
    expect(seenInput?.platform).toBe("revolut");
    expect(seenOptions).toEqual({ includeEta: true });
    expect(result).toEqual({ estimate: ESTIMATE_JSON });
  });

  it("passes includeEta false through", async () => {
    let seenOptions: EstimateOptions | undefined;
    const ext = createPeerCashExtension({
      client: mockClient({
        estimate: async (_input, options) => {
          seenOptions = options;
          return estimateFromJson(ESTIMATE_JSON);
        },
      }),
    });

    await callAction(ext, "peer-cash.estimate", {
      amountUsdc: "1000",
      currency: "USD",
      includeEta: false,
    });
    expect(seenOptions).toEqual({ includeEta: false });
  });

  it("maps a CashError to an agent-readable error result", async () => {
    const ext = createPeerCashExtension({
      client: mockClient({
        estimate: async () => {
          throw errors.oracleUnsupportedCurrency("XYZ");
        },
      }),
    });

    const result = (await callAction(ext, "peer-cash.estimate", {
      amountUsdc: "10",
      currency: "XYZ",
    })) as { error: { code: string; retryable: boolean; remediation: string } };

    expect(result.error.code).toBe("ORACLE_UNSUPPORTED_CURRENCY");
    expect(result.error.retryable).toBe(false);
    expect(result.error.remediation.length).toBeGreaterThan(0);
  });

  it("maps an unexpected error without leaking a throw", async () => {
    const ext = createPeerCashExtension({
      client: mockClient({
        estimate: async () => {
          throw new Error("socket hang up");
        },
      }),
    });

    const result = (await callAction(ext, "peer-cash.estimate", {
      amountUsdc: "10",
      currency: "USD",
    })) as { error: { code: string; message: string } };

    expect(result.error.code).toBe("UNEXPECTED_ERROR");
    expect(result.error.message).toBe("socket hang up");
  });
});

describe("peer-cash.cashout", () => {
  it("returns WALLET_NOT_CONFIGURED without a private key", async () => {
    const ext = createPeerCashExtension({ client: mockClient({}) });

    const result = (await callAction(ext, "peer-cash.cashout", {
      amountUsdc: "25.50",
      platform: "venmo",
      currency: "USD",
      payee: "@alice",
    })) as { error: { code: string; remediation: string } };

    expect(result.error.code).toBe("WALLET_NOT_CONFIGURED");
    expect(result.error.remediation).toContain("PEER_CASH_PRIVATE_KEY");
  });

  it("signs with the configured wallet and serializes the result", async () => {
    let seenInput: CashoutInput | undefined;
    let seenOptions: CashoutOptions | undefined;
    const ext = createPeerCashExtension({
      privateKey: TEST_PRIVATE_KEY,
      client: mockClient({
        cashout: async (input, options) => {
          seenInput = input;
          seenOptions = options;
          return cashoutResultFromJson(CASHOUT_RESULT_JSON);
        },
      }),
    });

    const result = (await callAction(ext, "peer-cash.cashout", {
      amountUsdc: "25.50",
      platform: "venmo",
      currency: "usd",
      payee: "@alice",
    })) as { result: typeof CASHOUT_RESULT_JSON; explain: string };

    expect(seenInput?.amount).toBe(25_500_000n);
    expect(seenInput?.receive).toEqual({
      platform: "venmo",
      currency: "USD",
      payee: "@alice",
    });
    expect(seenOptions?.signer.account?.address).toBe(TEST_ADDRESS);
    expect(result.result).toEqual(CASHOUT_RESULT_JSON);
    expect(result.explain.length).toBeGreaterThan(0);
  });

  it("maps a CashError from the cashout path", async () => {
    const ext = createPeerCashExtension({
      privateKey: TEST_PRIVATE_KEY,
      client: mockClient({
        cashout: async () => {
          throw errors.unsupportedPlatform("carrier-pigeon");
        },
      }),
    });

    const result = (await callAction(ext, "peer-cash.cashout", {
      amountUsdc: "25.50",
      platform: "carrier-pigeon",
      currency: "USD",
      payee: "@alice",
    })) as { error: { code: string } };

    expect(result.error.code).toBe("UNSUPPORTED_PLATFORM");
  });
});

describe("peer-cash.order", () => {
  it("returns live order state with an explanation", async () => {
    let seenDepositId: string | undefined;
    const ext = createPeerCashExtension({
      client: mockClient({
        order: async (depositId) => {
          seenDepositId = depositId;
          return orderFromJson(ORDER_JSON);
        },
      }),
    });

    const result = (await callAction(ext, "peer-cash.order", {
      depositId: ORDER_JSON.depositId,
    })) as { order: { state: string; explain: string } };

    expect(seenDepositId).toBe(ORDER_JSON.depositId);
    expect(result.order.state).toBe("awaiting-buyer");
    expect(result.order.explain.length).toBeGreaterThan(0);
  });
});

describe("peer-cash.orders", () => {
  it("defaults to the agent wallet and passes filters through", async () => {
    let seenOwner: string | undefined;
    let seenOptions: OrdersOptions | undefined;
    const ext = createPeerCashExtension({
      privateKey: TEST_PRIVATE_KEY,
      client: mockClient({
        orders: async (owner, options) => {
          seenOwner = owner;
          seenOptions = options;
          return [orderFromJson(ORDER_JSON)];
        },
      }),
    });

    const result = (await callAction(ext, "peer-cash.orders", {
      inFlight: true,
      limit: 25,
    })) as { owner: string; count: number; orders: { explain: string }[] };

    expect(seenOwner).toBe(TEST_ADDRESS);
    expect(seenOptions).toEqual({ inFlight: true, limit: 25 });
    expect(result.owner).toBe(TEST_ADDRESS);
    expect(result.count).toBe(1);
    expect(result.orders[0]?.explain.length).toBeGreaterThan(0);
  });

  it("accepts an explicit owner without a configured wallet", async () => {
    const owner = "0x71e18f1b6a1c1a4dfa5c1728f5b70cf4a4d5c111";
    let seenOwner: string | undefined;
    const ext = createPeerCashExtension({
      client: mockClient({
        orders: async (target) => {
          seenOwner = target;
          return [];
        },
      }),
    });

    const result = (await callAction(ext, "peer-cash.orders", {
      owner,
    })) as { count: number };

    expect(seenOwner).toBe(owner);
    expect(result.count).toBe(0);
  });

  it("returns WALLET_NOT_CONFIGURED with no wallet and no owner", async () => {
    const ext = createPeerCashExtension({ client: mockClient({}) });

    const result = (await callAction(ext, "peer-cash.orders", {})) as {
      error: { code: string };
    };
    expect(result.error.code).toBe("WALLET_NOT_CONFIGURED");
  });
});

describe("peer-cash.withdraw", () => {
  it("closes an order fully when no amount is given", async () => {
    let seenOptions: WithdrawOptions | undefined;
    const ext = createPeerCashExtension({
      privateKey: TEST_PRIVATE_KEY,
      client: mockClient({
        withdraw: async (_depositId, options) => {
          seenOptions = options;
          return withdrawResultFromJson(WITHDRAW_RESULT_JSON);
        },
      }),
    });

    const result = (await callAction(ext, "peer-cash.withdraw", {
      depositId: ORDER_JSON.depositId,
    })) as { result: typeof WITHDRAW_RESULT_JSON };

    expect(seenOptions?.amount).toBeUndefined();
    expect(seenOptions?.signer.account?.address).toBe(TEST_ADDRESS);
    expect(result.result).toEqual(WITHDRAW_RESULT_JSON);
  });

  it("withdraws a partial amount in USDC base units", async () => {
    let seenOptions: WithdrawOptions | undefined;
    const ext = createPeerCashExtension({
      privateKey: TEST_PRIVATE_KEY,
      client: mockClient({
        withdraw: async (_depositId, options) => {
          seenOptions = options;
          return withdrawResultFromJson(WITHDRAW_RESULT_JSON);
        },
      }),
    });

    await callAction(ext, "peer-cash.withdraw", {
      depositId: ORDER_JSON.depositId,
      amountUsdc: "5",
    });
    expect(seenOptions?.amount).toBe(5_000_000n);
  });

  it("returns WALLET_NOT_CONFIGURED without a private key", async () => {
    const ext = createPeerCashExtension({ client: mockClient({}) });

    const result = (await callAction(ext, "peer-cash.withdraw", {
      depositId: ORDER_JSON.depositId,
    })) as { error: { code: string } };
    expect(result.error.code).toBe("WALLET_NOT_CONFIGURED");
  });
});

describe("peer-cash.topUp", () => {
  it("adds USDC to a live order", async () => {
    let seenDepositId: string | undefined;
    let seenAmount: bigint | undefined;
    let seenOptions: SignerOptions | undefined;
    const ext = createPeerCashExtension({
      privateKey: TEST_PRIVATE_KEY,
      client: mockClient({
        topUp: async (depositId, amount, options) => {
          seenDepositId = depositId;
          seenAmount = amount;
          seenOptions = options;
          return topUpResultFromJson(TOP_UP_RESULT_JSON);
        },
      }),
    });

    const result = (await callAction(ext, "peer-cash.topUp", {
      depositId: ORDER_JSON.depositId,
      amountUsdc: "10",
    })) as { result: typeof TOP_UP_RESULT_JSON };

    expect(seenDepositId).toBe(ORDER_JSON.depositId);
    expect(seenAmount).toBe(10_000_000n);
    expect(seenOptions?.signer.account?.address).toBe(TEST_ADDRESS);
    expect(result.result).toEqual(TOP_UP_RESULT_JSON);
  });

  it("returns WALLET_NOT_CONFIGURED without a private key", async () => {
    const ext = createPeerCashExtension({ client: mockClient({}) });

    const result = (await callAction(ext, "peer-cash.topUp", {
      depositId: ORDER_JSON.depositId,
      amountUsdc: "10",
    })) as { error: { code: string } };
    expect(result.error.code).toBe("WALLET_NOT_CONFIGURED");
  });
});
