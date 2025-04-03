import { task } from "hardhat/config";
import { loadDeploymentAddress } from "../scripts/utils";

task("setOrigin", "Sets the ExampleToken contract from another chain as an origin on the current network")
    .addParam("destnetwork", "Network name of the other chain (as per Hardhat config)")
    .setAction(async (taskArgs, { ethers, network, config }) => {
        const [signer] = await ethers.getSigners();
        console.log(`Using signer: ${signer.address}`);

        const currentNetwork = network.name;
        const otherNetwork = taskArgs.destnetwork;
        const otherChainId = config.networks[otherNetwork]?.chainId;

        if (!otherChainId) {
            console.error(`\nChain ID not found for network: ${otherNetwork}`);
            return;
        }

        console.log(`\nCurrent network: ${currentNetwork}`);
        console.log(`\nOther network: ${otherNetwork} (Chain ID: ${otherChainId})`);

        const currentTokenAddress = loadDeploymentAddress(currentNetwork, "ExampleToken");
        const otherTokenAddress = loadDeploymentAddress(otherNetwork, "ExampleToken");

        console.log(`\nSetting ${otherTokenAddress} as an origin for Chain ID ${otherChainId} on ${currentNetwork}`);
        const tokenContract = await ethers.getContractAt("ExampleToken", currentTokenAddress, signer);

        const encodedOriginAddress = ethers.AbiCoder.defaultAbiCoder().encode(
            ["address"],
            [otherTokenAddress]
        );

        const existingOrigin = await tokenContract.knownOrigins(otherChainId);
        if (existingOrigin.toLowerCase() === encodedOriginAddress.toLowerCase()) {
            console.log("\nOrigin address is already set.");
            return;
        }

        const tx = await tokenContract.setOrigins(
            [otherChainId],
            [encodedOriginAddress]
        );

        console.log("\nTransaction sent:", tx.hash);
        await tx.wait();
        console.log(`\nOrigin set successfully for Chain ID ${otherChainId} on ${currentNetwork}`);
    });
