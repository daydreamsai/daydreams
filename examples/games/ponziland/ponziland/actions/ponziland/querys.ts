import { action } from "@daydreamsai/core"
import { StarknetChain } from "@daydreamsai/defai"
import { type ActionCall, type Agent } from "@daydreamsai/core"
import { z } from "zod"
import { CONTEXT } from "../../contexts/ponziland-context"
import { get_auctions_str, get_balances_str, get_claims_str, get_lands_str, get_neighbors_str, get_nukeable_lands_str, get_auction_yield_str, get_all_lands_str } from "../../utils/querys"

export const get_auctions = (chain: StarknetChain) => action({
    name: "get-auctions",
    description: "Get all of the active auctions",
    schema: z.object({}),
    async handler(data: {}, ctx: any, agent: Agent) {
        
       //todo
       let auctions = await get_auctions_str()

       console.log('auctions', auctions)

       return auctions

    }
});

export const get_owned_lands = (chain: StarknetChain) => action({
    name: "get-owned-lands",
    description: "Get all of your lands in ponziland. Remember this expects no arguments. The content for this action should always be {}",
    schema: z.object({}),
    async handler(data: {}, ctx: any, agent: Agent) {
        
       //todo
       let lands = await get_lands_str()

       console.log('lands str', lands)

       if (lands == "") {
        return "You do not own any lands"
       }

       return lands

    }
});

export const get_claims = (chain: StarknetChain) => action({
    name: "get-claims",
    description: "Get all of the claims in ponziland. Remember this expects no arguments",
    schema: z.object({}),
    async handler(data: {}, ctx: any, agent: Agent) {
        
       //todo
       let claims = await get_claims_str()

       return claims

    }
});

export const get_neighbors = (chain: StarknetChain) => action({
    name: "get-neighbors",
    description: "Get all of your lands neighbors in ponziland. Remember this expects a location argument",
    schema: z.object({location: z.number()}),
    async handler(data: {location: number}, ctx: any, agent: Agent) {

       //todo
       let neighbors = await get_neighbors_str(data.location);

       if (neighbors == "") {
        return "Failed to get neighbors for location " + location + ". land may not exist."
       }

       return neighbors

    }
});

export const get_all_lands = (chain: StarknetChain) => action({
    name: "get-all-lands",
    description: "Get all of the lands in ponziland",
    schema: z.object({}),
    async handler(data: {}, ctx: any, agent: Agent) {

        let lands = await get_all_lands_str()

        console.log('lands', lands)

        return lands
        
    }
})

export const get_context = (chain: StarknetChain) => action({
    name: "get-context",
    description: "Get general information about Ponziland. This should be called first before attempting any other ponziland actions. The content for this action should always be {}",
    schema: z.object({}),
    async handler(data: {}, ctx: any, agent: Agent) {

        let res = await CONTEXT();
        console.log('res', res)
        return res

    }
})  

export const get_auction_yield = (chain: StarknetChain) => action({
    name: "get-auction-yield",
    description: "Get the potential yield of a land that is up for auction. This expects a location argument. This should be called to evaluate auctions before deciding to bid or not,.",
    schema: z.object({location: z.number()}),
    async handler(data: {location: number}, ctx: any, agent: Agent) {

        let info = await get_auction_yield_str(data.location);

        return info;

    }
})
