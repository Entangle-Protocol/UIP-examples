import { task } from "hardhat/config";
import fs from "fs";
import { SEPARATOR } from "../utils/constants";
import { BytesLike } from "ethers";
import { loadDeploymentAddress } from "../utils/utils";
import { hexToString } from "../utils/utils";

task("getLastMessage", "Proposes returns last message")
    .addParam("sender", "source chain sender address")
    .setAction(async (taskArgs, {network, ethers}) => {
        
        const [signer] = await ethers.getSigners();
        console.log(`signer: ${signer.address}`);

        const netname = network.name
        console.log(`Using network: ${netname}`)

        const address = await loadDeploymentAddress(netname, "MessengerProtocol");
        const instance = await ethers.getContractAt("MessengerProtocol", address, signer);
        
        const msgB: BytesLike = await instance.getLastMessage(
            ethers.AbiCoder.defaultAbiCoder().encode(["address"], [taskArgs.sender])
        )
        console.log(SEPARATOR)

        const lenHex = msgB.toString().substring(64 * 5, 64 * 5 + 2)
        const lenInt = parseInt(lenHex, 16)
        const stringLen = lenInt * 2
        console.log("Bytes len of message:", msgB.length)

        const stringOffset = 64 * 5 + 2
        const cut = msgB.toString().substring(stringOffset, stringOffset + stringLen)
        console.log("Msg Bytes:", cut)
        
        const decoded = await hexToString(cut)
        console.log(SEPARATOR)
        console.log(`
            Last message from address ${taskArgs.sender} is: "${decoded}"
        `);
    });