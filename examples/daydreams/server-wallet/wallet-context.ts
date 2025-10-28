import { context, action } from "@daydreamsai/core";
import { CdpClient } from "@coinbase/cdp-sdk";
import { parseEther, formatEther, createPublicClient, http } from "viem";
import { baseSepolia, base, mainnet, polygon } from "viem/chains";
import * as z from "zod";

interface WalletMemory {
  accountAddress: string | null;
  accountName: string | null;
  network: string;
  createdAt: number | null;
  transactions: Array<{
    hash: string;
    to: string;
    value: string;
    status: "pending" | "confirmed" | "failed";
    timestamp: number;
    type: "send" | "receive" | "faucet";
  }>;
  lastBalanceCheck: number | null;
  cachedBalance: {
    eth: string;
    usdc?: string;
  } | null;
  totalTransactionsSent: number;
  totalTransactionsReceived: number;
  totalGasSpent: string;
}

const SUPPORTED_NETWORKS = {
  "base-sepolia": {
    chain: baseSepolia,
    faucetSupported: true,
    explorerUrl: "https://sepolia.basescan.org",
  },
  base: {
    chain: base,
    faucetSupported: false,
    explorerUrl: "https://basescan.org",
  },
  ethereum: {
    chain: mainnet,
    faucetSupported: false,
    explorerUrl: "https://etherscan.io",
  },
  polygon: {
    chain: polygon,
    faucetSupported: false,
    explorerUrl: "https://polygonscan.com",
  },
} as const;

type SupportedNetwork = keyof typeof SUPPORTED_NETWORKS;

export const walletContext = context({
  type: "coinbase-wallet",
  schema: z.object({
    userId: z.string().describe("User who owns this wallet"),
    network: z
      .enum(["base-sepolia", "base", "ethereum", "polygon"])
      .optional()
      .default("base-sepolia")
      .describe("Network to use for the wallet"),
  }),

  create: (): WalletMemory => ({
    accountAddress: null,
    accountName: null,
    network: "base-sepolia",
    createdAt: null,
    transactions: [],
    lastBalanceCheck: null,
    cachedBalance: null,
    totalTransactionsSent: 0,
    totalTransactionsReceived: 0,
    totalGasSpent: "0",
  }),

  render: (state) => {
    const { accountAddress, network, transactions, cachedBalance } =
      state.memory;

    if (!accountAddress) {
      return `
Wallet Status: Not created
User: ${state.args.userId}
Network: ${state.args.network || "base-sepolia"}
Use 'create-wallet' action to create a new wallet.
      `.trim();
    }

    return `
Coinbase Wallet for User: ${state.args.userId}
Address: ${accountAddress}
Network: ${network}
${
  cachedBalance
    ? `Balance: ${cachedBalance.eth} ETH${
        cachedBalance.usdc ? `, ${cachedBalance.usdc} USDC` : ""
      }`
    : "Balance: Not checked"
}
Transactions: ${transactions.length} total (${
      state.memory.totalTransactionsSent
    } sent, ${state.memory.totalTransactionsReceived} received)
${
  transactions.length > 0
    ? `Last transaction: ${transactions[0].type} - ${
        transactions[0].value
      } ETH to ${transactions[0].to.slice(0, 6)}...${transactions[0].to.slice(
        -4
      )}`
    : ""
}
    `.trim();
  },

  instructions: `You are a helpful assistant with Coinbase wallet capabilities. You can:
- Create new wallets for users using create-wallet
- Check wallet balances using check-balance
- Send transactions using send-transaction
- Request testnet funds using request-faucet (only on test networks)
- Show transaction history using get-transaction-history

Always be careful with transactions and confirm details with the user before sending.
For testnet, you can freely request funds from the faucet for testing.
Format addresses and amounts clearly for the user.`,

  setup: async (args) => {
    if (!process.env.CDP_API_KEY_ID || !process.env.CDP_API_KEY_SECRET) {
      console.warn("CDP API credentials not found in environment variables");
      console.warn("Please set CDP_API_KEY_ID and CDP_API_KEY_SECRET");
    }

    return {
      network: args.network || "base-sepolia",
      setupTime: Date.now(),
    };
  },
}).setActions([
  action({
    name: "create-wallet",
    description: "Create a new Coinbase wallet for the user",
    schema: z.object({
      name: z
        .string()
        .optional()
        .describe(
          "Optional name for the wallet. Must be a valid name with alphanumeric characters and hyphens, between 2 and 36 characters long (e.g., my-account-name"
        ),
    }),
    handler: async ({ name }, ctx) => {
      try {
        if (ctx.memory.accountAddress) {
          return {
            success: false,
            message: `Wallet already exists: ${ctx.memory.accountAddress}`,
            address: ctx.memory.accountAddress,
          };
        }

        const cdp = new CdpClient();

        const account = await cdp.evm.createAccount({
          name: name || `wallet-${ctx.args.userId}`,
        });

        ctx.memory.accountAddress = account.address;
        ctx.memory.accountName = account.name || null;
        ctx.memory.network = ctx.args.network || "base-sepolia";
        ctx.memory.createdAt = Date.now();

        const networkConfig =
          SUPPORTED_NETWORKS[ctx.memory.network as SupportedNetwork];
        const explorerUrl = `${networkConfig.explorerUrl}/address/${account.address}`;

        return {
          success: true,
          address: account.address,
          name: account.name,
          network: ctx.memory.network,
          message: `Successfully created wallet: ${account.address}`,
          explorerUrl,
        };
      } catch (error: any) {
        console.error("Failed to create wallet:", error);
        return {
          success: false,
          error: error.message,
          message: "Failed to create wallet. Please check CDP credentials.",
        };
      }
    },
  }),

  action({
    name: "check-balance",
    description: "Check the current balance of the wallet",
    schema: z.object({
      forceRefresh: z
        .boolean()
        .optional()
        .default(false)
        .describe("Force refresh balance even if recently checked"),
    }),
    handler: async ({ forceRefresh }, ctx) => {
      try {
        if (!ctx.memory.accountAddress) {
          return {
            success: false,
            message: "No wallet created yet. Use create-wallet first.",
          };
        }

        const cacheExpiry = 30 * 1000;
        if (
          !forceRefresh &&
          ctx.memory.lastBalanceCheck &&
          ctx.memory.cachedBalance &&
          Date.now() - ctx.memory.lastBalanceCheck < cacheExpiry
        ) {
          return {
            success: true,
            balance: ctx.memory.cachedBalance,
            cached: true,
            message: `Balance (cached): ${ctx.memory.cachedBalance.eth} ETH`,
          };
        }

        const networkConfig =
          SUPPORTED_NETWORKS[ctx.memory.network as SupportedNetwork];
        const publicClient = createPublicClient({
          chain: networkConfig.chain,
          transport: http(),
        });

        const balance = await publicClient.getBalance({
          address: ctx.memory.accountAddress as `0x${string}`,
        });

        const ethBalance = formatEther(balance);

        ctx.memory.cachedBalance = {
          eth: ethBalance,
        };
        ctx.memory.lastBalanceCheck = Date.now();

        return {
          success: true,
          balance: {
            eth: ethBalance,
            wei: balance.toString(),
          },
          address: ctx.memory.accountAddress,
          network: ctx.memory.network,
          message: `Current balance: ${ethBalance} ETH`,
        };
      } catch (error: any) {
        console.error("Failed to check balance:", error);
        return {
          success: false,
          error: error.message,
          message: "Failed to check balance.",
        };
      }
    },
  }),

  action({
    name: "send-transaction",
    description: "Send ETH to another address",
    schema: z.object({
      to: z.string().describe("Recipient address"),
      amount: z.string().describe("Amount in ETH to send"),
      confirmBeforeSending: z
        .boolean()
        .optional()
        .default(true)
        .describe("Whether to return details for confirmation before sending"),
    }),
    handler: async ({ to, amount, confirmBeforeSending }, ctx) => {
      try {
        if (!ctx.memory.accountAddress) {
          return {
            success: false,
            message: "No wallet created yet. Use create-wallet first.",
          };
        }

        if (!to.match(/^0x[a-fA-F0-9]{40}$/)) {
          return {
            success: false,
            message: "Invalid recipient address format.",
          };
        }

        const amountWei = parseEther(amount);

        if (confirmBeforeSending) {
          return {
            success: true,
            requiresConfirmation: true,
            details: {
              from: ctx.memory.accountAddress,
              to,
              amount: amount + " ETH",
              amountWei: amountWei.toString(),
              network: ctx.memory.network,
            },
            message: `Ready to send ${amount} ETH to ${to}. Please confirm to proceed.`,
          };
        }

        const cdp = new CdpClient();

        const result = await cdp.evm.sendTransaction({
          address: ctx.memory.accountAddress as `0x${string}`,
          transaction: {
            to: to as `0x${string}`,
            value: amountWei,
          },
          network: ctx.memory.network as any,
        });

        ctx.memory.transactions.unshift({
          hash: result.transactionHash,
          to,
          value: amount,
          status: "pending",
          timestamp: Date.now(),
          type: "send",
        });
        ctx.memory.totalTransactionsSent++;

        const networkConfig =
          SUPPORTED_NETWORKS[ctx.memory.network as SupportedNetwork];
        const explorerUrl = `${networkConfig.explorerUrl}/tx/${result.transactionHash}`;

        return {
          success: true,
          transactionHash: result.transactionHash,
          from: ctx.memory.accountAddress,
          to,
          amount,
          network: ctx.memory.network,
          explorerUrl,
          message: `Successfully sent ${amount} ETH to ${to}`,
        };
      } catch (error: any) {
        console.error("Failed to send transaction:", error);
        return {
          success: false,
          error: error.message,
          message: "Failed to send transaction.",
        };
      }
    },
  }),

  action({
    name: "request-faucet",
    description: "Request testnet ETH from faucet (testnet only)",
    schema: z.object({
      token: z
        .enum(["eth", "usdc"])
        .optional()
        .default("eth")
        .describe("Token to request from faucet"),
    }),
    handler: async ({ token }, ctx) => {
      try {
        if (!ctx.memory.accountAddress) {
          return {
            success: false,
            message: "No wallet created yet. Use create-wallet first.",
          };
        }

        const networkConfig =
          SUPPORTED_NETWORKS[ctx.memory.network as SupportedNetwork];
        if (!networkConfig.faucetSupported) {
          return {
            success: false,
            message: `Faucet not available on ${ctx.memory.network}. Only available on testnet.`,
          };
        }

        const cdp = new CdpClient();

        const { transactionHash } = await cdp.evm.requestFaucet({
          address: ctx.memory.accountAddress,
          network: ctx.memory.network as any,
          token,
        });

        ctx.memory.transactions.unshift({
          hash: transactionHash,
          to: ctx.memory.accountAddress,
          value: token === "eth" ? "0.01" : "10",
          status: "pending",
          timestamp: Date.now(),
          type: "faucet",
        });
        ctx.memory.totalTransactionsReceived++;

        const explorerUrl = `${networkConfig.explorerUrl}/tx/${transactionHash}`;

        return {
          success: true,
          transactionHash,
          address: ctx.memory.accountAddress,
          token,
          network: ctx.memory.network,
          explorerUrl,
          message: `Successfully requested ${token.toUpperCase()} from faucet. Transaction: ${transactionHash}`,
        };
      } catch (error: any) {
        console.error("Failed to request faucet:", error);
        return {
          success: false,
          error: error.message,
          message: "Failed to request faucet funds.",
        };
      }
    },
  }),

  action({
    name: "get-transaction-history",
    description: "Get the transaction history for this wallet",
    schema: z.object({
      limit: z
        .number()
        .optional()
        .default(10)
        .describe("Maximum number of transactions to return"),
      type: z
        .enum(["all", "send", "receive", "faucet"])
        .optional()
        .default("all")
        .describe("Filter by transaction type"),
    }),
    handler: async ({ limit, type }, ctx) => {
      if (!ctx.memory.accountAddress) {
        return {
          success: false,
          message: "No wallet created yet. Use create-wallet first.",
        };
      }

      let transactions = ctx.memory.transactions;

      if (type !== "all") {
        transactions = transactions.filter((tx) => tx.type === type);
      }

      transactions = transactions.slice(0, limit);

      return {
        success: true,
        address: ctx.memory.accountAddress,
        network: ctx.memory.network,
        transactions,
        totalCount: ctx.memory.transactions.length,
        stats: {
          totalSent: ctx.memory.totalTransactionsSent,
          totalReceived: ctx.memory.totalTransactionsReceived,
          totalGasSpent: ctx.memory.totalGasSpent,
        },
        message: `Found ${transactions.length} transactions${
          type !== "all" ? ` of type '${type}'` : ""
        }.`,
      };
    },
  }),
]);
