import { task } from "hardhat/config";
import { loadDeploymentAddress } from "../scripts/utils";

task("sendTokens", "Initiates token transfer through the bridge")
    .addParam("tochainid", "Destination chain id")
    .addParam("to", "Receiver address")
    .addParam("amount", "Amount to transfer")
    .addParam("destaddress", "Token address in the destination network")
    .setAction(async (taskParams, {network, ethers}) => {
        const [signer] = await ethers.getSigners();
        console.log("signer: ", signer.address);

        const address = loadDeploymentAddress(network.name, "ExampleToken");
        const tokenBridge = await ethers.getContractAt("ExampleToken", address, signer);

        const encodedDestAddress = ethers.AbiCoder.defaultAbiCoder().encode(
            ["address"],
            [taskParams.destaddress]
        );

        const destAddress = await tokenBridge.knownOrigins(taskParams.tochainid);
        if (destAddress.toLowerCase() != encodedDestAddress.toLowerCase()) {
            await tokenBridge.setOrigins(
                [taskParams.tochainid],
                [encodedDestAddress]
            );    
        }

        const tx = await tokenBridge.bridge(
            taskParams.tochainid,
            taskParams.to,
            taskParams.amount,
            3,
            60000n,
            {   
                value: 10000000,
            }
        );
        const receipt = await tx.wait();
        console.log("\n\n", receipt);

        console.log("\n\n", `${taskParams.amount} tokens sent to chain ${taskParams.tochainid} to address ${taskParams.to} from chain ${network.config.chainId} from address ${signer.address}`);
    });