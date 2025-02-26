import { task } from "hardhat/config";
import fs from "fs";
import { SEPARATOR } from "../utils/constants";
import { getMessageStatus } from "./msgStatus";

task("getMsgStatusByHash", "Returns message status by given TEIB hash")
    .addParam("hash", "TEIB chain tx hash")
    .setAction(async (taskArgs, {network, ethers}) => {
        const coder = ethers.AbiCoder.defaultAbiCoder();

        const [signer] = await ethers.getSigners();
        console.log(`signer: ${signer.address}`);

        const netname = network.name
        console.log(`Using network: ${netname}`)

        const filePath = "./node_modules/@entangle-labs/uip-contracts/addresses/testnet/teib/MessageData.json"
        const address = JSON.parse(fs.readFileSync(filePath, "utf8")).address;
        const instance = await ethers.getContractAt("MessageData", address, signer);
        
        const result = await instance.getMsgStatusByHash(taskArgs.hash)
        const status = getMessageStatus(result)
        
        console.log(SEPARATOR)
        console.log(`Current status of message with hash ${taskArgs.hash}
            \nStatus: ${status.statusString}
            \nZone: ${status.zone}`)
        console.log(SEPARATOR)
    });