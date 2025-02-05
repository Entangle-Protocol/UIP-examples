import { task } from "hardhat/config";
import { loadDeploymentAddress } from "../scripts/utils";

task("sendTokens", "Initiates token transfer through the bridge")
    .addParam("tochainid", "Destination chain id")
    .addParam("from", "Sender address")
    .addParam("to", "Receiver address")
    .addParam("amount", "Amount to transfer")
    .setAction(async (taskParams, {network, ethers}) => {
        const [signer] = await ethers.getSigners();
        console.log("signer: ", signer.address);

        const encodedReceiverAddress = ethers.AbiCoder.defaultAbiCoder().encode(
            ["address"],
            [taskParams.to]
        );
        const marker = ethers.hexlify(ethers.randomBytes(32));

        const address = loadDeploymentAddress(network.name, "EntangleToken");
        const tokenBridge = await ethers.getContractAt("EntangleToken", address, signer);

        const minBridgeAmount = await tokenBridge.minBridgeAmounts(taskParams.tochainid);
        if (minBridgeAmount == 0n) {
            await tokenBridge.setMinBridgeAmount(
                [taskParams.tochainid], 
                [1]
            );    
        }

        const isKnownOrigin = await tokenBridge.knownOrigins(signer.address);
        if (!isKnownOrigin) {
            await tokenBridge.setOrigins(
                [signer.address],
                [true]
            );    
        }

        const tx = await tokenBridge.bridge(
            taskParams.tochainid,
            taskParams.from,
            encodedReceiverAddress,
            taskParams.amount,
            marker,
            3,
            0,
            {   
                value: 1000000,
                gasLimit: 2000000
            }
        );
        const receipt = await tx.wait();
        console.log("\n\n", receipt);

        console.log("\n\n", `${taskParams.amount} tokens sent to chain ${taskParams.tochainid} from address ${taskParams.from} to address ${taskParams.to}`);
    });

task("receiveTokens", "Receive tokens sent through the bridge")
    .addParam("data", "Endoded params")
    .setAction(async (taskParams, { network, ethers }) => {
        const [signer] = await ethers.getSigners();
        console.log("signer: ", signer.address);

        const address = loadDeploymentAddress(network.name, "EntangleToken");
        const tokenBridge = await ethers.getContractAt("EntangleToken", address, signer);

        const isKnownOrigin = await tokenBridge.knownOrigins(signer.address);
        if (!isKnownOrigin) {
            await tokenBridge.setOrigins(
                [signer.address],
                [true]
            );    
        }

        const tx = await tokenBridge.redeem(taskParams.data);
        const receipt = await tx.wait();

        console.log("\n\n", receipt);
    });