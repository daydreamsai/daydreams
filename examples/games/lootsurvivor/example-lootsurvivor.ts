import {
    createDreams,
    context,
    createContainer,
    LogLevel,
    validateEnv,
    Logger,
} from "@daydreamsai/core";
import { StarknetChain } from "@daydreamsai/defai";
import { cliExtension } from "@daydreamsai/cli";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { z } from "zod";
import { lootSurvivorActions } from "./src/actions/lootsurvivor-actions";

// 1. Validate environment variables
validateEnv(
    z.object({
        STARKNET_RPC_URL: z.string().min(1),
        STARKNET_ADDRESS: z.string().min(1),
        STARKNET_PRIVATE_KEY: z.string().min(1),
        LOOT_SURVIVOR_CONTRACT_ADDRESS: z.string().min(1),
        OPENROUTER_API_KEY: z.string().min(1),
    })
);

// 2. Create and configure the DI container
const container = createContainer();
container.singleton("starknet", () => new StarknetChain({
    rpcUrl: process.env.STARKNET_RPC_URL!,
    address: process.env.STARKNET_ADDRESS!,
    privateKey: process.env.STARKNET_PRIVATE_KEY!,
}));


// 3. Define the game context
const lootSurvivorContext = context({
    type: "loot-survivor-agent",
    schema: z.object({
        adventurerId: z.string().describe("The ID of the adventurer to play as"),
    }),
    instructions: `You are an expert AI agent playing the Loot Survivor game on Starknet.
    Your goal is to survive as long as possible, level up, and get the best loot.
    Use the available actions to interact with the game contract.
    Analyze the game state and make strategic decisions.
    Your adventurer ID is: {{adventurerId}}`,
    render: ({ memory, args }) => `
Current Adventurer ID: ${args.adventurerId}
Last Action Result: ${memory.lastResult || "N/A"}
    `,
    create: () => ({
        lastResult: null as any,
    }),
});


// 4. Create the agent
const agent = createDreams({
    model: openrouter("google/gemini-2.0-flash-001"),
    logger: new Logger({ level: LogLevel.DEBUG }),
    extensions: [cliExtension],
    actions: lootSurvivorActions,
    contexts: [lootSurvivorContext],
    container,
});

// 5. Start the agent
async function main() {
    await agent.start();
    console.log("Loot Survivor Agent started.");
    console.log("You can now issue commands to the agent via the CLI.");
    console.log("Example: 'get the adventurer state for adventurer 123'");

    // To start a game run, you would typically run the context
    // For this example, we'll let the user interact via the CLI
    // which is handled by the cliExtension.
}

main(); 