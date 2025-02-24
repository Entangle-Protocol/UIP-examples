import { task } from "hardhat/config";
import fs from "fs";
import { SEPARATOR } from "../utils/constants";
import { BytesLike } from "ethers";
import { loadDeploymentAddress } from "../utils/utils";
import { hexToString } from "../utils/utils";

task("getLastMessage", "Proposes returns last message")
    .addParam("sender", "source chain sender address")
    .setAction(async (taskArgs, {network, ethers}) => {
        const coder = ethers.AbiCoder.defaultAbiCoder();

        const [signer] = await ethers.getSigners();
        console.log(`signer: ${signer.address}`);

        const netname = network.name
        console.log(`Using network: ${netname}`)

        const address = await loadDeploymentAddress(netname, "MessengerProtocol");
        const instance = await ethers.getContractAt("MessengerProtocol", address, signer);
        
        let senderBytes;
        if (taskArgs.sender.length == 42 && taskArgs.sender.startsWith("0x")) {
            senderBytes = coder.encode(
                ["address"],
                [taskArgs.sender]
            );
        } else {
            const solanaPublicKey = Buffer.from(require("bs58").decode(taskArgs.sender));
            if (solanaPublicKey.length !== 32) {
                throw new Error("Invalid Solana address");
            }

            senderBytes = coder.encode(
                ["bytes32"], 
                [solanaPublicKey]
            );
        }


        const msgB: BytesLike = await instance.getLastMessage(senderBytes)
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