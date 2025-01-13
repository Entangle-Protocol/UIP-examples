import { task } from "hardhat/config";
import fs from "fs";
import { SEPARATOR } from "../utils/constants";
import { BytesLike } from "ethers";

// import { ethers } from "hardhat";

async function hexToString(hex: any) {
    hex = hex.replace(/^0x/, '');
    
    let bytes = [];
    for (let i = 0; i < hex.length; i += 2) {
        bytes.push(String.fromCharCode(parseInt(hex.substr(i, 2), 16)));
    }
    
    return bytes.join('');
}

task("sendMessage", "Proposes an operation")
    .addParam("dest_chain_id", "The destination chain ID")
    .addParam("dest_address", "The destination address")
    .addParam("message", "The message to send")
    .addParam("deploy_address", "Address of deployed messenger")
    .setAction(async (taskArgs, {network, ethers}) => {
        const coder = ethers.AbiCoder.defaultAbiCoder();
        
        const [signer] = await ethers.getSigners();
        console.log("signer: ", signer.address);

        const destAddress_bytes = coder.encode(
            ["address"],
            [taskArgs.destAddress]
        );


        const instance = await ethers.getContractAt("MessengerProtocol", taskArgs.deployAddress, signer);
        const tx = await instance.sendMessage(
            taskArgs.destChainId,
            3,
            0,
            destAddress_bytes,
            taskArgs.message,
            {value: 100000}
        )
        const rec = await tx.wait();
        console.log(SEPARATOR)
        console.log(rec)
        console.log(SEPARATOR)
        console.log(`Operation proposed to chain ${taskArgs.destChainId} to address ${taskArgs.destAddress} with message: "${taskArgs.message}"`);
    });

task("getLastMessage", "Proposes returns last message")
    .addParam("sender", "source chain sender address")
    .addParam("deployAddress", "Address of deployed messenger")
    .setAction(async (taskArgs, {network, ethers}) => {
        
        const [signer] = await ethers.getSigners();
        console.log(`signer: ${signer}`);
        
        const instance = await ethers.getContractAt("MessengerProtocol", taskArgs.deployAddress, signer);

        const msgB: BytesLike = await instance.getLastMessage(
            taskArgs.sender,
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
            Last message from address ${taskArgs.sender} 
            is: "${decoded}"
        `);
    });