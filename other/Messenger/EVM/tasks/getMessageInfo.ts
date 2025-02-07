import { task } from "hardhat/config";
import fs from "fs";
import _ from "lodash";
import chalk from "chalk";
import { getMessageStatus } from "../msgStatus";
import { SEPARATOR } from "../../utils/constants";
import { Master, MessageData } from "../../typechain-types";

const yellow = chalk.yellow;
const green = chalk.green;

async function loadDeploymentAddress(network: string, contractName: string) {
    const filePath = `./addresses/${network}/${contractName}.json`;
    console.log(`Deployment address loaded from
        ${filePath}   
    `)
    return JSON.parse(fs.readFileSync(filePath, "utf8")).address;
}

task("getMsgData", "Get full message information from master SC")
    // .addOptionalParam("msghash", "Photon msg hash", undefined, types.string)
    .addParam("msghash", "EIB msg hash")
    .setAction(async ( taskArgs, {network, ethers}) => {
        const netname = network.name;
        console.log("Parsing for network: ", netname, "\n")

        const msgHash = taskArgs.msghash;
        console.log("\nProcessing hash:", msgHash)

        const masterAddr = await loadDeploymentAddress(netname, "Master");
        const msgDataAddr = await loadDeploymentAddress(netname, "MessageData");

        const master: Master = await ethers.getContractAt("Master", masterAddr);
        const msgData: MessageData = await ethers.getContractAt("MessageData", msgDataAddr);

        console.log("Contracts created")

        const data = await msgData.getMsg(msgHash);
        console.log("Message full: ", data)

        const status = data[0]
        const globalNonce = data[1]

        const msg = data[2]
        const proposal = msg[0]
        const srcChainData = msg[1]

        // console.log("SRC:", msg[1])

        // console.log(proposal)
        // console.log(srcChainData)

        const destChain = proposal[0]
        const nativeAmount = proposal[1]
        const selectorSlot = proposal[2]
        const senderAddr = proposal[3]
        const destAddr = proposal[4]
        const payload = proposal[5]
        const reserved = proposal[6]
        const agentParams = proposal[7]

        const res = getMessageStatus(status);
        console.log("Got status")

        console.log(`
            ${yellow("MSG DATA:")}
            ${SEPARATOR}

            Message of hash: 
            ${msgHash}

            - ${green("GLOBAL")} -
            Status: ${status} | ${res!.statusString} | ${res!.zone} zone
            Global nonce: ${globalNonce}

            - ${green("Proposal")} - 
            Destination chain:      ${destChain}
            Native amount:          ${nativeAmount}
            Selector slot:          ${selectorSlot}
            Sender address:         ${senderAddr}
            Destination address:    ${destAddr}
            Payload:                ${payload}
            Reserved:               ${reserved}

            - ${green("Source chain")} - 
            Location:               ${srcChainData[0]}
            Source tx hash:         ${srcChainData[1]}
            ${SEPARATOR}
        `)

        if (status <= 1n) {
            return            
        }

        const msgConsensusData = await master.msgConsensusData(msgHash);
        const proposedBy =  msgConsensusData

        const transimissionSigLen = await master.getTSignaturesLength(msgHash);
        const executionSigLen = await master.getESignaturesLength(msgHash);

        const superApproved = await master.getSuperApprovals(msgHash);

        console.log(`
            ${yellow("CONSENSUS DATA:")}
            ${SEPARATOR}

            Proposed by:            ${proposedBy}
            Tranmission signatures: ${transimissionSigLen}
            Execution signatures:   ${executionSigLen}
            Super approvals:        ${superApproved}

            ${SEPARATOR}
        `)

        if (status <= 4n) {
            return 
        }

        const totalTries = await master.msgExecutionData(msgHash);
        const executions = await master.getExecutionAttempts(msgHash);
        console.log(`
            ${yellow("EXECUTION DATA:")}
            ${SEPARATOR}   

            Total tries:            ${totalTries}
            Executions:             ${executions}

            ${SEPARATOR}
        `)
    });


