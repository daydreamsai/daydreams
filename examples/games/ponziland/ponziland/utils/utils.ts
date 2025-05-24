import { Provider, constants, provider, RpcProvider, type GetTransactionReceiptResponse, type ReceiptTx } from "starknet";
import { getAllTokensFromAPI } from "./ponziland_api";
import { type TokenPrice } from "./ponziland_api";

// Function to decode token transfer events
export async function decodeTokenTransferEvents(tx: GetTransactionReceiptResponse) {
  try {
    // Get transaction receipt
    const txReceipt: GetTransactionReceiptResponse = tx;

    //@ts-ignore
    if (!txReceipt.events) {
      return [];
    }

    //@ts-ignore
    const events = txReceipt.events;
    
    // Filter for transfer events (for ERC20 tokens)
    // ERC20 Transfer event has a specific key
    const transferEvents = events.filter((event: any) => {
      // The first element in the keys array is the event name hash
      // For ERC20 Transfer, it's the hash of "Transfer(address,address,uint256)"
      return event.keys[0] == "0x99cd8bde557814842a3121e8ddfd433a539b8c9f14bf31ebf108d12e6196e9";
    });

    
    // Track token amounts by token address
    const tokenTotals: {[tokenAddress: string]: bigint} = {};
    
    // Process each transfer event
    for (const event of transferEvents) {
      // Skip transfer of stark for gas
      if (event.data[1] === "0x1176a1bd84444c89232ec27754698e5d2e7e1a7f1539f12027f28b23ec9f3d8") {
        continue;
      }
      if (event.keys[0] !== "0x99cd8bde557814842a3121e8ddfd433a539b8c9f14bf31ebf108d12e6196e9") {
        continue;
      }
      if (event.keys[2] !== "0xd29355d204c081b3a12c552cae38e0ffffb3e28c9dd956bee6466f545cf38a") {
        continue;
      }
      
      const tokenAddress = event.from_address;
      const amount = BigInt(event.data[0]);
      
      if (!tokenTotals[tokenAddress]) {
        tokenTotals[tokenAddress] = BigInt(0);
      }
      
      tokenTotals[tokenAddress] += amount;
    }
    // Get all token data
    const tokens = await getAllTokensFromAPI();
    
    // Format the results
    const results = Object.entries(tokenTotals).map(([tokenAddress, amount]) => {
      const tokenData = getTokenData(tokenAddress, tokens);
      return {
        token: tokenAddress,
        name: tokenData?.symbol || "Unknown Token",
        amount: formatTokenAmount(amount)
      };
    });

    console.log('tokenTotals', results);
    
    return results;
  } catch (error) {
    console.error("Error decoding events:", error);
    throw error;
  }
}

export const getTokenData = (tokenAddr: string | number, tokens: TokenPrice[]): TokenPrice | null => {
  for (const token of tokens) {
    if (BigInt(token.address) === BigInt(tokenAddr)) {
      return token;
    }
  }
  return null;
};

export const formatTokenAmount = (amount: bigint): string => {
  const divisor = BigInt(10 ** 18);
  const wholePart = amount / divisor;
  const fractionalPart = amount % divisor;
  
  // Convert fractional part to 4 decimal places
  const fractionalStr = fractionalPart.toString().padStart(18, '0');
  const decimalPlaces = fractionalStr.slice(0, 4);
  
  return `${wholePart}.${decimalPlaces}`;
};
