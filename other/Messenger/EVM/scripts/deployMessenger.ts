import hre, { ethers, upgrades } from "hardhat";
import { saveDeploymentAddress } from "./utils";

async function deployMessenger() {
    const endpoint = require(`@entangle-labs/uip-contracts/addresses/testnet/${hre.network.name}/Endpoint.json`)

    const [signer] = await ethers.getSigners() 
    
    const args = [await signer.getAddress(), endpoint.address]
    const factory = await ethers.getContractFactory("MessengerProtocol")
    const instance = await upgrades.deployProxy(factory, args, {
        kind: "uups"
    })
    
    await instance.waitForDeployment()

    const implAddress = await upgrades.erc1967.getImplementationAddress(await instance.getAddress());
    saveDeploymentAddress(hre.network.name, "MessengerProtocol", await instance.getAddress(), implAddress)
}


deployMessenger()