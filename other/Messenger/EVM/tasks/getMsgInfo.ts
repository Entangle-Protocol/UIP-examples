import { task } from "hardhat/config";
import fs, { statSync } from "fs";
import { SEPARATOR } from "../utils/constants";
import chalk from "chalk";
import { getMessageStatus } from "./msgStatus";

const yellow = chalk.yellow;
const green = chalk.green;

task("getMsgInfo", "Returns full message info by given TEIB hash")
    .addParam("hash", "TEIB chain tx hash")
    .setAction(async (taskArgs, {network, ethers}) => {
        const [signer] = await ethers.getSigners();
        console.log(`signer: ${signer.address}`);

        const netname = network.name
        console.log(`Using network: ${netname}`)

        const filePath = "./node_modules/@entangle-labs/uip-contracts/addresses/testnet/teib/MessageData.json"
        const address = JSON.parse(fs.readFileSync(filePath, "utf8")).address;
        const instance = await ethers.getContractAt("MessageData", address, signer);
        
        const msg = await instance.getMsg(taskArgs.hash)

        const statusCode = msg[0]
        const status = getMessageStatus(statusCode)
        const globalNonce = msg[1]
        
        const msgData = msg[2]
        const proposal = msgData[0]
        const srcChainData = msgData[1]

        const destChainId = proposal[0]
        const nativeAmount = proposal[1]
        const selectorSlot = proposal[2]
        const senderAddr = proposal[3]
        const destAddr = proposal[4]
        const payload = proposal[5]
        const reserved = proposal[6]
        const transmitterParams = proposal[7]
        const blockFinalizationOption = parseInt(transmitterParams.substring(2, 66), 16)
        const customGasLimit = parseInt(transmitterParams.substring(66, 130), 16)

        const location = srcChainData[0]
        const srcOpTxId = srcChainData[1]
        
        console.log(SEPARATOR)
        console.log(`
            ${yellow("MSG DATA:")}
            ${SEPARATOR}

            Message of hash: 
            ${taskArgs.hash}

            - ${green("GLOBAL")} -
            Status: ${statusCode} | ${status!.statusString} | ${status!.zone} zone
            Global nonce: ${globalNonce}

            - ${green("Proposal")} - 
            Destination chain:          ${destChainId}
            Native amount:              ${nativeAmount}
            Selector slot:              ${selectorSlot}
            Sender address:             ${senderAddr}
            Destination address:        ${destAddr}
            Payload:                    ${payload}
            Reserved:                   ${reserved}
            Block finalization option:  ${blockFinalizationOption}
            Custom gas limit:           ${customGasLimit}

            - ${green("Source chain")} - 
            Location:               ${location}
            Source tx hash:         ${srcOpTxId[0]}
            ${SEPARATOR}
        `)
        console.log(SEPARATOR)
    });