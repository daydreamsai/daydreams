import { action, type Agent } from "@daydreamsai/core"
import { StarknetChain } from "@daydreamsai/defai"
import { z } from "zod"
import { get_balances_str } from "../utils/querys"



export const get_balances = (chain: StarknetChain) => action({
    name: "get-balances",
    description: "Get all of your starknet token balances. This should always be called before attempting to spend tokens",
    schema: z.object({}),
    async handler(data: {}, ctx: any, agent: Agent) {
        
       //todo
       let balances = await get_balances_str();

        return balances

    }

})
