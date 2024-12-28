import { ethers } from "hardhat";
import { log } from "../test/testLogger";
import { EndPoint } from "../typechain-types/contracts/EndPoint";
import { AgentParamsEncoderMock } from "../typechain-types";
import { deployEndPointFixture } from "./deployEndpoint";
import { encodeDefaultSelector, signConsensus } from "../test/testUtils";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

export async function proposeOperation(destChainID: number, destAddress: string, message: string) {
    const signers: HardhatEthersSigner[] = await ethers.getSigners();
    const owner: HardhatEthersSigner = signers[0];
    const endpoint: EndPoint = await deployEndPointFixture();
    

    const agentParamsLibF = await ethers.getContractFactory("AgentParamsLib")
    const agentParamsLib = await agentParamsLibF.deploy()

    const encoderF = await ethers.getContractFactory("AgentParamsEncoderMock", {
        libraries: {
            AgentParamsLib: await agentParamsLib.getAddress()
        }
    })
    const agentParamsEncoderMock = await encoderF.deploy()

    const selectorSlot = encodeDefaultSelector();
    const agentParams = {
        waitForBlocks: 3,
        customGasLimit: 0,
    };
    const encodedAgentParams = await agentParamsEncoderMock.encode(agentParams.waitForBlocks, agentParams.customGasLimit)
    const params = ethers.AbiCoder.defaultAbiCoder().encode(
        ["string"],
        [message]
    );
    log("Selector slot:", selectorSlot);

    // @ts-ignore
    await endpoint.propose(
        destChainID,
        selectorSlot,
        encodedAgentParams,
        destAddress,
        params,
        { value: 1}
    );

    log("Operation proposed successfully!");
}



module.exports ={
  proposeOperation
}