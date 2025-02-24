import { task } from "hardhat/config";
import { SEPARATOR } from "../utils/constants";
import { BytesLike } from "ethers";
import { loadDeploymentAddress } from "../utils/utils";


task("sendMessage", "Proposes an operation")
    .addParam("destchainid", "The destination chain ID")
    .addParam("destaddress", "The destination address")
    .addParam("message", "The message to send")
    .setAction(async (taskArgs, {network, ethers}) => {
        const coder = ethers.AbiCoder.defaultAbiCoder();

        const netname = network.name
        console.log(`Using network: ${netname}`)
        
        const [signer] = await ethers.getSigners();
        console.log("signer: ", signer.address);

        let destAddress_bytes;
        if (taskArgs.destaddress.length == 42 && taskArgs.destaddress.startsWith("0x")) {
            destAddress_bytes = coder.encode(
                ["address"],
                [taskArgs.destaddress]
            );
        } else {
            const solanaPublicKey = Buffer.from(require("bs58").decode(taskArgs.destaddress));
            if (solanaPublicKey.length !== 32) {
                throw new Error("Invalid Solana address");
            }

            destAddress_bytes = coder.encode(
                ["bytes32"], 
                [solanaPublicKey]
            );
        }

        const blockFinalizationOption = 0
        const customGasLimit = 272200
        
        const address = await loadDeploymentAddress(netname, "MessengerProtocol");
        const instance = await ethers.getContractAt("MessengerProtocol", address, signer);
        const tx = await instance.sendMessage(
            taskArgs.destchainid,
            blockFinalizationOption,
            customGasLimit,
            destAddress_bytes,
            taskArgs.message,
            {   
                value: 1000000,
            }
        )
        const rec = await tx.wait();
        console.log(SEPARATOR)
        console.log(rec)
        console.log(SEPARATOR)
        console.log(`Operation proposed to chain ${taskArgs.destchainid} to address ${taskArgs.destaddress} with message: "${taskArgs.message}"`);
    });
