import hre, { ethers, upgrades } from "hardhat";
import { saveDeploymentAddress } from "./utils";

export async function main() {
    const netname = hre.network.name;
    console.log("Deploying Token Bridge to", netname);
    const endpoint = require(`@entangle-labs/uip-contracts/addresses/testnet/${netname}/Endpoint.json`);

    const name = "Test Bridge Token";
    const symbol = "TBT";
    const [signer] = await ethers.getSigners();
    const initialAmount = ethers.parseEther("100");
    const args = [name, symbol, signer.address, signer.address, initialAmount];

    const ExampleToken = await ethers.getContractFactory("ExampleToken")
    const exampleToken = await upgrades.deployProxy(ExampleToken, args, {
        kind: "uups",
        initializer: "initialize"
    });
    await exampleToken.waitForDeployment();

    const address = exampleToken.target.toString();
    const implAddress = await upgrades.erc1967.getImplementationAddress(address);

    console.log(`endpoint address on ${netname}:`, endpoint.address);
    await exampleToken.setEndpoint(endpoint.address);
    saveDeploymentAddress(netname, "ExampleToken", address, implAddress);
};

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});