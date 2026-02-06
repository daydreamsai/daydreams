import { CallData, hash } from "starknet";

export const HUGINN_REGISTRY_ADDRESS = "0x123..."; // To be updated after deployment

export interface AgentProfile {
    name: string;
    metadata_url: string;
}

/**
 * Project Huginn: Starknet Integration for Daydreams
 */
export const Huginn = {
    /**
     * Format call to register an agent
     */
    registerAgent: (name: string, metadataUrl: string) => {
        return {
            contractAddress: HUGINN_REGISTRY_ADDRESS,
            entrypoint: "register_agent",
            calldata: CallData.compile({
                name,
                metadata_url: metadataUrl,
            }),
        };
    },

    /**
     * Format call to log a thought (Raven's Flight)
     */
    logThought: (thoughtText: string) => {
        // Hash the thought text to u256
        const thoughtHash = hash.starknetKeccak(thoughtText);

        return {
            contractAddress: HUGINN_REGISTRY_ADDRESS,
            entrypoint: "log_thought",
            calldata: CallData.compile({
                thought_hash: thoughtHash,
            }),
        };
    }
};
