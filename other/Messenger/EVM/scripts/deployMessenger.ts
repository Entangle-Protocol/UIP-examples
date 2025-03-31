import hre, { ethers, upgrades } from "hardhat";
import { saveDeploymentAddress } from "./utils";
import { networks } from "./utils";

async function deployMessenger() {
    const netname = hre.network.name
    console.log(`Using network: ${netname}\n`)
    console.log(`ChainID ${netname}: ${hre.network.config.chainId}`)

    let endpoint
    if (!(networks.get(hre.network.config.chainId!)?.includes("mainnet"))) {
        endpoint = require(`@entangle-labs/uip-contracts/addresses/mainnet/${netname}/Endpoint.json`)
    } else {
        endpoint = require(`@entangle-labs/uip-contracts/addresses/testnet/${netname}/Endpoint.json`)
    }

    const [signer] = await ethers.getSigners() 
    const signerBalance = ethers.formatEther((await ethers.provider.getBalance(await signer.getAddress())).toString())
    console.log(`Signer: ${await signer.getAddress()}`)
    console.log(`Signer native balance: ${signerBalance}\n`)
    
    const args = [await signer.getAddress(), endpoint.address]
    console.log(`Deploying MessengerProtocol`)
    console.log(`With args: ${args}\n`)
    const factory = await ethers.getContractFactory("MessengerProtocol")
    const instance = await upgrades.deployProxy(factory, args, {
        kind: "uups"
    })
    
    await instance.waitForDeployment()

    const implAddress = await upgrades.erc1967.getImplementationAddress(await instance.getAddress());
    console.log(`MessengerProtocol deployed to: ${await instance.getAddress()}`)
    console.log(`MessengerProtocol implementation deployed to: ${implAddress}\n`)
    saveDeploymentAddress(hre.network.name, "MessengerProtocol", await instance.getAddress(), implAddress)
}


deployMessenger()