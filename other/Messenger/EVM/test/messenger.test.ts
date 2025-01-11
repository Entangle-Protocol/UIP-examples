import { ethers, upgrades } from "hardhat";
import {
    EndPoint,
    EndPoint__factory,
    MessengerProtocol,
    WNative,
} from "../typechain-types";
import { expect } from "chai";
import { DEFAULT_CONSENSUS_RATE } from "../utils/constants";
import fs from "fs"
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

async function deployEndpoint() {
    const [owner] = await ethers.getSigners()
    const args = [[owner.address], DEFAULT_CONSENSUS_RATE]
    
    const factory = await ethers.getContractFactory("EndPoint")
    const endpoint = await upgrades.deployProxy(factory, args, {
        kind: "uups"
    })
    await endpoint.waitForDeployment()

    console.log("endpoint deployed on address ", await endpoint.getAddress())
    return endpoint
}

async function deployMessengerProtocol(owner:string, endpoint:string) {
    const factory = await ethers.getContractFactory("MessengerProtocol");
    const args = [owner, endpoint];

    const messengerProtocol = await upgrades.deployProxy(factory, args, {
        kind: "uups",
    });
    await messengerProtocol.waitForDeployment()

    console.log("messenger deployed on address ", await messengerProtocol.getAddress())
    return messengerProtocol;
}

async function deployWNative() {
    const factory = await ethers.getContractFactory("WNative")
    const native = await factory.deploy()

    console.log("native deployed on address ", await native.getAddress())    
    return native
}

describe("Messenger", function () {
    let owner: HardhatEthersSigner;
    let connector: HardhatEthersSigner;
    let messengerProtocol: MessengerProtocol;
    let endpoint: EndPoint;
    let native: WNative;
    let coder = ethers.AbiCoder.defaultAbiCoder();

    it("Should propose and receive operation in messenger protocol", async function () {
        [owner, connector] = await ethers.getSigners()
        endpoint = await deployEndpoint()
        messengerProtocol = await deployMessengerProtocol(owner.address, await endpoint.getAddress());
        native = await deployWNative()

        await endpoint.setNative(await native.getAddress())
        await endpoint.setConnector(await connector.getAddress())

        // data
        const randomSolidityAddress = await messengerProtocol.getAddress();
        const randomSolidityAddress_bytes = coder.encode(
            ["address"],
            [randomSolidityAddress]
        );
        const msg = "My msg";
        const destChainId = 1;
        const waitForBlocks = 3
        const customGasLimit = 0

        // send
        await messengerProtocol.sendMessage(
            destChainId,
            waitForBlocks,
            customGasLimit,
            randomSolidityAddress_bytes,
            msg,
            { value: 1 }
        );
        console.log("Operation proposed successfully!");

        // "execute" part
        let messageEncoded = coder.encode(["string"], [msg]);
        let addrEncoded = coder.encode(["address"], [owner.address]);
        let payload = coder.encode(
            ["bytes", "bytes"],
            [messageEncoded, addrEncoded]
        );
        let encoded_data = coder.encode(
            ["uint256", "bytes", "bytes"],
            [destChainId, randomSolidityAddress_bytes, payload]
        );
        console.log(`\n\nEncoded data: ${encoded_data}`);

        // "endpoint" on "destination" chain
        await messengerProtocol.changeEndpoint(owner.address);
        // emulate endpoint low-call
        await messengerProtocol.connect(owner).execute(encoded_data);

        console.log(
            "\nOwner encoded: ",
            coder.encode(["address"], [owner.address])
        );
        const received_msg_bytes =
            await messengerProtocol.getLastMessageByAddress(owner.address);

        console.log(`Recieved message: ${received_msg_bytes}`);

        // fail execute
        const msgError = "error";
        messageEncoded = coder.encode(["string"], [msgError]);
        addrEncoded = coder.encode(["address"], [owner.address]);
        payload = coder.encode(
            ["bytes", "bytes"],
            [messageEncoded, addrEncoded]
        );
        encoded_data = coder.encode(
            ["uint256", "bytes", "bytes"],
            [destChainId, randomSolidityAddress_bytes, payload]
        );
        await expect(
            messengerProtocol.connect(owner).execute(encoded_data)
        ).to.be.revertedWithCustomError(messengerProtocol, `ErrorMsgForbidden`);
    });
});
