import { task } from "hardhat/config";
import fs from "fs";

task("getReward", "Returns agents reward from message with given message hash")
    .addParam("hash", "message hash")
    .setAction(async (taskArgs, { ethers }) => {
        const [signer] = await ethers.getSigners();
        console.log(`signer: ${signer.address}`);

        const filePath = "./node_modules/@entangle-labs/uip-contracts/addresses/testnet/teib/MessageData.json"
        const address = JSON.parse(fs.readFileSync(filePath, "utf8")).address;
        const instance = await ethers.getContractAt("MessageData", address, signer);
        
        const reward = await instance.getReward(taskArgs.hash)
        
        console.log(`Current status of message with hash ${taskArgs.hash}
            \nReward: ${reward}`)
    });
