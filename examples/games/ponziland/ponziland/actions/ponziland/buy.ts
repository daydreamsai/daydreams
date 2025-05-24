import { action } from "@daydreamsai/core"
import { StarknetChain } from "@daydreamsai/defai"
import { z } from "zod"
import { CallData, type Call, Contract, cairo, type Abi } from "starknet";
import manifest from "../../../contracts/view_manifest_sepolia.json";
import ponziland_manifest from "../../../contracts/ponziland_manifest_sepolia.json";


export const buy = (chain: StarknetChain) => action({
    name: "buy",
    description: "Buy a land",
    schema: z.object({
        land_location: z.string().describe("Location of the land to buy"),
        token_for_sale: z.string().describe("Contract address of the token to be used for the purchase. This should be a token in your wallet that you have enough of."),
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

        let land = await ponziLandContract.get_land(data.land_location);

        let token = land.token_for_sale;
        let price = land.sell_price;

        if (token == data.token_for_sale) {
            let approve_call: Call = {contractAddress: data.token_for_sale, entrypoint: "approve", calldata: CallData.compile({spender: ponziland_address, amount: cairo.uint256(price)})};
            calls.push(approve_call);
        }
        else {
            let token_call: Call = {contractAddress: data.token_for_sale, entrypoint: "approve", calldata: CallData.compile({spender: ponziland_address, amount: cairo.uint256(data.amount_to_stake)})};
            let sale_call: Call = {contractAddress: token, entrypoint: "approve", calldata: CallData.compile({spender: ponziland_address, amount: cairo.uint256(price)})};
            calls.push(token_call);
            calls.push(sale_call);
        }


        let buy_call: Call = {contractAddress: ponziland_address, entrypoint: "buy", calldata: CallData.compile({land_location: data.land_location, token_for_sale: data.token_for_sale, sell_price: cairo.uint256(data.sell_price), amount_to_stake: cairo.uint256(data.amount_to_stake)})};

        calls.push(buy_call);


        let res = await chain.write(calls);

        return res;
    }
})