import {
    action,
    type AnyAgent,
    type Action,
    type ActionCallContext,
    type ActionHandler,
    type ActionSchema,
} from "@daydreamsai/core";
import { StarknetChain } from "@daydreamsai/defai";
import { z } from "zod";
import { Game } from "../../game";

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

        const handler: ActionHandler<typeof zodSchema, any, any, AnyAgent> = async (
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
