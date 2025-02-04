import hre, { ethers, upgrades } from "hardhat";
import { saveDeploymentAddress } from "./utils";

export async function main() {
    const netname = hre.network.name;
    const endpoint = require(`@entangle-labs/uip-contracts/addresses/testnet/${netname}/Endpoint.json`);

    const name = "Test Bridge Token";
    const symbol = "TBT";
    const [signer] = await ethers.getSigners();
    const initialAmount = ethers.parseEther("100");
    const args = [name, symbol, signer.address, signer.address, initialAmount];

    const EntangleToken = await ethers.getContractFactory("EntangleToken")
    const entangleToken = await upgrades.deployProxy(EntangleToken, args, {
        kind: "uups",
        initializer: "initialize"
    });
    await entangleToken.waitForDeployment();

    const address = entangleToken.target.toString();
    const implAddress = await upgrades.erc1967.getImplementationAddress(address);

    await entangleToken.setEndpoint(endpoint.address);
    saveDeploymentAddress(netname, "EntangleToken", address, implAddress);
};

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});