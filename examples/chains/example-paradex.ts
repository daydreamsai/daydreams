import { shortString, ec, typedData as starkTypedData, type TypedData } from "starknet";
import { groq } from "@ai-sdk/groq";
import { cli } from "../../packages/core/src/extensions";
import { z } from "zod";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createContainer } from "../../packages/core/src/container";
import { action } from "../../packages/core/src/utils";
import { createDreams } from "../../packages/core/src/dreams";
import { LogLevel } from "../../packages/core/src/types";
import BigNumber from "bignumber.js";

const container = createContainer();
container.singleton("config", () => {
    const envSchema = z.object({
        PARADEX_ACCOUNT_ADDRESS: z.string().min(1),
        PARADEX_PRIVATE_KEY: z.string().min(1),
        PARADEX_BASE_URL: z.string().min(1),
        PARADEX_CHAIN_ID: z.string().min(1),
        GROQ_API_KEY: z.string().min(1),
    });

    const dirname = path.dirname(fileURLToPath(import.meta.url));
    const projectRoot = path.join(dirname, "..");
    const envFile = ".env";
    const envPath = path.resolve(projectRoot, envFile);
    dotenv.config({ path: envPath });
    const result = envSchema.safeParse(process.env);

    if (!result.success) {
        throw new Error(`Invalid environment variables: ${JSON.stringify(result.error.format())}`);
    }

    return {
        apiBaseUrl: result.data.PARADEX_BASE_URL,
        starknet: {
            chainId: result.data.PARADEX_CHAIN_ID
        }
    };
});

container.singleton("paradex", (container) => {
    const config = container.resolve("config") as ParadexConfig;
    return {
        authenticate: () => authenticate(config, {
            address: process.env.PARADEX_ACCOUNT_ADDRESS!,
            privateKey: process.env.PARADEX_PRIVATE_KEY!
        }),
        getAccountInfo: (account: ParadexAccount) => getAccountInfo(config, account),
        listMarkets: (market?: string) => listAvailableMarkets(config, market),
        getPositions: (account: ParadexAccount) => getPositions(config, account),
        getOpenOrders: (account: ParadexAccount) => getOpenOrders(config, account),
        placeOrder: (account: ParadexAccount, orderDetails: Record<string, string>) => openOrder(config, account, orderDetails),
        cancelOrder: (account: ParadexAccount, orderId: string) => cancelOrder(config, account, orderId)
    };
});

const env = container.resolve("config") as ParadexConfig;

export { container, env };


export interface ParadexAccount {
    address: string;
    privateKey: string;
    jwtToken?: string;
}

export interface ParadexConfig {
    readonly apiBaseUrl: string;
    readonly starknet: {
        readonly chainId: string;
    };
}

interface ParadexOrder {
    market: string;
    side: string;
    type: string;
    size: string;
    price: string;
}

const marketCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_DURATION = 30000;

async function getCachedMarkets(config: ParadexConfig, market?: string): Promise<any[]> {
    const cacheKey = market || 'all_markets';
    const cached = marketCache.get(cacheKey);

    if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
        return cached.data;
    }

    const markets = await listAvailableMarkets(config, market);
    marketCache.set(cacheKey, { data: markets, timestamp: Date.now() });
    return markets;
}

const DOMAIN_TYPES = {
    StarkNetDomain: [
        { name: "name", type: "felt" },
        { name: "chainId", type: "felt" },
        { name: "version", type: "felt" },
    ],
};

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

interface AuthRequest extends Record<string, unknown> {
    method: string;
    path: string;
    body: string;
    timestamp: number;
    expiration: number;
}

function generateTimestamps(): {
    timestamp: number;
    expiration: number;
} {
    const dateNow = new Date();
    const dateExpiration = new Date(dateNow.getTime() + SEVEN_DAYS_MS);

    return {
        timestamp: Math.floor(dateNow.getTime() / 1000),
        expiration: Math.floor(dateExpiration.getTime() / 1000),
    };
}

function buildAuthTypedData(
    message: Record<string, unknown>,
    starknetChainId: string,
) {
    const paradexDomain = buildParadexDomain(starknetChainId);
    return {
        domain: paradexDomain,
        primaryType: "Request",
        types: {
            ...DOMAIN_TYPES,
            Request: [
                { name: "method", type: "felt" },
                { name: "path", type: "felt" },
                { name: "body", type: "felt" },
                { name: "timestamp", type: "felt" },
                { name: "expiration", type: "felt" },
            ],
        },
        message,
    };
}

function buildOrderTypedData(
    message: Record<string, unknown>,
    starknetChainId: string,
) {
    const paradexDomain = buildParadexDomain(starknetChainId);
    return {
        domain: paradexDomain,
        primaryType: "Order",
        types: {
            ...DOMAIN_TYPES,
            Order: [
                { name: "timestamp", type: "felt" },
                { name: "market", type: "felt" },
                { name: "side", type: "felt" },
                { name: "orderType", type: "felt" },
                { name: "size", type: "felt" },
                { name: "price", type: "felt" },
            ],
        },
        message,
    };
}

function signatureFromTypedData(account: ParadexAccount, typedData: TypedData) {
    const msgHash = starkTypedData.getMessageHash(typedData, account.address);
    const { r, s } = ec.starkCurve.sign(msgHash, account.privateKey);
    return JSON.stringify([r.toString(), s.toString()]);
}

function toQuantums(
    amount: BigNumber | string,
    precision: number,
): string {
    const bnAmount = typeof amount === "string" ? new BigNumber(amount) : amount;
    const bnQuantums = bnAmount.multipliedBy(new BigNumber(10).pow(precision));
    return bnQuantums.integerValue(BigNumber.ROUND_FLOOR).toString();
}

function signAuthRequest(
    config: ParadexConfig,
    account: ParadexAccount,
): {
    signature: string;
    timestamp: number;
    expiration: number;
} {
    const { timestamp, expiration } = generateTimestamps();

    const request: AuthRequest = {
        method: "POST",
        path: "/v1/auth",
        body: "",
        timestamp,
        expiration,
    };

    const typedData = buildAuthTypedData(request, config.starknet.chainId);
    const signature = signatureFromTypedData(account, typedData);

    return { signature, timestamp, expiration };
}

function signOrder(
    config: ParadexConfig,
    account: ParadexAccount,
    orderDetails: Record<string, string>,
    timestamp: number,
): string {
    const sideForSigning = orderDetails.side === "BUY" ? "1" : "2";

    const priceForSigning = toQuantums(orderDetails.price ?? "0", 8);
    const sizeForSigning = toQuantums(orderDetails.size, 8);
    const orderTypeForSigning = shortString.encodeShortString(
        orderDetails.type,
    );
    const marketForSigning = shortString.encodeShortString(orderDetails.market);

    const message = {
        timestamp: timestamp,
        market: marketForSigning,
        side: sideForSigning,
        orderType: orderTypeForSigning,
        size: sizeForSigning,
        price: priceForSigning,
    };

    const typedData = buildOrderTypedData(message, config.starknet.chainId);
    const signature = signatureFromTypedData(account, typedData);

    return signature;
}

async function authenticate(config: ParadexConfig, account: ParadexAccount) {
    const { signature, timestamp, expiration } = signAuthRequest(
        config,
        account,
    );
    const headers = {
        Accept: "application/json",
        "PARADEX-STARKNET-ACCOUNT": account.address,
        "PARADEX-STARKNET-SIGNATURE": signature,
        "PARADEX-TIMESTAMP": timestamp.toString(),
        "PARADEX-SIGNATURE-EXPIRATION": expiration.toString(),
        "Content-Type": "application/json"
    };

    try {
        const response = await fetch(`${config.apiBaseUrl}/auth`, {
            method: "POST",
            headers,
            body: JSON.stringify({}),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Authentication failed: ${response.status} - ${errorData.message || response.statusText}`);
        }

        const data = await response.json();
        if (!data.jwt_token) {
            throw new Error('No JWT token received from authentication');
        }
        return data.jwt_token;
    } catch (e) {
        throw e;
    }
}

async function paradexLogin(): Promise<
    { config: ParadexConfig; account: ParadexAccount }
> {
    const apiBaseUrl = env.apiBaseUrl;
    const chainId = shortString.encodeShortString(env.starknet.chainId);

    const config: ParadexConfig = {
        apiBaseUrl,
        starknet: { chainId },
    };

    const account: ParadexAccount = {
        address: process.env.PARADEX_ACCOUNT_ADDRESS || "",
        privateKey: process.env.PARADEX_PRIVATE_KEY || "",
    };

    account.jwtToken = await authenticate(config, account);

    console.log(`Authenticating Paradex account ${account.address}`);

    return { config, account };
}

let authRefreshTimeout: ReturnType<typeof setTimeout>;
async function debouncedAuthRefresh(config: ParadexConfig, account: ParadexAccount) {
    if (authRefreshTimeout) {
        clearTimeout(authRefreshTimeout);
    }
    authRefreshTimeout = setTimeout(async () => {
        try {
            account.jwtToken = await authenticate(config, account);
        } catch (error) {
            throw error;
        }
    }, 1000);
}

function buildParadexDomain(starknetChainId: string) {
    return {
        name: "Paradex",
        chainId: starknetChainId,
        version: "1",
    };
}

async function getAccountInfo(config: ParadexConfig, account: ParadexAccount) {
    if (!account.jwtToken) {
        throw new Error('No JWT token available. Please authenticate first.');
    }

    const headers = {
        Accept: "application/json",
        Authorization: `Bearer ${account.jwtToken}`,
    };

    try {
        const response = await fetch(`${config.apiBaseUrl}/account`, {
            method: "GET",
            headers,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Failed to get account info: ${response.status} - ${errorData.message || response.statusText}`);
        }

        const responseData = await response.json();
        return responseData;
    } catch (e) {
        throw e;
    }
}

async function getPositions(config: ParadexConfig, account: ParadexAccount) {
    if (!account.jwtToken) {
        throw new Error('No JWT token available. Please authenticate first.');
    }

    const headers = {
        Accept: "application/json",
        Authorization: `Bearer ${account.jwtToken}`,
    };

    try {
        const response = await fetch(`${config.apiBaseUrl}/positions`, {
            method: "GET",
            headers,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        return responseData.results || [];
    } catch (e) {
        throw e;
    }
}

async function getOpenOrders(config: ParadexConfig, account: ParadexAccount) {
    if (!account.jwtToken) {
        throw new Error('No JWT token available. Please authenticate first.');
    }

    const headers = {
        Accept: "application/json",
        Authorization: `Bearer ${account.jwtToken}`,
    };

    try {
        const response = await fetch(`${config.apiBaseUrl}/orders`, {
            method: "GET",
            headers,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        return responseData.results || [];
    } catch (e) {
        throw e;
    }
}

async function openOrder(
    config: ParadexConfig,
    account: ParadexAccount,
    orderDetails: Record<string, string>,
) {
    if (!account.jwtToken) {
        throw new Error('No JWT token available. Please authenticate first.');
    }

    const price = Number(orderDetails.price);
    if (price <= 0) {
        throw new Error("Order failed: price must be a non-negative non-zero number.");
    }

    const timestamp = Date.now();
    const signature = signOrder(config, account, orderDetails, timestamp);

    const inputBody = JSON.stringify({
        ...orderDetails,
        signature: signature,
        signature_timestamp: timestamp,
    });

    const headers = {
        Accept: "application/json",
        Authorization: `Bearer ${account.jwtToken}`,
        "Content-Type": "application/json",
    };

    try {
        const response = await fetch(`${config.apiBaseUrl}/orders`, {
            method: "POST",
            headers,
            body: inputBody,
        });

        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(`Order failed: ${responseData.message || response.status}`);
        }

        return {
            orderId: responseData.orderId || responseData.id || 'filled-immediately',
            status: responseData.status || 'success',
            data: responseData
        };
    } catch (error) {
        throw error;
    }
}

async function cancelOrder(
    config: ParadexConfig,
    account: ParadexAccount,
    orderId: string,
) {
    if (!account.jwtToken) {
        throw new Error('No JWT token available. Please authenticate first.');
    }

    const headers = {
        Accept: "application/json",
        Authorization: `Bearer ${account.jwtToken}`,
    };

    try {
        const response = await fetch(`${config.apiBaseUrl}/orders/${orderId}`, {
            method: "DELETE",
            headers,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return true;
    } catch (e) {
        throw e;
    }
}

async function listAvailableMarkets(config: ParadexConfig, market?: string) {
    const headers = {
        Accept: "application/json",
    };

    try {
        const url = market
            ? `${config.apiBaseUrl}/markets?market=${market}`
            : `${config.apiBaseUrl}/markets`;

        const response = await fetch(url, {
            method: "GET",
            headers,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        if (!responseData.results) {
            throw new Error('No results found in response');
        }
        return responseData.results;
    } catch (e) {
        throw e;
    }
}

async function main() {
    const { config, account } = await paradexLogin();

    const refreshInterval = setInterval(async () => {
        try {
            account.jwtToken = await authenticate(config, account);
        } catch (error) {
            throw error;
        }
    }, 1000 * 60 * 3 - 3000);

    const cleanup = () => {
        clearInterval(refreshInterval);
        marketCache.clear();
        process.exit(0);
    };

    process.on("SIGTERM", cleanup);
    process.on("SIGINT", cleanup);

    try {
        const accountInfo = await getAccountInfo(config, account);
        if (!accountInfo) {
            throw new Error('Failed to retrieve account information');
        }
    } catch (error) {
        cleanup();
        return;
    }

    try {
        const accountInfo = await getAccountInfo(config, account);
        if (!accountInfo) {
            throw new Error('Failed to retrieve account information');
        }

        console.log(`Account:
            Status: ${accountInfo.status || 'N/A'}
            Value: ${accountInfo.account_value || 'N/A'}
            P&L: ${accountInfo.account_value && accountInfo.total_collateral ?
                (accountInfo.account_value - accountInfo.total_collateral) : 'N/A'}
            Free collateral: ${accountInfo.free_collateral || 'N/A'}`);
    } catch (error) {
        console.error('Failed to get account info:', error);
        cleanup();
        return;
    }

    const getAccountInfoAction = action({
        name: "paradex-get-account-info",
        description: "Get account information including value and free collateral",
        schema: z.object({
            text: z.string().describe("Natural language request for account info")
        }),
        handler: async (_call, _ctx, _agent) => {
            try {
                const accountInfo = await getAccountInfo(config, account);
                return {
                    success: true,
                    message: JSON.stringify({
                        text: `Account Status: ${accountInfo.status}\nValue: ${accountInfo.account_value}\nFree Collateral: ${accountInfo.free_collateral}`
                    })
                };
            } catch (error) {
                return {
                    success: false,
                    message: JSON.stringify({ error: String(error) })
                };
            }
        }
    });

    const openOrderAction = action({
        name: "paradex-open-order",
        description: "Open a market or limit order on Paradex. Examples: 'buy 0.1 ETH at market price' or 'buy 0.5 BTC at limit 40000'",
        schema: z.object({
            text: z.string().describe("Natural language description of the order you want to place")
        }),
        handler: async (call: { text: string }, _ctx, _agent) => {
            try {
                const text = call.text.toLowerCase();

                const orderPattern = /\b(buy|sell)\s+(\d+\.?\d*)\s+([a-zA-Z0-9]+)(?:\s+(?:at|@)\s+(market|limit)\s*(?:price\s*)?(?:(\d+\.?\d*))?)?/i;
                const match = text.match(orderPattern);

                if (!match) {
                    return {
                        success: false,
                        message: JSON.stringify({
                            text: "Invalid order format. Examples:\n" +
                                "'buy 0.1 ETH at market price'\n" +
                                "'sell 0.5 BTC at limit 40000'"
                        })
                    };
                }

                const [, side, size, baseToken, orderType, limitPrice] = match;
                const marketSymbol = `${baseToken.toUpperCase()}-USD-PERP`;

                const availableMarkets = await getCachedMarkets(config);
                const market = availableMarkets.find((m: { symbol: string }) => m.symbol === marketSymbol);

                if (!market) {
                    return {
                        success: false,
                        message: JSON.stringify({
                            text: `Market ${marketSymbol} is not available. Available markets:\n` +
                                availableMarkets.map((m: { symbol: string }) => m.symbol).join(", ")
                        })
                    };
                }

                const sizeNum = Number(size);
                const sizeIncrement = Number(market.order_size_increment);
                const adjustedSize = Math.max(
                    sizeIncrement,
                    Math.ceil(sizeNum / sizeIncrement) * sizeIncrement
                ).toString();

                const orderDetails: Record<string, string> = {
                    market: marketSymbol,
                    side: side.toUpperCase(),
                    size: adjustedSize,
                    timeInForceType: orderType.toLowerCase() === 'market' ? 'IOC' : 'GTC',
                    type: orderType.toLowerCase() === 'limit' ? 'LIMIT' : 'MARKET'
                };

                if (orderDetails.type === 'LIMIT') {
                    if (!limitPrice) {
                        return {
                            success: false,
                            message: JSON.stringify({
                                text: "Limit orders require a price. Example: 'buy 0.1 ETH at limit 3000'"
                            })
                        };
                    }

                    const tickSize = Number(market.tick_size);
                    const priceNum = Number(limitPrice);
                    orderDetails.price = (Math.ceil(priceNum / tickSize) * tickSize).toString();

                    const currentMarket = await getCachedMarkets(config, marketSymbol);
                    const lastPrice = Number(currentMarket[0]?.last_price || 0);

                    if (lastPrice && Math.abs((priceNum - lastPrice) / lastPrice) > 0.1) {
                        return {
                            success: false,
                            message: JSON.stringify({
                                text: `Warning: Your limit price (${orderDetails.price}) deviates significantly from the last price (${lastPrice}). Please confirm the price.`
                            })
                        };
                    }
                }

                try {
                    const result = await openOrder(config, account, orderDetails);

                    await Promise.all([
                        debouncedAuthRefresh(config, account)
                    ]);

                    return {
                        success: true,
                        message: JSON.stringify({
                            text: `${orderDetails.type} order opened successfully:\n` +
                                `• Order ID: ${result.orderId}\n` +
                                `• ${side.toUpperCase()} ${adjustedSize} ${baseToken}\n` +
                                (orderDetails.type === 'LIMIT' ? `• Price: ${orderDetails.price}\n` : '') +
                                `• Status: ${result.status}`
                        })
                    };
                } catch (error) {
                    throw error;
                }
            } catch (error) {
                return {
                    success: false,
                    message: JSON.stringify({
                        error: error instanceof Error ? error.message : String(error)
                    })
                };
            }
        }
    });

    const cancelOrderAction = action({
        name: "paradex-cancel-order",
        description: "Cancel an existing order. You can say something like 'cancel order 123' or 'remove order ABC'",
        schema: z.object({
            text: z.string().describe("Natural language request to cancel an order")
        }),
        handler: async (call: { text: string }, _ctx, _agent) => {
            try {
                const text = call.text.toLowerCase();
                const orderIdMatch = text.match(/(?:order|#)\s*([a-zA-Z0-9]+)/);

                if (!orderIdMatch) {
                    return {
                        success: false,
                        message: JSON.stringify({
                            text: "Please specify the order ID. For example: 'cancel order 123'"
                        })
                    };
                }

                const orderId = orderIdMatch[1];
                await cancelOrder(config, account, orderId);
                return {
                    success: true,
                    message: JSON.stringify({
                        text: `Order ${orderId} has been canceled successfully`
                    })
                };
            } catch (error) {
                return {
                    success: false,
                    message: JSON.stringify({
                        text: error instanceof Error ? error.message : String(error)
                    })
                };
            }
        },
    });

    const listOpenOrdersAction = action({
        name: "paradex-list-open-orders",
        description: "Show your current open orders",
        schema: z.object({
            text: z.string().describe("Natural language request to view open orders")
        }),
        handler: async (_call, _ctx, _agent) => {
            try {
                const orders = await getOpenOrders(config, account);
                return {
                    success: true,
                    message: JSON.stringify({
                        text: orders.length ?
                            `Your Open Orders:\n${orders.map((order: ParadexOrder) =>
                                `• ${order.market}: ${order.side} ${order.size} @ ${order.price} (${order.type})`).join('\n')}` :
                            "You don't have any open orders at the moment."
                    })
                };
            } catch (error) {
                return {
                    success: false,
                    message: JSON.stringify({ error: String(error) })
                };
            }
        }
    });

    const listAvailableMarketsAction = action({
        name: "paradex-list-available-markets",
        description: "Show available trading markets",
        schema: z.object({
            text: z.string().describe("Natural language request to view available markets")
        }),
        handler: async (_call, _ctx, _agent) => {
            try {
                const markets = await listAvailableMarkets(config);
                if (!markets || markets.length === 0) {
                    return {
                        success: true,
                        message: {
                            message: "No trading markets are available at the moment."
                        }
                    };
                }

                const marketList = markets
                    .map((market: { symbol: string }) => market.symbol)
                    .join("\n• ");

                return {
                    success: true,
                    message: {
                        message: `Available Trading Markets:\n• ${marketList}`
                    }
                };
            } catch (error) {
                return {
                    success: false,
                    message: {
                        message: `Error: ${error instanceof Error ? error.message : String(error)}`
                    }
                };
            }
        }
    });

    const getPositionsAction = action({
        name: "paradex-get-positions",
        description: "Show your current trading positions",
        schema: z.object({
            text: z.string().describe("Natural language request to view positions")
        }),
        handler: async (_call, _ctx, _agent) => {
            try {
                const positions = await getPositions(config, account);
                return {
                    success: true,
                    message: {
                        message: positions.length ?
                            `Current positions:\n${positions.map((p: { market: string; size: string; price: string }) =>
                                `${p.market}: ${p.size}${p.price ? ` @ ${p.price}` : ''}`).join('\n')}` :
                            "No open positions"
                    }
                };
            } catch (error) {
                return {
                    success: false,
                    message: {
                        message: `Error: ${error instanceof Error ? error.message : String(error)}`
                    }
                };
            }
        }
    });

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
        extensions: [cli],
        logger: LogLevel.INFO,
        actions: [
            getAccountInfoAction,
            openOrderAction,
            cancelOrderAction,
            listOpenOrdersAction,
            listAvailableMarketsAction,
            getPositionsAction
        ],
    }).start();

    return agent;
}

if (import.meta.main) {
    main().catch((err) => {
        console.error(err);
        process.exit(1);
    });
}
