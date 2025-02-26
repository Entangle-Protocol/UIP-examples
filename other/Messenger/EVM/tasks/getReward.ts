import { task } from "hardhat/config";
import fs from "fs";
import { SEPARATOR } from "../utils/constants";

task("getReward", "Returns agents reward from message with given TEIB tx hash")
    .addParam("hash", "TEIB chain tx hash")
    .setAction(async (taskArgs, {network, ethers}) => {
        const [signer] = await ethers.getSigners();
        console.log(`signer: ${signer.address}`);

        const netname = network.name
        console.log(`Using network: ${netname}`)

        const filePath = "./node_modules/@entangle-labs/uip-contracts/addresses/testnet/teib/MessageData.json"
        const address = JSON.parse(fs.readFileSync(filePath, "utf8")).address;
        const instance = await ethers.getContractAt("MessageData", address, signer);
        
        const reward = await instance.getReward(taskArgs.hash)
        
        console.log(SEPARATOR)
        console.log(`Current status of message with hash ${taskArgs.hash}
            \nReward: ${reward}`)
        console.log(SEPARATOR)
    });