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

        const destAddress_bytes = coder.encode(
            ["address"],
            [taskArgs.destaddress]
        );
        
        const address = await loadDeploymentAddress(netname, "MessengerProtocol");
        const instance = await ethers.getContractAt("MessengerProtocol", address, signer);
        const tx = await instance.sendMessage(
            taskArgs.destchainid,
            3,
            0,
            destAddress_bytes,
            taskArgs.message,
            {value: 100000}
        )
        const rec = await tx.wait();
        console.log(SEPARATOR)
        console.log(rec)
        console.log(SEPARATOR)
        console.log(`Operation proposed to chain ${taskArgs.destchainid} to address ${taskArgs.destaddress} with message: "${taskArgs.message}"`);
    });
