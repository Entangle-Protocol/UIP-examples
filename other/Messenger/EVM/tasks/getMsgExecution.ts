import { task } from "hardhat/config";
import fs from "fs";
import { SEPARATOR } from "../utils/constants";

task("getMsgExecution", "Checking Message Execution on Destination Endpoint")
    .addParam("hash", "TEIB tx hash")
    .setAction(async (taskArgs, {network, ethers}) => {
        const [signer] = await ethers.getSigners();
        console.log(`signer: ${signer.address}`);

        const netname = network.name
        console.log(`Using network: ${netname}`)

        const filePath = `./node_modules/@entangle-labs/uip-contracts/addresses/testnet/${netname}/Endpoint.json`
        const address = JSON.parse(fs.readFileSync(filePath, "utf8")).address;
        const instance = await ethers.getContractAt("Endpoint", address, signer);
        
        const code = await instance.messagesExecuted(taskArgs.hash)
        let status = ""
        switch(code) {
            case 0n: {
                status = "Does not exist"
                break
            }
            case 1n: {
                status = "Executed"
                break
            }
            case 2n: {
                status = "Protocol failed"
                break
            }
        }
        
        console.log(SEPARATOR)
        console.log(`Current execution status of message with hash ${taskArgs.hash}
            \nExecution status: ${status}`)
        console.log(SEPARATOR)
    });