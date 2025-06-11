import { createGroq } from "@ai-sdk/groq";
import { createDreams, LogLevel, action, validateEnv } from "@daydreamsai/core";
import { cli } from "@daydreamsai/core/extensions";
import { z } from "zod";
import { ethers } from "ethers";
import { Account, Provider, num } from "starknet";

// Avnu Types and Interfaces
export interface AvnuQuoteRequest {
    sellTokenAddress: string;
    buyTokenAddress: string;
    sellAmount: string;
}

export interface AvnuSwapRequest {
    quoteId: string;
    takerAddress?: string;
    slippage?: number;
    includeApprove?: boolean;
}

export interface AvnuTokensRequest {
    search?: string;
    tag?: string[];
    page?: number;
    size?: number;
    sort?: string[];
}

export interface AvnuToken {
    name: string;
    address: string;
    symbol: string;
    decimals: number;
    logoUri: string;
    lastDailyVolumeUsd: number;
    extensions: Record<string, string>;
    tags: string[];
}

export interface AvnuTokensResponse {
    content: AvnuToken[];
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
}

// Add interfaces for quotes
interface AvnuGasTokenPrice {
    tokenAddress: string;
    gasFeesInGasToken: string;
    gasFeesInUsd: number;
}

interface AvnuGasless {
    active: boolean;
    gasTokenPrices: AvnuGasTokenPrice[];
}

interface AvnuRoute {
    name: string;
    address: string;
    percent: number;
    sellTokenAddress: string;
    buyTokenAddress: string;
    routeInfo: Record<string, unknown>;
    routes: AvnuRoute[];
}

interface AvnuQuote {
    quoteId: string;
    sellTokenAddress: string;
    sellAmount: string;
    sellAmountInUsd: number;
    buyTokenAddress: string;
    buyAmount: string;
    buyAmountInUsd: number;
    buyAmountWithoutFees: string;
    buyAmountWithoutFeesInUsd: number;
    estimatedAmount: boolean;
    chainId: string;
    blockNumber: string;
    expiry: string | null;
    routes: AvnuRoute[];
    gasFees: string;
    gasFeesInUsd: number;
    avnuFees: string;
    avnuFeesInUsd: number;
    avnuFeesBps: string;
    integratorFees: string;
    integratorFeesInUsd: number;
    integratorFeesBps: string;
    priceRatioUsd: number;
    liquiditySource: string;
    sellTokenPriceInUsd: number;
    buyTokenPriceInUsd: number;
    gasless: AvnuGasless;
    exactTokenTo: boolean;
}

// Add interface for build request and response
interface AvnuBuildRequest {
    quoteId: string;
    slippage: number;
    includeApprove: boolean;
}

interface AvnuCall {
    contractAddress: string;
    entrypoint: string;
    calldata: string[];
}

interface AvnuBuildResponse {
    chainId: string;
    calls: AvnuCall[];
}

// Add interfaces for build-typed-data
interface AvnuTypedDataRequest {
    quoteId: string;
    slippage: number;
    includeApprove: boolean;
    gasTokenAddress?: string;
    maxGasTokenAmount?: string;
}

interface AvnuTypedDataType {
    name: string;
    type: string;
}

interface AvnuDomainValue {
    content: string;
    isString: boolean;
}

interface AvnuDomain {
    name: AvnuDomainValue;
    version: AvnuDomainValue;
    chainId: AvnuDomainValue;
    revision: AvnuDomainValue;
    resolvedRevision: string;
    separatorName$lib: string;
}

interface AvnuTypedDataResponse {
    types: Record<string, AvnuTypedDataType[]>;
    primaryType: string;
    domain: AvnuDomain;
    message: {
        values: Record<string, unknown>[];
        isEmpty: boolean;
        size: number;
        entries: Array<{
            value: Record<string, unknown>;
            key: string;
        }>;
        keys: string[];
    };
}

// Add interfaces for execute request and response
interface AvnuExecuteRequest {
    quoteId: string;
    signature: string[];
}

interface AvnuExecuteResponse {
    transactionHash: string;
}

// Avnu Client Implementation
class AvnuClient {
    private apiUrl: string;
    public takerAddress: string;

    constructor(
        apiUrl: string = process.env.AVNU_API_URL!,
        takerAddress: string = "0x052D8E9778D026588a51595E30B0F45609B4F771EecF0E335CdeFeD1d84a9D89"
    ) {
        this.apiUrl = apiUrl;
        this.takerAddress = takerAddress;
    }

    private formatFelt(value: string): string {
        const cleanValue = value.toLowerCase().replace('0x', '');
        const paddedValue = cleanValue.padStart(1, '0');
        return `0x${paddedValue}`;
    }

    public async getQuotes(request: AvnuQuoteRequest): Promise<AvnuQuote[]> {
        try {
            const sellTokenAddress = this.formatFelt(request.sellTokenAddress);
            const buyTokenAddress = this.formatFelt(request.buyTokenAddress);
            const sellAmount = this.formatFelt(request.sellAmount);

            const params = new URLSearchParams({
                sellTokenAddress,
                buyTokenAddress,
                sellAmount,
                takerAddress: this.takerAddress
            });

            const response = await fetch(`${this.apiUrl}/swap/v2/quotes?${params}`, {
                method: 'GET',
                headers: {
                    'Origin': 'https://app.avnu.fi',
                    'User-Agent': 'Mozilla/5.0'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                const error = JSON.parse(errorText);
                throw new Error(`Failed to get quotes: ${error.messages?.[0] || error.message || response.statusText}`);
            }

            const quotes: AvnuQuote[] = await response.json();
            if (!quotes.length) {
                throw new Error("No quotes available for this swap");
            }

            return quotes;
        } catch (error: any) {
            throw error;
        }
    }

    public async buildSwap(request: AvnuBuildRequest): Promise<AvnuBuildResponse> {
        try {
            const requestBody = {
                quoteId: request.quoteId,
                takerAddress: this.takerAddress,
                slippage: request.slippage,
                includeApprove: request.includeApprove
            };

            const response = await fetch(`${this.apiUrl}/swap/v2/build`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    'Origin': 'https://app.avnu.fi',
                    'User-Agent': 'Mozilla/5.0'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                const error = JSON.parse(errorText);
                throw new Error(`Failed to build swap: ${error.messages?.[0] || error.message || response.statusText}`);
            }

            return await response.json();
        } catch (error: any) {
            throw error;
        }
    }

    public async buildTypedData(request: AvnuTypedDataRequest): Promise<AvnuTypedDataResponse> {
        try {
            const requestBody = {
                quoteId: request.quoteId,
                takerAddress: this.takerAddress,
                slippage: request.slippage,
                includeApprove: request.includeApprove
            };

            console.log('Debug - Build typed data request:', requestBody);

            const response = await fetch(`${this.apiUrl}/swap/v2/build-typed-data`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    'Origin': 'https://app.avnu.fi',
                    'User-Agent': 'Mozilla/5.0'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                const error = JSON.parse(errorText);
                throw new Error(`Failed to build typed data: ${error.messages?.[0] || error.message || response.statusText}`);
            }

            const typedDataResponse = await response.json();
            console.log('Debug - Typed data response:', typedDataResponse);
            return typedDataResponse;
        } catch (error: any) {
            throw error;
        }
    }

    public async executeSwap(request: AvnuExecuteRequest): Promise<AvnuExecuteResponse> {
        try {
            console.log('Debug - Execute swap request:', request);
            const response = await fetch(`${this.apiUrl}/swap/v2/execute`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    'Origin': 'https://app.avnu.fi',
                    'User-Agent': 'Mozilla/5.0'
                },
                body: JSON.stringify({
                    quoteId: request.quoteId,
                    signature: request.signature.map(sig => sig.startsWith('0x') ? sig : `0x${sig}`)
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                const error = JSON.parse(errorText);
                throw new Error(`Failed to execute swap: ${error.messages?.[0] || error.message || response.statusText}`);
            }

            return await response.json();
        } catch (error: any) {
            throw error;
        }
    }

    public async getTokens(request: AvnuTokensRequest = {}): Promise<AvnuTokensResponse> {
        try {
            const params = new URLSearchParams();
            if (request.search) params.append("search", request.search);
            if (request.tag) request.tag.forEach(tag => params.append("tag", tag));
            if (request.page !== undefined) params.append("page", request.page.toString());
            if (request.size !== undefined) params.append("size", request.size.toString());
            if (request.sort) request.sort.forEach(sort => params.append("sort", sort));

            const response = await fetch(`${this.apiUrl}/v1/starknet/tokens?${params}`);
            if (!response.ok) {
                throw new Error(`Failed to get tokens: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            throw error;
        }
    }
}

// Environment Configuration
type EnvConfig = {
    GROQ_API_KEY: string;
    STARKNET_ACCOUNT_ADDRESS: string;
    STARKNET_PRIVATE_KEY: string;
};

try {
    const env = validateEnv(
        z.object({
            GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY is required"),
            STARKNET_ACCOUNT_ADDRESS: z.string().min(1, "STARKNET_ACCOUNT_ADDRESS is required for swapping tokens"),
            STARKNET_PRIVATE_KEY: z.string().min(1, "STARKNET_PRIVATE_KEY is required for swapping tokens"),
        })
    ) as EnvConfig;

    const groq = createGroq({ apiKey: env.GROQ_API_KEY });
    const provider = new Provider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_5" });
    const account = new Account(provider, env.STARKNET_ACCOUNT_ADDRESS, env.STARKNET_PRIVATE_KEY);
    const avnu = new AvnuClient(process.env.AVNU_API_URL!, env.STARKNET_ACCOUNT_ADDRESS);

    const agent = createDreams({
        model: {
            ...groq("deepseek-r1-distill-llama-70b"),
            doStream: async (opts) => {
                const result = await groq("deepseek-r1-distill-llama-70b").doStream(opts);
                return {
                    ...result,
                    stream: result.stream as any
                };
            }
        },
        logger: LogLevel.INFO,
        extensions: [cli],
        actions: [
            action({
                name: "list_tokens",
                description: "List available tokens for trading",
                schema: z.object({}),
                async handler() {
                    try {
                        const tokens = await avnu.getTokens();
                        return {
                            success: true,
                            message: `Available tokens:\n${tokens.content.map(t => 
                                `${t.symbol} (${t.name}) - ${t.address}`
                            ).join('\n')}`
                        };
                    } catch (error) {
                        throw error;
                    }
                }
            }),
            action({
                name: "swap_tokens",
                description: "Swap tokens on Avnu (Sepolia)",
                schema: z.object({
                    sellTokenSymbol: z.string().describe("The symbol of the token to sell"),
                    buyTokenSymbol: z.string().describe("The symbol of the token to buy"),
                    amount: z.string().describe("The amount to sell"),
                    slippage: z.number().optional().describe("Slippage tolerance in percentage (default: 1)"),
                }),
                async handler(call) {
                    try {
                        const { sellTokenSymbol, buyTokenSymbol, amount, slippage = 1 } = call;

                        // Step 1: Get token info
                        const [sellTokenResponse, buyTokenResponse] = await Promise.all([
                            avnu.getTokens({ search: sellTokenSymbol }),
                            avnu.getTokens({ search: buyTokenSymbol })
                        ]);

                        const sellTokenInfo = sellTokenResponse.content.find(t => t.symbol.toUpperCase() === sellTokenSymbol.toUpperCase());
                        const buyTokenInfo = buyTokenResponse.content.find(t => t.symbol.toUpperCase() === buyTokenSymbol.toUpperCase());

                        if (!sellTokenInfo || !buyTokenInfo) {
                            throw new Error(`Could not find one or more tokens. Please verify the symbols.`);
                        }

                        console.log('Debug - Found tokens:', {
                            sell: `${sellTokenInfo.symbol} (${sellTokenInfo.address})`,
                            buy: `${buyTokenInfo.symbol} (${buyTokenInfo.address})`
                        });

                        // Step 2: Get quote
                        const sellAmountWei = ethers.parseUnits(amount, sellTokenInfo.decimals).toString();
                        const sellAmountHex = `0x${BigInt(sellAmountWei).toString(16)}`;

                        const quotes = await avnu.getQuotes({
                            sellTokenAddress: sellTokenInfo.address,
                            buyTokenAddress: buyTokenInfo.address,
                            sellAmount: sellAmountHex
                        });

                        if (!quotes.length) {
                            throw new Error("No quotes available for this swap");
                        }

                        const bestQuote = quotes[0];
                        console.log('Debug - Got quote:', {
                            quoteId: bestQuote.quoteId,
                            sellAmount: bestQuote.sellAmount,
                            buyAmount: bestQuote.buyAmount
                        });

                        // Step 3: Build swap transaction
                        const buildResult = await avnu.buildSwap({
                            quoteId: bestQuote.quoteId,
                            slippage: slippage / 100,
                            includeApprove: true
                        });

                        console.log('Debug - Build result:', buildResult);

                        // Step 4: Execute transactions
                        let lastTxHash;
                        for (const call of buildResult.calls) {
                            console.log('Debug - Executing call:', {
                                contractAddress: call.contractAddress,
                                entrypoint: call.entrypoint
                            });

                            const hash = await executeTransaction(account, call);
                            console.log('Debug - Transaction submitted:', hash);

                            await provider.waitForTransaction(hash);
                            console.log('Debug - Transaction confirmed:', hash);
                            lastTxHash = hash;
                        }

                        return {
                            success: true,
                            transactionHash: lastTxHash,
                            quote: bestQuote
                        };
                    } catch (error) {
                        console.error('Debug - Swap error:', error);
                        throw error;
                    }
                },
            }),
        ],
    });

    await agent.start();

} catch (error: any) {
    if (error instanceof z.ZodError) {
        throw error;
    } else {
        throw error;
    }
}

async function executeTransaction(account: Account, call: any) {
    try {
        // Format calldata properly for Starknet
        const formattedCalldata = call.calldata.map((data: string) => {
            console.log('Debug - Processing calldata item:', data);
            
            try {
                if (data.startsWith('0x')) {
                    const bigIntValue = num.toBigInt(data);
                    console.log('Debug - Converted hex to bigint:', data, '->', bigIntValue.toString());
                    return bigIntValue.toString();
                }
                console.log('Debug - Using raw value:', data);
                return data;
            } catch (err) {
                console.error('Debug - Calldata conversion error:', err);
                throw err;
            }
        });

        // Format transaction according to Starknet v0.5 spec
        const calls = [{
            contractAddress: num.toHex(call.contractAddress),
            entrypoint: call.entrypoint,
            calldata: formattedCalldata
        }];

        console.log('Debug - Final calls array:', JSON.stringify(calls, null, 2));

        // Execute with proper error handling
        try {
            const executionDetails = {
                maxFee: "0x1000000000000000",
                version: "0x1",
                nonce: await account.getNonce()
            };

            console.log('Debug - Execution details:', executionDetails);
            console.log('Debug - Account address:', account.address);

            // Execute the transaction
            const result = await account.execute(calls, executionDetails);
            console.log('Debug - Execute result:', result);

            // Convert the transaction hash to hex format if needed
            const transactionHash = result.transaction_hash.startsWith('0x') 
                ? result.transaction_hash 
                : `0x${result.transaction_hash}`;

            return transactionHash;
        } catch (execError: any) {
            console.error('Debug - Execute error:', {
                message: execError.message,
                details: execError.details,
                response: execError.response?.data
            });
            throw execError;
        }
    } catch (error: any) {
        console.error('Debug - Error details:', {
            message: error.message,
            stack: error.stack,
            raw: error
        });
        throw new Error(`Transaction failed: ${error?.message || 'Unknown error'}`);
    }
}
