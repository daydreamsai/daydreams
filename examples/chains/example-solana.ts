/**
 * Example demonstrating Solana interactions using the Daydreams package
 */

import { openrouter } from "@openrouter/ai-sdk-provider";
import { createDreams, context, action, validateEnv, extension, input } from "@daydreamsai/core";
import { z } from "zod";
import chalk from "chalk";
import { SolanaChain } from "@daydreamsai/defai";
import {
    PublicKey,
    SystemProgram,
    LAMPORTS_PER_SOL,
    Keypair
} from "@solana/web3.js";
import bs58 from "bs58";

// Validate environment variables
const env = validateEnv(
    z.object({
        OPENROUTER_API_KEY: z.string().min(1, "OPENROUTER_API_KEY is required"),
        SOLANA_RPC_URL: z.string().min(1, "SOLANA_RPC_URL is required"),
        SOLANA_PRIVATE_KEY: z.string().min(1, "SOLANA_PRIVATE_KEY is required")
            .refine((key) => {
                try {
                    // Validate it's a valid base58 string and correct length for Solana private key
                    const decoded = bs58.decode(key);
                    return decoded.length === 64; // Solana private keys are 64 bytes
                } catch {
                    return false;
                }
            }, "SOLANA_PRIVATE_KEY must be a valid base58-encoded 64-byte private key"),
    })
);

// Initialize Solana Chain
const solanaChain = new SolanaChain({
    chainName: "solana-devnet", // or "solana-mainnet"
    rpcUrl: env.SOLANA_RPC_URL,
    privateKey: env.SOLANA_PRIVATE_KEY,
});

// Define memory type
type SolanaMemory = {
    wallet: string;
    transactions: string[];
    lastTransaction: string | null;
    balance: number;
};

// Define context template
const template = ({ wallet, lastTransaction, transactions, balance }: SolanaMemory) => `You are an the daydreamsAI agent solana trader/assistant. Do not include xml tags in side your instructed output format.
Wallet: ${wallet}
Balance: ${balance / LAMPORTS_PER_SOL} SOL
Last Transaction: ${lastTransaction ?? "NONE"}
Transaction History:
${transactions.join("\n")}

RPC Provider: Helius (High-performance Solana RPC with full archival data)
Note: If you encounter "Failed to query long-term storage" errors, it may be due to rate limiting. Wait a moment and try again. If persistent, respect the API. 

IMPORTANT: When responding with action results, include the actual data in your response, not template references like {{calls[0].data}}. You're meant to be actionable and helpful, not just a data tool. If the user's request requires multiple actions, take them. You have agency.
`;

// Create context
const solanaContext = context({
    type: "solana",
    schema: {
        wallet: z.string(),
    },
    key: ({ wallet }) => wallet,
    create({ args }): SolanaMemory {
        return {
            wallet: args.wallet,
            transactions: [],
            lastTransaction: null,
            balance: 0,
        };
    },
    render({ memory }) {
        return template(memory);
    },
}).setOutputs({
    message: {
        schema: z.string().describe("The message to send to the user"),
    },
}).setActions([
    action({
        name: "solana.getBalance",
        description: "Get the SOL balance of a wallet address",
        schema: {
            address: z.string().describe("The Solana wallet address to check balance for"),
        },
        async handler({ address }, { memory }) {
            const balance = await solanaChain.read({
                type: "getBalance",
                address,
            });

            if (balance instanceof Error) {
                return actionResponse(`Error getting balance: ${balance.message}`);
            }

            const solBalance = balance / LAMPORTS_PER_SOL;

            // Update memory if checking own wallet
            if (address === memory.wallet) {
                memory.balance = balance;
            }

            return actionResponse(`Balance for ${address}: ${solBalance} SOL (${balance} lamports)`);
        },
    }),
    action({
        name: "solana.transfer",
        description: "Transfer SOL from your wallet to another address",
        schema: {
            recipient: z.string().describe("The recipient's Solana wallet address"),
            amount: z.number().describe("Amount of SOL to transfer (not lamports)"),
        },
        async handler({ recipient, amount }, { memory }) {
            try {
                const fromPubkey = new PublicKey(memory.wallet);
                const toPubkey = new PublicKey(recipient);
                const lamports = Math.floor(amount * LAMPORTS_PER_SOL);

                // Create transfer instruction
                const transferInstruction = SystemProgram.transfer({
                    fromPubkey,
                    toPubkey,
                    lamports,
                });

                // Send transaction
                const txSignature = await solanaChain.write({
                    instructions: [transferInstruction],
                    signers: [],
                });

                if (txSignature instanceof Error) {
                    return actionResponse(`Error sending transaction: ${txSignature.message}`);
                }

                const txInfo = `Transferred ${amount} SOL to ${recipient}. Signature: ${txSignature}`;
                memory.lastTransaction = txInfo;
                memory.transactions.push(txInfo);

                // Update balance
                const newBalance = await solanaChain.read({
                    type: "getBalance",
                    address: memory.wallet,
                });
                if (!(newBalance instanceof Error)) {
                    memory.balance = newBalance;
                }

                return actionResponse(txInfo);
            } catch (error) {
                return actionResponse(`Error: ${error instanceof Error ? error.message : String(error)}`);
            }
        },
    }),
    action({
        name: "solana.getBlockHeight",
        description: "Get the current block height of the Solana blockchain",
        schema: {},
        async handler(_, { memory }) {
            const blockHeight = await solanaChain.read({
                type: "getBlockHeight",
            });

            if (blockHeight instanceof Error) {
                return actionResponse(`Error getting block height: ${blockHeight.message}`);
            }

            return actionResponse(`Current Solana block height: ${blockHeight}`);
        },
    }),
]);

// Create a custom extension that combines CLI with Solana context
const solanaExtension = extension({
    name: "solana-cli",
    contexts: {
        solana: solanaContext,
    },
    inputs: {
        cli: input({
            schema: z.object({
                text: z.string(),
            }),
            subscribe(send, agent) {
                const readline = require("readline");
                const rl = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout,
                });

                const prompt = () => {
                    rl.question("> ", async (text: string) => {
                        if (text.trim()) {
                            console.log(`User: ${text}`);
                            const logs = await agent.send({
                                context: solanaContext,
                                args: { wallet: walletAddress },
                                input: { type: "cli", data: { text } },
                                handlers: {
                                    onLogStream(log, done) {
                                        if (done) {
                                            if (log.ref === "output") {
                                                // Extract content from XML-formatted output
                                                const content = log.content || log.data;

                                                // Skip schema definitions
                                                if (content && !content.includes('attributes_schema')) {
                                                    console.log(chalk.green(`Assistant: ${content}`));
                                                }
                                            } else if (log.ref === "thought") {
                                                // Optionally show thinking
                                                // console.log(chalk.gray(`Thinking: ${log.content}`));
                                            }
                                        }
                                    },
                                    onThinking(thought) {
                                        // Optionally show thinking process
                                        // console.log(chalk.gray(`Thinking: ${thought.content}`));
                                    }
                                }
                            });
                        }
                        prompt();
                    });
                };

                console.log(chalk.cyan("\nType your message and press Enter to send it to the agent.\n"));
                prompt();

                return () => {
                    rl.close();
                };
            },
        }),
    },
    actions: [],
});

// Create Dreams instance
const dreams = createDreams({
    model: openrouter("google/gemini-2.0-flash-001"),
    extensions: [solanaExtension],
});

// Get the wallet address from the private key with proper error handling
let keypair: Keypair;
let walletAddress: string;

try {
    keypair = Keypair.fromSecretKey(Buffer.from(bs58.decode(env.SOLANA_PRIVATE_KEY)));
    walletAddress = keypair.publicKey.toBase58();
} catch (error) {
    console.error(chalk.red("❌ Failed to load wallet from private key:"), error);
    process.exit(1);
}

// Helper function to ensure consistent action responses
const actionResponse = (message: string) => ({ data: message, content: message });

// Start the Dreams instance
await dreams.start();

console.log(chalk.green("✅ Solana Dreams agent started!"));
console.log(chalk.blue(`Wallet: ${walletAddress}`));
console.log(chalk.yellow("\nAvailable commands:"));
console.log("  - Check balance: 'What is my SOL balance?'");
console.log("  - Transfer SOL: 'Send 0.1 SOL to <address>'");
console.log("  - Get block height: 'What is the current block height?'");

// Handle graceful shutdown
process.on("SIGINT", async () => {
    console.log(chalk.yellow("\n\nShutting down..."));
    await dreams.stop();
    console.log(chalk.green("✅ Shutdown complete"));
    process.exit(0);
}); 