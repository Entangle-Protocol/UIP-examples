import { task } from "hardhat/config";
import { constructProposal, createMsgHash, getSrcChainData, readProposeEvents, convertRawSrcChainData } from "../scripts/proposalParser";
import { TransactionReceipt } from "ethers";
import { getReceipt } from "../scripts/proposalParser";
import { MessageLib } from "../typechain-types/@entangle-labs/uip-contracts/contracts/endpoint/Endpoint";
import _ from "lodash";

task("getMsgHash", "Get proposal from endpoint and find message hash")
    .addParam("hash", "Source EVM tx hash")
    .setAction(async (taskArgs, {userConfig, network, ethers}) => {
        const netname = network.name;
        console.log("Parsing for network: ", netname, "\n")

        let hash: string
        let msgHashes: string[] = [];

        hash = taskArgs.hash;

        const receipt: TransactionReceipt = await getReceipt(ethers, hash!);

        const srcChainData = await getSrcChainData(ethers, userConfig, netname, receipt);
        const proposeEvents = await readProposeEvents(ethers, receipt);

        console.log("Proposals found in receipt: ", proposeEvents.length)
        console.log("\nSource Chain Data:", srcChainData)

        let proposals: MessageLib.ProposalStruct[] = [];
        for (const event of proposeEvents) {
            console.log(event)
            const proposal: MessageLib.ProposalStruct = constructProposal(event.args);
            console.log("\n[Proposal created]: ", proposal)
            proposals.push(proposal);
        }

        for (const proposal of proposals) {
            const packedSrcChainData = convertRawSrcChainData(srcChainData)
            const msgHash = await createMsgHash(ethers, proposal, packedSrcChainData);
            msgHashes.push(msgHash);
        }

        if (msgHashes.length == 0) {
            throw new Error("No hashes available");
        } else {
            console.log("\nHashes found:", msgHashes)
        }
    })
