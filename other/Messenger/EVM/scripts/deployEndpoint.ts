// utils.ts or a similar utility file
import { ethers, upgrades } from "hardhat";
import { EndPoint__factory, EndPoint } from "../typechain-types"; // Adjust the path as necessary

export const deployEndPointFixture = async () => {
    const owner = await ethers.getSigners();
    const signers = await ethers.getSigners();
    const EndPointFactory: EndPoint__factory =
        await ethers.getContractFactory("EndPoint");
    
    const defaultConsensus = 50 * 100
    const args: any = [[ owner], defaultConsensus];
    const endpoint = await upgrades.deployProxy(EndPointFactory, args, {
        kind: "uups",
    });
    await endpoint.waitForDeployment();

    await endpoint.registerOrExcludeBatch(signers, true, true);
    await endpoint.setConsensusTargetRate(5000); // 50%

    return endpoint as unknown as EndPoint;
};

