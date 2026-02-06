import { CallData, hash, num, cairo } from "starknet";

export interface HuginnConfig {
  registryAddress: string;
  x402?: {
    serviceId?: string;
    pricePerThought?: string;
    paymentToken?: string;
  };
}

export interface AgentProfile {
  name: string;
  metadata_url: string;
}

export interface X402Invoice {
  service: string;
  amount: string;
  token: string;
  recipient: string;
  metadata?: Record<string, any>;
}

function validateAddress(address: string): void {
  if (!address || address === "0x123..." || address.length < 10) {
    throw new Error(
      "Invalid HUGINN_REGISTRY_ADDRESS. Please provide a valid deployed contract address via createHuginn({ registryAddress: '0x...' })"
    );
  }
}

/**
 * Create Huginn client with configuration
 * @param config - Configuration including registry address
 * @returns Huginn client instance
 */
export function createHuginn(config: HuginnConfig) {
  validateAddress(config.registryAddress);

  const x402Config = {
    serviceId: config.x402?.serviceId || "huginn-thought-logging",
    pricePerThought: config.x402?.pricePerThought || "0.0001",
    paymentToken: config.x402?.paymentToken || "0x...",
  };

  return {
    /**
     * Format call to register an agent
     */
    registerAgent: (name: string, metadataUrl: string) => {
      return {
        contractAddress: config.registryAddress,
        entrypoint: "register_agent",
        calldata: CallData.compile({
          name,
          metadata_url: metadataUrl,
        }),
      };
    },

    /**
     * Format call to log a thought (with optional x402 payment)
     */
    logThought: (thoughtText: string, withPayment = false) => {
      const thoughtHash = hash.starknetKeccak(thoughtText);

      const starknetCall = {
        contractAddress: config.registryAddress,
        entrypoint: "log_thought",
        calldata: CallData.compile({
          thought_hash: cairo.uint256(thoughtHash),
        }),
      };

      if (!withPayment) {
        return { starknetCall };
      }

      return {
        starknetCall,
        x402Invoice: {
          service: x402Config.serviceId,
          amount: x402Config.pricePerThought,
          token: x402Config.paymentToken,
          recipient: config.registryAddress,
          metadata: {
            thoughtHash: num.toHex(thoughtHash),
            timestamp: Date.now(),
          },
        } as X402Invoice,
      };
    },

    /**
     * Get x402 endpoint URL
     */
    getX402Endpoint: () => {
      return `starknet://${config.registryAddress}/log_thought`;
    },

    /**
     * Verify x402 payment
     */
    verifyPayment: async (
      invoice: X402Invoice,
      txHash: string
    ): Promise<boolean> => {
      // TODO: Implement payment verification via Starknet RPC
      return true;
    },

    /**
     * x402 Facilitator service definition
     */
    getFacilitatorDefinition: () => ({
      id: x402Config.serviceId,
      name: "Huginn Thought Logging",
      description: "Log cryptographic proof of agent reasoning on Starknet",
      chain: "starknet",
      pricing: {
        model: "per-request",
        amount: x402Config.pricePerThought,
        token: "USDC",
      },
      endpoint: `starknet://${config.registryAddress}/log_thought`,
    }),
  };
}

// Type for the return value of createHuginn
export type Huginn = ReturnType<typeof createHuginn>;
