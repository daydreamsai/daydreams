import { PoolKey } from '../../../types';

export interface TokenPrice {
  symbol: string;
  address: string;
  ratio: number | null;
  best_pool: {
    token0: string;
    token1: string;
    fee: string;
    tick_spacing: number;
    extension: string;
  } | null;
}

export async function getAllTokensFromAPI(): Promise<TokenPrice[]> {
  const response = await fetch('https://api-sepolia.ponzi.land/price');
  return response.json();
}

export async function getLiquidityPoolFromAPI(tokenAddress: string): Promise<PoolKey | null> {
  try {
    const response = await fetch('https://api-sepolia.ponzi.land/price');
    const tokens: TokenPrice[] = await response.json();
    
    const token = tokens.find(t => {

      console.log('t.address', t.address.toString());
      console.log('tokenAddress', tokenAddress);
      console.log(BigInt(t.address.toString()) == BigInt(tokenAddress));

      return BigInt(t.address.toString()) == BigInt(tokenAddress);
    });

    console.log('token', token);

  


    if (!token || !token.best_pool) {
      return {
        token0: tokenAddress,
        token1: tokenAddress,
        fee: BigInt("0x20c49ba5e353f80000000000000000"),
        tick_spacing: "0x3e8",
        extension: "0"
      };
    }

    return {
      token0: token.best_pool.token0,
      token1: token.best_pool.token1,
      fee: BigInt(token.best_pool.fee),
      tick_spacing: token.best_pool.tick_spacing.toString(),
      extension: token.best_pool.extension
    };
  } catch (error) {
    console.error('Error fetching liquidity pool:', error);
    return null;
  }
} 