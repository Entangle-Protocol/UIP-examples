import { task } from "hardhat/config";
import fs from "fs";
import { SEPARATOR } from "../utils/constants";

task("getChainIds", "Returns source and destination chain ids from message with given TEIB tx hash")
    .addParam("hash", "TEIB chain tx hash")
    .setAction(async (taskArgs, {network, ethers}) => {
        const [signer] = await ethers.getSigners();
        console.log(`signer: ${signer.address}`);

        const netname = network.name
        console.log(`Using network: ${netname}`)

        const filePath = "./node_modules/@entangle-labs/uip-contracts/addresses/testnet/teib/MessageData.json"
        const address = JSON.parse(fs.readFileSync(filePath, "utf8")).address;
        const instance = await ethers.getContractAt("MessageData", address, signer);
        
        const srcId = await instance.getSrcChainId(taskArgs.hash)
        const destId = await instance.getDestChainId(taskArgs.hash)
        
        console.log(SEPARATOR)
        console.log(`Current status of message with hash ${taskArgs.hash}
            \nSource chain id: ${srcId}
            \nDestination chain id: ${destId}`)
        console.log(SEPARATOR)
    });