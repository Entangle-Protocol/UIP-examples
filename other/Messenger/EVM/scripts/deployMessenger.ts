import { ethers, upgrades } from "hardhat";

async function deployMessenger(netname:string) {
    const endpoint = require(`@entangle-labs/uip-contracts/addresses/testnet/${netname}/Endpoint.json`)

    const [signer] = await ethers.getSigners() 
    const args = [await signer.getAddress(), endpoint.address]

    const factory = await ethers.getContractFactory("MessengerProtocol")
    const instance = await upgrades.deployProxy(factory, args, {
        kind: "uups"
    })
    await instance.waitForDeployment()
}

deployMessenger("netname")