import { BigNumberish } from "starknet";

export function toBigInt(value: BigNumberish): bigint | undefined {
    if (value == undefined) {
      return undefined;
    }
  
    if (typeof value === 'string' || typeof value === 'number') {
      return BigInt(value);
    }
    if (typeof value === 'bigint') {
      return value;
    }
    throw new Error('Unsupported BigNumberish type: ' + typeof value);
  }
  