import { CallData, hash, num } from "starknet";

export const HUGINN_REGISTRY_ADDRESS = "0x123..."; // To be updated after deployment

// x402 Configuration
export const X402_CONFIG = {
    serviceId: "huginn-thought-logging",
    pricePerThought: "0.0001", // USDC
    paymentToken: "0x...", // USDC address on Starknet
};

export interface AgentProfile {
    name: string;
    metadata_url: string;
}

export interface X402Invoice {
    service: string;
    amount: string;
    token: string;
    recipient: string;
}

/**
 * Project Huginn: Starknet Integration for Daydreams
 * Now with x402 micropayment support
 */
export const Huginn = {
    /**
     * Format call to register an agent (FREE)
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
     * Format call to log a thought (PAID via x402)
     * Returns both the Starknet call AND x402 invoice
     */
    logThought: (thoughtText: string) => {
        const thoughtHash = hash.starknetKeccak(thoughtText);

        return {
            starknetCall: {
                contractAddress: HUGINN_REGISTRY_ADDRESS,
                entrypoint: "log_thought",
                calldata: CallData.compile({
                    thought_hash: thoughtHash,
                }),
            },
            x402Invoice: {
                service: X402_CONFIG.serviceId,
                amount: X402_CONFIG.pricePerThought,
                token: X402_CONFIG.paymentToken,
                recipient: HUGINN_REGISTRY_ADDRESS,
                metadata: {
                    thoughtHash: num.toHex(thoughtHash),
                    timestamp: Date.now(),
                }
            } as X402Invoice
        };
    },

    /**
     * Create x402 endpoint URL for Huginn service
     */
    getX402Endpoint: () => {
        return `starknet://${HUGINN_REGISTRY_ADDRESS}/log_thought`;
    },

    /**
     * Verify x402 payment before logging thought
     */
    verifyPayment: async (invoice: X402Invoice, txHash: string): Promise<boolean> => {
        // TODO: Implement payment verification via Starknet RPC
        // Check that txHash contains payment of correct amount to correct recipient
        return true;
    }
};

/**
 * x402 Facilitator Integration
 * Compatible with Daydreams facilitator pattern
 */
export const HuginnX402Facilitator = {
    serviceDefinition: {
        id: "huginn-thought-logging",
        name: "Huginn Thought Logging",
        description: "Log cryptographic proof of agent reasoning on Starknet",
        chain: "starknet",
        pricing: {
            model: "per-request",
            amount: X402_CONFIG.pricePerThought,
            token: "USDC",
        },
        endpoint: `starknet://${HUGINN_REGISTRY_ADDRESS}/log_thought`,
    },

    /**
     * Handle incoming x402 request
     */
    handleRequest: async (request: {
        thoughtText: string;
        payment: X402Invoice;
    }) => {
        // 1. Verify payment
        const isValid = await Huginn.verifyPayment(request.payment, "");
        if (!isValid) {
            throw new Error("Invalid payment");
        }

        // 2. Execute service (log thought)
        const { starknetCall } = Huginn.logThought(request.thoughtText);

        // 3. Return receipt
        return {
            status: "success",
            txHash: "0x...", // Actual tx hash from Starknet
            service: X402_CONFIG.serviceId,
        };
    },
};
