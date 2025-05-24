import { render } from "@daydreamsai/core";
import { fetchGraphQL } from "@daydreamsai/core";
import manifest from "../../contracts/ponziland_manifest_sepolia.json";
import { CairoCustomEnum, Contract, RpcProvider, type Abi } from "starknet";
import { balance_query, auction_query, land_query, nuke_query } from "../../gql_querys";
import { getAllTokensFromAPI } from "../utils/ponziland_api";
import view_manifest from "../../contracts/view_manifest_sepolia.json";
import { getTokenData, formatTokenAmount } from "../utils/utils";
import { env } from "../../env";
import { type TokenPrice } from "../utils/ponziland_api";

let provider = new RpcProvider({ nodeUrl: process.env.STARKNET_RPC_URL });
let abi = manifest.contracts[0].abi;

const address = process.env.STARKNET_ADDRESS!;

let ponziLandContract = (new Contract(abi, manifest.contracts[0].address, provider)).typedv2(abi as Abi);
let viewContract = (new Contract(view_manifest.contracts[0].abi, view_manifest.contracts[0].address, provider)).typedv2(view_manifest.contracts[0].abi as Abi);
let ponzilandAddress = manifest.contracts[0].address;
let block_time = (await provider.getBlock()).timestamp;



export const get_balances_str = async () => {
  // Retrieve balance and allowance info for each token via the contracts array.

  let tokens = await getAllTokensFromAPI();
  console.log('tokens', tokens)
  const balancesData = await Promise.all(
    tokens.map(async (token) => {
      let abi = await provider.getClassAt(token.address);
      let contract = new Contract(abi.abi, token.address, provider);
      const balance = await contract.call("balanceOf", [address]);
      const approved = await contract.call("allowance", [address, ponzilandAddress]);
      return {
        name: token.symbol,
        balance: BigInt(balance.toString()) / BigInt(10 ** 18),
        approved: BigInt(approved.toString()) / BigInt(10 ** 18),
        address: token.address,
      };
    })
  );

  // Build the display parts using token names.
  const tokenBalances = balancesData.map((t) => `<${t.name}> \n Balance: ${t.balance} \n Address: ${t.address} </${t.name}>`).join("\n\n\n");

  let res = `

  Token Balances:
  ${tokenBalances}

  `;
  console.log('res', res)
  return res;
};

export const get_nukeable_lands_str = async () => {
  let lands = await fetchGraphQL(
    env.GRAPHQL_URL + "/graphql",
    nuke_query,
    {}
  ).then((res: any) => res?.ponziLandLandModels?.edges?.map((edge: any) => edge?.node));
  console.log('lands', lands)

  if (!lands) {
    return "there are no nukeable lands"
  }

  return lands;
}

export const get_lands_str = async () => {
  let lands = await fetchGraphQL(
    env.GRAPHQL_URL + "/graphql",
    land_query,
    {}
  ).then((res: any) => res?.ponziLandLandModels?.edges?.map((edge: any) => edge?.node));

  console.log('lands', lands)
  if (!lands) {
    return "You do not own any lands"
  }

  let tokens = await getAllTokensFromAPI();

  let nuke_time = await Promise.all(lands.map((land: any) => {
    let info = ponziLandContract.call("get_time_to_nuke", [land.location]);
    return info;
  }));

  let yields = await Promise.all(lands.map(async (land: any) => {
    return await calculateLandYield(land, tokens);
  }));

  console.log('yields', yields)

  let land_str = lands.map((land: any, index: number) => 
    `location: ${BigInt(land.location).toString()} - 
    Token: ${getTokenData(land.token_used, tokens)?.symbol}
    Remaining Stake Time: ${nuke_time[index]/BigInt(60)} minutes


    Yield: ${yields[index]}
  
    Listed Price: ${BigInt(land.sell_price).toString()}
  `).join("\n");

  console.log('land_str', land_str)
  return land_str;
}

export const get_claims_str = async () => {
  let lands = await fetchGraphQL(
    env.GRAPHQL_URL + "/graphql",
    land_query,
    {}
  ).then((res: any) => res?.ponziLandLandModels?.edges?.map((edge: any) => edge?.node));

  if (!lands) {
    return "You do not own any lands, so you have no claims"
  }

  let land_claims = await Promise.all(lands.map((land: any) => {
    return ponziLandContract.call("get_next_claim_info", [land.location]);
  }));

  console.log('land_claims', land_claims)

  let tokens = await getAllTokensFromAPI();

  // Flatten the claims data and format it
  let claims = lands.map((land: any, index: number) => {
    let landClaims = land_claims[index]
      .map((claim: any) => {
        // Find matching contract for the token
        for (let contract of tokens) {
          if (BigInt(claim.token_address) === BigInt(contract.address)) {
            return `    ${contract.symbol}: ${BigInt(claim.amount)}`;
          }
        }
        return '';
      })
      .filter((claim: any) => claim !== '')
      .join('\n');

    return `Land ${BigInt(land.location).toString()}:\n${landClaims}`;
  }).join('\n\n');


  console.log('claims_str', claims)

  return claims;
}

export const get_auctions_str = async () => {
  let auctions = await fetchGraphQL(
    env.GRAPHQL_URL + "/graphql",
    auction_query,
    {}
  ).then((res: any) => res?.ponziLandAuctionModels?.edges?.map((edge: any) => edge?.node));

  if (!auctions) {
    return "There are no auctions"
  }

  let initial_prices = await Promise.all(auctions.map((auction: any) => {
    let current_price = provider.callContract(
        {
            contractAddress: ponzilandAddress,
            entrypoint: "get_current_auction_price",
            calldata: [auction.land_location]
        }
    ).then((res: any) => BigInt(res[0])/BigInt(10**18));
    return current_price;
  }));

  auctions.forEach((auction: any, index: number) => {
    auction.current_price = initial_prices[index];
  });
  
  let auction_str = auctions.map((auction: any) => 
    `location: ${BigInt(auction.land_location).toString()} - Current Price: ${auction.current_price}`).join("\n");

  return auction_str;
}

export const get_neighbors_str = async (location: number) => {

  let neighbors: Array<CairoCustomEnum> = await viewContract.get_neighbors(location);

  let tokens = await getAllTokensFromAPI();

  let res = neighbors.map((temp: CairoCustomEnum) => {
    if (temp.activeVariant() == "Land"){
      let neighbor = temp.unwrap();
      return `Location: ${BigInt(neighbor.location).toString()} - Sell Price: ${BigInt(neighbor.sell_price).toString()} - Token: ${getTokenData(neighbor.token_used, tokens)?.symbol}`;
    } else if (temp.activeVariant() == "Auction") {
      let neighbor = temp.unwrap();
      return `Location: ${BigInt(neighbor.land_location).toString()} - Auction`;
    }
    else {
      return ``
    }
  }).join("\n");

  console.log('get_all_lands_str', await get_all_lands_str());

  return res;
}

export const get_all_lands_str = async () => {
  let lands = await fetchGraphQL(
    env.GRAPHQL_URL + "/graphql",
    "query { ponziLandLandModels(first: 50) { edges { node { location token_used sell_price owner } } } }",
    {}
  ).then((res: any) => res?.ponziLandLandModels?.edges?.map((edge: any) => edge?.node));

  let tokens = await getAllTokensFromAPI();

  lands = lands.filter((land: any) => land.owner != address);
  console.log('lands', lands)

  let land_str = lands.map((land: any) => ` Owner: ${land.owner} Location: ${BigInt(land.location).toString()} Token: ${getTokenData(land.token_used, tokens)?.symbol} sell price: ${formatTokenAmount(BigInt(land.sell_price))}`).join("\n");
  return land_str;
}

export const get_auction_yield_str = async (location: number) => {
  let neighbors = await viewContract.get_neighbors(location);
  let tokens = await getAllTokensFromAPI();
  let income = BigInt(0);

  let neighbor_tax_rates = await Promise.all(neighbors.map(async (neighbor: any) => {
    if (neighbor.activeVariant() == "Land"){
      let value = neighbor.unwrap();
      return await viewContract.get_tax_rate_per_neighbor(value.location);
    }
  }));

  let detailed_income = "";

  neighbors.forEach((neighbor: any, index: number) => {
    if (neighbor.activeVariant() == "Land"){

        let value = neighbor.unwrap();
        console.log('value', value)
      let neighbor_yield = neighbor_tax_rates[index];
      let neighbor_token = getTokenData(value.token_used, tokens);
      if (!neighbor_token){
        console.log("No token?")
      }
      else{
        // Yield is in estark
        if (!neighbor_token.ratio){
          income += BigInt(neighbor_yield);
          detailed_income += `
          Location: ${value.location} - Yield: ${formatTokenAmount(BigInt(neighbor_yield))} estark
          `;
        }
        else{
          let adjusted_yield = Math.floor(Number(neighbor_yield) / neighbor_token.ratio);
          income += BigInt(adjusted_yield);
          detailed_income += `
          Location: ${value.location} - Yield: ${formatTokenAmount(BigInt(neighbor_yield))} ${neighbor_token.symbol} (${formatTokenAmount(BigInt(adjusted_yield))} estark)
          `;
        }
      }
    }
  });

  let max_price = (Number(income) * 8) / .02;
  return `
  
  PotentialIncome: ${formatTokenAmount(income)} estark
  <detailed_income>
  ${detailed_income}
  </detailed_income>;

  Maximum Listing Price For Profit: ${formatTokenAmount(BigInt(Math.floor(max_price)))} estark. (If you list for more than this you will lose money)
  Only bid on auctions if you can list it for less than this, but more than the auction price. 
  `;
}


export const get_owned_lands = async () => {
  let lands = await fetchGraphQL(
    env.GRAPHQL_URL + "/graphql",
    land_query,
    {}
  ).then((res: any) => res?.ponziLandLandModels?.edges?.map((edge: any) => edge?.node));

  if (!lands) {
    return "You do not own any lands, so you have no claims"
  }

  return lands;
}

export const calculateLandYield = async (land: any, tokens: TokenPrice[]) => {
  let token = getTokenData(land.token_used, tokens);
  let tax_rate = await viewContract.get_tax_rate_per_neighbor(land.location);
  console.log('tax rate', tax_rate)
  if (token?.ratio){
    tax_rate = tax_rate * token.ratio;
  }
  let neighbors = await viewContract.get_neighbors(land.location);
  let income = BigInt(0);

  let neighbor_tax_rates = await Promise.all(neighbors.map(async (neighbor: any) => {
    if (neighbor.activeVariant() == "Land"){
      let value = neighbor.unwrap();
      return await viewContract.get_tax_rate_per_neighbor(value.location);
    }
  }));

  let detailed_income = "";

  console.log('tax_rate', tax_rate)
  neighbors.forEach((neighbor: any, index: number) => {
    if (neighbor.activeVariant() == "Land"){

        let value = neighbor.unwrap();
        console.log('value', value)
      let neighbor_yield = neighbor_tax_rates[index];
      let neighbor_token = getTokenData(value.token_used, tokens);
      if (!neighbor_token){
        console.log("No token?")
      }
      else{
        // Yield is in estark
        if (!neighbor_token.ratio){
          income += BigInt(neighbor_yield);
          detailed_income += `
          Location: ${value.location} - Yield: ${formatTokenAmount(BigInt(neighbor_yield))} estark
          `;
        }
        else{
          let adjusted_yield = Math.floor(Number(neighbor_yield) / neighbor_token.ratio);
          income += BigInt(adjusted_yield);
          detailed_income += `
          Location: ${value.location} - Yield: ${formatTokenAmount(BigInt(neighbor_yield))} ${neighbor_token.symbol} (${formatTokenAmount(BigInt(adjusted_yield))} estark)
          `;
        }
      }
    }
  });

  console.log('income', income)

  if (tax_rate == 0){
    return 0;
  }
  let adjusted_income = BigInt(income) / BigInt(tax_rate);

  console.log('adjusted income', adjusted_income)

  return `
  Income: ${formatTokenAmount(income)} estark
  <detailed_income>
  ${detailed_income}
  </detailed_income>
  Tax Rate: ${formatTokenAmount(tax_rate)}
  Net Yield: ${adjusted_income * BigInt(100)}% ( + ${formatTokenAmount(income - tax_rate)} estark)
  `;

}