import { ethers, upgrades } from "hardhat";
import { ExampleToken, Endpoint, WNative } from "../typechain-types";
import { expect } from "chai";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("ExampleToken", () => {
    let exampleToken: ExampleToken;
    let endpoint: Endpoint;
    let admin: HardhatEthersSigner;
    let Alice: HardhatEthersSigner;
    let Bob: HardhatEthersSigner;
    let wrappedNative: WNative;

    const DEST_CHAIN_ID = 123;
    const SRC_CHAIN_ID = 456;
    
    before(async () => {
        [admin, Alice, Bob] = await ethers.getSigners();
        
        const Endpoint = await ethers.getContractFactory("Endpoint");
        endpoint = await upgrades.deployProxy(Endpoint, [[admin.address], 5000], {
            kind: "uups",
            initializer: "initialize"
        });

        const WreppedNative = await ethers.getContractFactory("WNative");
        wrappedNative = await WreppedNative.deploy();
        await wrappedNative.waitForDeployment();

        await endpoint.setWrappedNative(wrappedNative.target);
        await endpoint.setUTSConnector(admin.address);
    });
  
    beforeEach(async () => {  
        const ExampleToken = await ethers.getContractFactory("ExampleToken");
        exampleToken = await upgrades.deployProxy(ExampleToken, [
            "Test ERC20",
            "TEST",
            admin.address,
            Alice.address,
            ethers.parseEther("1000")
        ], {
            kind: "uups",
            initializer: "initialize",
        });
        
        await exampleToken.connect(admin).setEndpoint(endpoint.target);
    });

    it("Should initialize with correct parameters", async () => {
        expect(await exampleToken.name()).to.equal("Test ERC20");
        expect(await exampleToken.symbol()).to.equal("TEST");
        expect(await exampleToken.totalSupply()).to.equal(ethers.parseEther("1000"));
    });

    it("Should set correct admin role", async () => {
        expect(await exampleToken.hasRole(await exampleToken.DEFAULT_ADMIN_ROLE(), admin.address)).to.be.true;
    });

    it("Should revert bridging with invalid parameters", async () => {
        await expect(
            exampleToken.connect(Alice).bridge(
                DEST_CHAIN_ID,
                Bob.address,
                ethers.parseEther("100"),
                0,
                0
            )
        ).to.be.revertedWithCustomError(exampleToken, "ExampleToken__UnknownOrigin");
        
        await expect(
            exampleToken.connect(Alice).bridge(
                await ethers.provider.getNetwork().then(n => n.chainId),
                Bob.address,
                ethers.parseEther("100"),
                0,
                0
            )
        ).to.be.revertedWithCustomError(exampleToken, "ExampleToken__BridgingToTheSameChain");
    });
    
    it("Should successfully bridge tokens", async () => {
        const destAddress = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [exampleToken.target]);
        await exampleToken.connect(admin).setOrigins([DEST_CHAIN_ID], [destAddress]);

        const amount = ethers.parseEther("100");
        await exampleToken.connect(Alice).approve(exampleToken.target, amount);

        const encodedBobAddress = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [Bob.address]);
        
        await expect(
            exampleToken.connect(Alice).bridge(
                DEST_CHAIN_ID,
                encodedBobAddress,
                amount,
                0,
                60000n
            , { value: 5 })
        ).to.emit(exampleToken, "ExampleToken__Bridged");
    });

    it("Should successfully redeem tokens", async () => {
        const destAddress = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [exampleToken.target]);
        await exampleToken.connect(admin).setOrigins([SRC_CHAIN_ID], [destAddress]);
        const amount = ethers.parseEther("50");
        
        const payload = ethers.AbiCoder.defaultAbiCoder().encode(
            ["bytes", "bytes", "uint256"],
            [
                ethers.AbiCoder.defaultAbiCoder().encode(["address"], [Alice.address]),
                ethers.AbiCoder.defaultAbiCoder().encode(["address"], [Bob.address]),
                amount,
            ]
        );

        const data = ethers.AbiCoder.defaultAbiCoder().encode(
            ["uint256", "bytes", "bytes"],
            [
                SRC_CHAIN_ID,
                ethers.AbiCoder.defaultAbiCoder().encode(["address"], [exampleToken.target]),
                payload
            ]
        );

        const encodedAliceAddress = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [Alice.address]);

        await exampleToken.setEndpoint(Bob.address);
        await expect(exampleToken.connect(Bob).execute(data))
            .to.emit(exampleToken, "ExampleToken__Received")
            .withArgs(encodedAliceAddress, Bob.address, amount, SRC_CHAIN_ID);

        expect(await exampleToken.balanceOf(Bob.address)).to.equal(amount);
    });
});