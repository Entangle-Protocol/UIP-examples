import hre, { ethers, upgrades } from "hardhat";
import { task } from "hardhat/config";
import fs from "fs";
import { SEPARATOR } from "../utils/constants";
import { BytesLike } from "ethers";

async function deployMessenger() {
    const endpoint = require(`@entangle-labs/uip-contracts/addresses/testnet/${hre.network.name}/Endpoint.json`)

    const [signer] = await ethers.getSigners() 
    const args = [await signer.getAddress(), endpoint.address]

    const factory = await ethers.getContractFactory("MessengerProtocol")
    const instance = await upgrades.deployProxy(factory, args, {
        kind: "uups"
    })
    await instance.waitForDeployment()
}


deployMessenger()