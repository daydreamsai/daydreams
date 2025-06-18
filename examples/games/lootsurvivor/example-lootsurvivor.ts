import {
    createDreams,
    context,
    createContainer,
    LogLevel,
    validateEnv,
    Logger,
    type AnyAgent,
    type Action,
    type Context,
    type Memory
} from "@daydreamsai/core";
import { StarknetChain } from "@daydreamsai/defai";
import { cliExtension } from "@daydreamsai/cli";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { z } from "zod";
import { lootSurvivorActions } from "./src/actions/lootsurvivor-actions";
import type { Adventurer } from "./src/app/types";
import type { LootSurvivorMemory } from "./src/types/lootsurvivor-types";
import { GameData } from "./src/app/lib/data/GameData";
import { calculateLevel } from "./src/app/lib/utils";

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
const lootSurvivorContext = context<LootSurvivorMemory>({
    type: "loot-survivor-agent",
    schema: z.object({
        adventurerId: z.string().describe("The ID of the adventurer to play as"),
    }),
    instructions: `You are an expert AI agent playing the Loot Survivor game on Starknet.
    Your goal is to survive as long as possible, level up, and get the best loot.
    Use the available actions to interact with the game contract.
    Analyze the game state and make strategic decisions.
    Your adventurer ID is: {{adventurerId}}`,
    render: ({ memory, args }) => {
        const gameData = new GameData();
        return `
Current Adventurer ID: ${args.adventurerId}
Health: ${memory.adventurer?.adventurer.health ?? 'N/A'}
XP: ${memory.adventurer?.adventurer.xp ?? 'N/A'}
Gold: ${memory.adventurer?.adventurer.gold ?? 'N/A'}
Level: ${memory.adventurer ? calculateLevel(memory.adventurer.adventurer.xp) : 'N/A'}
Strength: ${memory.adventurer?.adventurer.stats.strength ?? 'N/A'}
Dexterity: ${memory.adventurer?.adventurer.stats.dexterity ?? 'N/A'}
Vitality: ${memory.adventurer?.adventurer.stats.vitality ?? 'N/A'}
Intelligence: ${memory.adventurer?.adventurer.stats.intelligence ?? 'N/A'}
Wisdom: ${memory.adventurer?.adventurer.stats.wisdom ?? 'N/A'}
Charisma: ${memory.adventurer?.adventurer.stats.charisma ?? 'N/A'}
Luck: ${memory.adventurer?.adventurer.stats.luck ?? 'N/A'}
Weapon: ${memory.adventurer ? gameData.ITEMS[memory.adventurer.adventurer.equipment.weapon.id] : 'N/A'}
Chest: ${memory.adventurer ? gameData.ITEMS[memory.adventurer.adventurer.equipment.chest.id] : 'N/A'}
Head: ${memory.adventurer ? gameData.ITEMS[memory.adventurer.adventurer.equipment.head.id] : 'N/A'}
Waist: ${memory.adventurer ? gameData.ITEMS[memory.adventurer.adventurer.equipment.waist.id] : 'N/A'}
Foot: ${memory.adventurer ? gameData.ITEMS[memory.adventurer.adventurer.equipment.foot.id] : 'N/A'}
Hand: ${memory.adventurer ? gameData.ITEMS[memory.adventurer.adventurer.equipment.hand.id] : 'N/A'}
Neck: ${memory.adventurer ? gameData.ITEMS[memory.adventurer.adventurer.equipment.neck.id] : 'N/A'}
Ring: ${memory.adventurer ? gameData.ITEMS[memory.adventurer.adventurer.equipment.ring.id] : 'N/A'}
Beast Health: ${memory.adventurer?.adventurer.beastHealth ?? 'N/A'}
Stat Upgrades Available: ${memory.adventurer?.adventurer.statUpgradesAvailable ?? 'N/A'}
Last Action Result: ${memory.lastResult || "N/A"}
    `},
    create: () => ({
        lastResult: null,
        adventurer: null,
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
    console.log("Example: 'getAndUpdateAdventurerState { \"adventurerId\": \"123\" }'");

    // Run the context in a loop to keep the CLI interactive
    await agent.run({
        context: lootSurvivorContext,
        args: { adventurerId: "" }, // Initial adventurerId, can be updated by action
    });
}

main(); 