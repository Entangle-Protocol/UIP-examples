import hre, { ethers, upgrades } from "hardhat";
import { saveDeploymentAddress } from "./utils";
import { networks } from "./utils";

async function deployMessenger() {
    let netname = hre.network.name
    
    console.log(`Using network: ${netname}\n`)
    console.log(`ChainID ${netname}: ${hre.network.config.chainId}`)

    let endpoint
    if (hre.network.name.includes("mainnet")) {
        endpoint = require(`@entangle-labs/uip-contracts/addresses/mainnet/${netname}/Endpoint.json`)
    } else {
        endpoint = require(`@entangle-labs/uip-contracts/addresses/testnet/${netname}/Endpoint.json`)
    }

    const [signer] = await ethers.getSigners() 
    const signerBalance = ethers.formatEther((await ethers.provider.getBalance(await signer.getAddress())).toString())
    console.log(`Signer: ${await signer.getAddress()}`)
    console.log(`Signer native balance: ${signerBalance}\n`)
    
    console.log(`Deploying MessengerProtocol`)
    console.log(`With args: ${await signer.getAddress()}, ${endpoint.address}\n`)
    const factory = await ethers.getContractFactory("MessengerProtocol")
    const instance = await factory.deploy(await signer.getAddress(), endpoint.address)
    
    await instance.waitForDeployment()

    console.log(`MessengerProtocol deployed to: ${await instance.getAddress()}`)
    saveDeploymentAddress(hre.network.name, "MessengerProtocol", await instance.getAddress())
}


deployMessenger()