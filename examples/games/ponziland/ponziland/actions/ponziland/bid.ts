import { action } from "@daydreamsai/core"
import { StarknetChain } from "@daydreamsai/defai"
import { z } from "zod"
import { CallData, type Call, Contract, cairo, type Abi } from "starknet";
import manifest from "../../../contracts/view_manifest_sepolia.json";
import ponziland_manifest from "../../../contracts/ponziland_manifest_sepolia.json";


export const bid = (chain: StarknetChain) => action({
    name: "bid",
    description: "Bid on an auction",
    schema: z.object({
        land_location: z.string().describe("Location of the land to bid on"),
        token_for_sale: z.string().describe("The *Contract address* of the token to be used for the stake and new listing. This can be found by querying your balances. This should be a token in your wallet that you have enough of."),
        sell_price: z.string().describe("The price the land will be listed for after the auction ends (in wei, so x10^18)"),
        amount_to_stake: z.string().describe("The amount to be staked to pay the lands taxes (in wei, so x10^18)"),
    }),
    async handler(data, ctx, agent) {

        let calls = [];


        let estark_address = "0x071de745c1ae996cfd39fb292b4342b7c086622e3ecf3a5692bd623060ff3fa0";
        let ponziland_address = ponziland_manifest.contracts[0].address;

        let {abi: token_abi} = await chain.provider.getClassAt(data.token_for_sale);
        let {abi: estark_abi} = await chain.provider.getClassAt(estark_address);

        let ponziLandContract = (new Contract(ponziland_manifest.contracts[0].abi, ponziland_address, chain.provider)).typedv2(ponziland_manifest.contracts[0].abi as Abi);

        let price = await ponziLandContract.get_current_auction_price(data.land_location);

        if (data.token_for_sale == estark_address) {
            let estark_call: Call = {contractAddress: estark_address, entrypoint: "approve", calldata: CallData.compile({spender: ponziland_address, amount: cairo.uint256(data.amount_to_stake + price)})};
            calls.push(estark_call);
        }
        else {
            let estark_call: Call = {contractAddress: estark_address, entrypoint: "approve", calldata: CallData.compile({spender: ponziland_address, amount: cairo.uint256(price)})};
            let stake_approve_call: Call = {contractAddress: data.token_for_sale, entrypoint: "approve", calldata: CallData.compile({spender: ponziland_address, amount: cairo.uint256(data.amount_to_stake)})};
            calls.push(estark_call);
            calls.push(stake_approve_call);
        }


        let bid_call: Call = {contractAddress: ponziland_address, entrypoint: "bid", calldata: CallData.compile({land_location: data.land_location, token_for_sale: data.token_for_sale, sell_price: cairo.uint256(data.sell_price), amount_to_stake: cairo.uint256(data.amount_to_stake)})};

        calls.push(bid_call);


        let res = await chain.write(calls);

        return res;
    }
})