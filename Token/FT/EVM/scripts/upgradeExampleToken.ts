import hre, { ethers, upgrades } from "hardhat";
import { loadDeploymentAddress, upgradeImplAddress } from "../scripts/utils";

export async function main() {
    const netname = hre.network.name;
    const proxyAddress = loadDeploymentAddress(netname, "ExampleToken");
    console.log("Using current contract address at:\t", proxyAddress);

    const oldImpl =
        await upgrades.erc1967.getImplementationAddress(proxyAddress);
    console.log("Old implementation deployed to:\t\t", oldImpl);

    const actualFactory = await ethers.getContractFactory("ExampleToken");
    await upgrades.validateImplementation(actualFactory);
    await upgrades.validateUpgrade(proxyAddress, actualFactory);

    const instance = await upgrades.upgradeProxy(proxyAddress, actualFactory);
    await instance.waitForDeployment();

    await new Promise((resolve) => setTimeout(resolve, 10000));
    
    const newImpl = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    console.log("New implementation deployed to:\t\t", newImpl);

    const filePath = `./addresses/${netname}/ExampleToken.json`;
    upgradeImplAddress(filePath, newImpl);
};

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});