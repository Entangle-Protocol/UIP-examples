import { ethers, upgrades } from "hardhat";
import {
    EndPoint,
    EndPoint__factory,
    MessengerProtocol,
} from "../typechain-types";
import { expect } from "chai";

async function deployMessengerProtocol() {
    const factory = await ethers.getContractFactory("MessengerProtocol");
    const [owner, otherAccount] = await ethers.getSigners();
    const args = [owner.address, otherAccount.address];
    const messengerProtocol = await upgrades.deployProxy(factory, args, {
        kind: "uups",
    });

    return { messengerProtocol, owner, otherAccount };
}

async function deployEndPoint() {
    const signers = await ethers.getSigners();
    const EndPointFactory: EndPoint__factory =
        await ethers.getContractFactory("EndPoint");
    const [owner, otherAccount] = await ethers.getSigners();
    const defaultConsensus = 50 * 100;
    // console.log(owner);
    const args: any = [[owner.address], defaultConsensus];
    const endpoint = await upgrades.deployProxy(EndPointFactory, args, {
        kind: "uups",
    });
    await endpoint.waitForDeployment();

    await endpoint.registerOrExcludeBatch(signers, true, true);
    await endpoint.setConsensusTargetRate(5000); // 50%

    return endpoint as unknown as EndPoint;
}

// async function hexToString(hex: string) {
//     // Delete 0x prefix
//     hex = hex.replace(/^0x/, "");

//     let bytes = [];
//     for (let i = 0; i < hex.length; i += 2) {
//         bytes.push(String.fromCharCode(parseInt(hex.substr(i, 2), 16)));
//     }

//     return bytes.join("");
// }

describe("Messenger", function () {
    let messengerProtocol: MessengerProtocol;
    let coder = ethers.AbiCoder.defaultAbiCoder();

    it("Should propose and recieve operation in messenger protocol", async function () {
        const agentParamsLibF = await ethers.getContractFactory("AgentParamsLib")
        const agentParamsLib = await agentParamsLibF.deploy()

        const encoderF = await ethers.getContractFactory("AgentParamsEncoderMock", {
            libraries: {
                AgentParamsLib: await agentParamsLib.getAddress()
            }
        })
        const agentParamsEncoderMock = await encoderF.deploy()


        const endpoint = await deployEndPoint();
        const { messengerProtocol, owner, otherAccount } =
            await deployMessengerProtocol();

        // endpoint on "source" chain
        await messengerProtocol.changeEndpoint(await endpoint.getAddress());

        // data
        const randomSolidityAddress = await messengerProtocol.getAddress();
        const randomSolidityAddress_bytes = coder.encode(
            ["address"],
            [randomSolidityAddress]
        );
        const msg = "My msg";
        const destChainId = 1;
        const agentParams = {
            waitForBlocks: 3,
            customGasLimit: 0
        }
        const encodedAgentParams = await agentParamsEncoderMock.encode(agentParams.waitForBlocks, agentParams.customGasLimit)

        await messengerProtocol.sendMessage(
            destChainId,
            randomSolidityAddress,
            encodedAgentParams,
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
