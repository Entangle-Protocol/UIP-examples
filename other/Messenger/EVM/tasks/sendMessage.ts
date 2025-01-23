import { task } from "hardhat/config";
import fs from "fs";
import { SEPARATOR } from "../utils/constants";
import { BytesLike } from "ethers";

// import { ethers } from "hardhat";

function loadDeploymentAddress(network: string, contractName: string) {
    const filePath = `./addresses/${network}/${contractName}.json`;
    console.log(`Deployment address loaded from
        ${filePath}   
    `)
    return JSON.parse(fs.readFileSync(filePath, "utf8")).address;
}

async function hexToString(hex: any) {
    hex = hex.replace(/^0x/, '');
    
    let bytes = [];
    for (let i = 0; i < hex.length; i += 2) {
        bytes.push(String.fromCharCode(parseInt(hex.substr(i, 2), 16)));
    }
    
    return bytes.join('');
}

task("sendMessage", "Proposes an operation")
    .addParam("destchainid", "The destination chain ID")
    .addParam("destaddress", "The destination address")
    .addParam("message", "The message to send")
    .setAction(async (taskArgs, {network, ethers}) => {
        const coder = ethers.AbiCoder.defaultAbiCoder();

        const netname = network.name
        console.log(`Using network: ${netname}`)
        
        const [signer] = await ethers.getSigners();
        console.log("signer: ", signer.address);

        const destAddress_bytes = coder.encode(
            ["address"],
            [taskArgs.destaddress]
        );
        
        const address = await loadDeploymentAddress(netname, "MessengerProtocol");
        const instance = await ethers.getContractAt("MessengerProtocol", address, signer);
        const tx = await instance.sendMessage(
            taskArgs.destchainid,
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
        console.log(`Operation proposed to chain ${taskArgs.destchainid} to address ${taskArgs.destaddress} with message: "${taskArgs.message}"`);
    });

task("getLastMessage", "Proposes returns last message")
    .addParam("sender", "source chain sender address")
    .setAction(async (taskArgs, {network, ethers}) => {
        
        const [signer] = await ethers.getSigners();
        console.log(`signer: ${signer}`);

        const netname = network.name
        console.log(`Using network: ${netname}`)

        const address = await loadDeploymentAddress(netname, "MessengerProtocol");
        const instance = await ethers.getContractAt("MessengerProtocol", address, signer);
        
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