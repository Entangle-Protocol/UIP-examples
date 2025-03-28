import hre, { ethers, upgrades } from "hardhat";
import { loadDeploymentAddress, saveDeploymentAddress } from "./utils";

async function changeEndpoints() {
    const endpoint = require(`@entangle-labs/uip-contracts/addresses/testnet/${hre.network.name}/Endpoint.json`)
    const netname = hre.network.name

    const [signer] = await ethers.getSigners()

    const messengerAddr = loadDeploymentAddress(netname, "MessengerProtocol")
    const messenger = await ethers.getContractAt("MessengerProtocol", messengerAddr, signer)

    const oldEndpoint = await messenger.endpoint()
    await messenger.changeEndpoint(endpoint)

    console.log("\nnetwork: ", netname)
    console.log("old endpoint: ", oldEndpoint)
    console.log("new endpoint: ", endpoint)
}


changeEndpoints()