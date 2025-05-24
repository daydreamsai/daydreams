import { action } from "@daydreamsai/core"
import { StarknetChain } from "@daydreamsai/defai"
import { z } from "zod"
import { CallData, type Call, type Abi } from "starknet";
import { getLiquidityPoolFromAPI } from "../../utils/ponziland_api"
import { decodeTokenTransferEvents } from "../../utils/utils";
import manifest from "../../../contracts/view_manifest_sepolia.json";
import ponziland_manifest from "../../../contracts/ponziland_manifest_sepolia.json";
import { get_owned_lands } from "../../utils/querys";

export const claim_all = (chain: StarknetChain) => action({
    name: "claim_all",
    description: "Claim the taxes from all your lands",
    schema: z.object({
    }),
    async handler(data, ctx, agent) {

        let calls = [];


        let estark_address = "0x071de745c1ae996cfd39fb292b4342b7c086622e3ecf3a5692bd623060ff3fa0";
        let ponziland_address = ponziland_manifest.contracts[0].address;

        let lands = await get_owned_lands();

        let locations = lands.map((land: any) => land.location);

        let claim_call: Call = {contractAddress: ponziland_address, entrypoint: "claim_all", calldata: CallData.compile({locations: locations})};
        calls.push(claim_call);

        let res = await chain.write(calls);

        let transfers = await decodeTokenTransferEvents(res);

        if (!transfers) {
            return "No transfers. Do you own any lands?"
        }
        return `
        tx hash: ${res.transaction_hash}
        
        claim result: ${res.execution_status}
        
        Transfers: ${JSON.stringify(transfers)}`;
    }
})