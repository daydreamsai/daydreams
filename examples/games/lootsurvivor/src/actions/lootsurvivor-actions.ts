import {
    action,
    createActionCall,
    type Agent,
    type Context,
    type Action,
    type ActionCallContext,
    type ActionHandler,
    type ActionSchema,
} from "@daydreamsai/core";
import { StarknetChain } from "@daydreamsai/defai";
import { z } from "zod";
import { Game } from "../../game";
import { parseAdventurerState } from "../app/lib/utils/parseEvents";
import type { AdventurerState } from "../app/types/events";
import { GameData } from "../app/lib/data/GameData";
import type {
    LootSurvivorMemory,
    UpdateAdventurerStateResult,
} from "../types/lootsurvivor-types";

// Helper to convert StarkNet types to Zod schemas
const starknetTypeToZod = (type: string): z.ZodTypeAny => {
    if (type.includes("core::integer::u")) {
        return z.number().int().nonnegative();
    }
    if (type.includes("core::felt252")) {
        return z.string();
    }
    if (type.includes("core::starknet::contract_address::ContractAddress")) {
        return z.string();
    }
    if (type.includes("core::bool")) {
        return z.boolean();
    }
    if (type.startsWith("core::array::Array")) {
        const innerType = type.substring(type.indexOf("<") + 1, type.lastIndexOf(">"));
        return z.array(starknetTypeToZod(innerType));
    }
    if (type.startsWith("core::array::Span")) {
        const innerType = type.substring(type.indexOf("<") + 1, type.lastIndexOf(">"));
        return z.array(starknetTypeToZod(innerType));
    }
    // For complex structs, we can represent them as objects for now
    // A more robust solution might involve parsing the full ABI for struct definitions
    if (type.includes("::")) {
        return z.object({}).passthrough();
    }
    return z.any();
};

const contractAddress = process.env.LOOT_SURVIVOR_CONTRACT_ADDRESS!;

const iGameInterface = Game.find(
    (item: { type: string; name: string }) =>
        item.type === "interface" && item.name === "game::game::interfaces::IGame"
);

if (
    !iGameInterface ||
    !("items" in iGameInterface) ||
    !Array.isArray((iGameInterface as any).items)
) {
    throw new Error("Could not find IGame interface in ABI");
}

type AbiFunction = {
    type: string;
    name: string;
    inputs: { name: string; type: string }[];
    outputs: { type: string }[];
    state_mutability: "view" | "external";
};

export const lootSurvivorActions = (iGameInterface as any).items.map(
    (func: AbiFunction) => {
        const schemaObject = func.inputs.reduce(
            (acc: Record<string, z.ZodTypeAny>, input: { name: string; type: string }) => {
                acc[input.name] = starknetTypeToZod(input.type).describe(
                    `Type: ${input.type}`
                );
                return acc;
            },
            {}
        );

        const zodSchema = z.object(schemaObject);

        const handler: ActionHandler<typeof zodSchema, any, any, Agent> = async (
            args,
            ctx,
            agent
        ) => {
            const starknet = agent.container.resolve<StarknetChain>("starknet");

            const call = {
                contractAddress,
                entrypoint: func.name,
                calldata: Object.values(args),
            };

            try {
                if (func.state_mutability === "view") {
                    const result = await starknet.read(call);
                    return { success: true, result };
                } else {
                    const result = await starknet.write(call);
                    return { success: true, transaction_hash: result.transaction_hash };
                }
            } catch (error) {
                agent.logger.error(`lootSurvivor:${func.name}`, "Action failed", {
                    error,
                });
                return {
                    success: false,
                    error: error instanceof Error ? error.message : "Unknown error",
                };
            }
        };

        const actionConfig: Action<typeof zodSchema> = {
            name: `lootSurvivor:${func.name}`,
            description: `Calls the ${func.name} function on the Loot Survivor contract.`,
            schema: zodSchema,
            handler: handler as any,
        };

        return action(actionConfig);
    }
);

// New action to fetch and update adventurer state
const getAndUpdateAdventurerStateAction: Action<
    z.ZodObject<{ adventurerId: z.ZodString }>,
    UpdateAdventurerStateResult,
    any,
    any,
    Agent
> = action({
    name: "getAndUpdateAdventurerState",
    description:
        "Fetches the current adventurer state from the contract and updates the agent's memory.",
    schema: z.object({
        adventurerId: z.string().describe("The ID of the adventurer"),
    }),
    handler: async (
        { adventurerId },
        ctx: ActionCallContext<any, any, any, any>,
        agent: Agent
    ): Promise<UpdateAdventurerStateResult> => {
        // Find the loot survivor context definition from the agent's configuration
        const lootSurvivorCtxDef = Array.from(agent.registry.contexts.values()).find(
            (c: Context<any, any, any>) => c.type === "loot-survivor-agent"
        );

        if (!lootSurvivorCtxDef) {
            const errorMessage = "Loot survivor context definition not found on agent.";
            agent.logger.error("getAndUpdateAdventurerState", errorMessage);
            return { success: false, error: errorMessage };
        }

        // Get the state for the specific adventurer, this will create it if it doesn't exist
        const lootSurvivorState = await agent.getContext({
            context: lootSurvivorCtxDef,
            args: { adventurerId },
        });
        const memory = lootSurvivorState.memory as LootSurvivorMemory;

        try {
            const resultAction = await ctx.callAction(
                createActionCall({
                    name: "lootSurvivor:get_adventurer",
                    data: { adventurer_id: adventurerId },
                    content: `Get adventurer data for ${adventurerId}`,
                    processed: false,
                })
            );

            const result = resultAction.data;

            if (result.success && result.result) {
                const data = result.result.map((r: BigInt) => parseInt(r.toString()));

                const adventurerPart = {
                    health: data[0],
                    xp: data[1],
                    gold: data[2],
                    beastHealth: data[3],
                    statUpgradesAvailable: data[4],
                    stats: {
                        strength: data[5],
                        dexterity: data[6],
                        vitality: data[7],
                        intelligence: data[8],
                        wisdom: data[9],
                        charisma: data[10],
                        luck: data[11],
                    },
                    equipment: {
                        weapon: { id: data[12], xp: data[13] },
                        chest: { id: data[14], xp: data[15] },
                        head: { id: data[16], xp: data[17] },
                        waist: { id: data[18], xp: data[19] },
                        foot: { id: data[20], xp: data[21] },
                        hand: { id: data[22], xp: data[23] },
                        neck: { id: data[24], xp: data[25] },
                        ring: { id: data[26], xp: data[27] },
                    },
                    battleActionCount: data[28],
                    mutated: data[29] === 1,
                    awaitingItemSpecials: data[30] === 1,
                };

                // If memory.adventurer is null, we are initializing it.
                // Otherwise, we are updating it, preserving some top-level fields.
                const updatedAdventurerState: AdventurerState = memory.adventurer
                    ? { ...memory.adventurer, adventurer: adventurerPart }
                    : {
                        owner: '', // These will be placeholder until a proper 'start_game' event populates them
                        adventurerId: parseInt(adventurerId),
                        adventurerEntropy: '',
                        adventurer: adventurerPart
                    };

                memory.adventurer = updatedAdventurerState;
                memory.lastResult = `Fetched adventurer ${adventurerId} state.`;

                return { success: true, adventurer: updatedAdventurerState };
            } else {
                const errorMessage = `Failed to fetch adventurer ${adventurerId} state. Reason: ${result.error || "Unknown"
                    }`;
                memory.lastResult = errorMessage;
                return { success: false, error: errorMessage };
            }
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : "Unknown error";
            memory.lastResult = `An error occurred while fetching adventurer state: ${errorMessage}`;
            return { success: false, error: memory.lastResult };
        }
    },
});

lootSurvivorActions.push(getAndUpdateAdventurerStateAction);
