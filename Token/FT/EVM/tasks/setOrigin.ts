import { task } from "hardhat/config";
import { loadDeploymentAddress } from "../scripts/utils";

task("setOrigin", "Sets the ExampleToken contract from another chain as an origin on the current network")
    .addParam("chainid", "Chain ID of the other network")
    .addParam("networkname", "Network name of the other chain (as per Hardhat config)")
    .setAction(async (taskArgs, { ethers, network }) => {
        const [signer] = await ethers.getSigners();
        console.log(`Using signer: ${signer.address}`);

        const currentNetwork = network.name;
        const otherNetwork = taskArgs.networkname;
        const otherChainId = taskArgs.chainid;

        console.log(`Current network: ${currentNetwork}`);
        console.log(`Other network: ${otherNetwork} (Chain ID: ${otherChainId})`);

        const currentTokenAddress = loadDeploymentAddress(currentNetwork, "ExampleToken");
        const otherTokenAddress = loadDeploymentAddress(otherNetwork, "ExampleToken");

        console.log(`Setting ${otherTokenAddress} as an origin for Chain ID ${otherChainId} on ${currentNetwork}`);
        const tokenContract = await ethers.getContractAt("ExampleToken", currentTokenAddress, signer);

        const encodedOriginAddress = ethers.AbiCoder.defaultAbiCoder().encode(
            ["address"],
            [otherTokenAddress]
        );

        const existingOrigin = await tokenContract.knownOrigins(otherChainId);
        if (existingOrigin.toLowerCase() === encodedOriginAddress.toLowerCase()) {
            console.log("Origin address is already set.");
            return;
        }

        const tx = await tokenContract.setOrigins(
            [otherChainId],
            [encodedOriginAddress]
        );

        console.log("Transaction sent:", tx.hash);
        await tx.wait();
        console.log(`Origin set successfully for Chain ID ${otherChainId} on ${currentNetwork}`);
    });
