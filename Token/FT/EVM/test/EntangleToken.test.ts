import { ethers, upgrades } from "hardhat";
import { EntangleToken, Endpoint, WNative } from "../typechain-types";
import { expect } from "chai";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("EntangleToken", () => {
    let entangleToken: EntangleToken;
    let endpoint: Endpoint;
    let admin: HardhatEthersSigner;
    let user: HardhatEthersSigner;
    let burner: HardhatEthersSigner;
    let spotter: HardhatEthersSigner;
    let protocol: HardhatEthersSigner;
    let wrappedNative: WNative;

    const DEST_CHAIN_ID = 123;
    const SRC_CHAIN_ID = 456;
    
    before(async () => {
        [admin, user, burner, spotter, protocol] = await ethers.getSigners();
        
        const Endpoint = await ethers.getContractFactory("Endpoint");
        endpoint = await upgrades.deployProxy(Endpoint, [[admin.address], 5000], {
            kind: "uups",
            initializer: "initialize"
        });

        const WreppedNative = await ethers.getContractFactory("WNative");
        wrappedNative = await WreppedNative.deploy();
        await wrappedNative.waitForDeployment();

        await endpoint.setWrappedNative(wrappedNative.target);
        await endpoint.setUTSConnector(spotter.address);
    });
  
    beforeEach(async () => {  
        const EntangleToken = await ethers.getContractFactory("EntangleToken");
        entangleToken = await upgrades.deployProxy(EntangleToken, [
            "Test ERC20",
            "TEST",
            admin.address,
            admin.address,
            ethers.parseEther("1000")
        ], {
            kind: "uups",
            initializer: "initialize",
        });
        
        const BURNER_ROLE = await entangleToken.BURNER();
        const SPOTTER_ROLE = await entangleToken.SPOTTER();  
    
        await entangleToken.connect(admin).grantRole(BURNER_ROLE, burner.address);
        await entangleToken.connect(admin).grantRole(SPOTTER_ROLE, spotter.address);
        await entangleToken.connect(admin).setEndpoint(endpoint.target);
        await entangleToken.connect(admin).setOrigins([protocol.address, spotter.address], [true, true]);
        await entangleToken.connect(admin).setMinBridgeAmount([DEST_CHAIN_ID], [ethers.parseEther("10")]);
    });

    it("Should initialize with correct parameters", async () => {
        expect(await entangleToken.name()).to.equal("Test ERC20");
        expect(await entangleToken.symbol()).to.equal("TEST");
        expect(await entangleToken.totalSupply()).to.equal(ethers.parseEther("1000"));
    });

    it("Should set correct admin role", async () => {
        expect(await entangleToken.hasRole(await entangleToken.DEFAULT_ADMIN_ROLE(), admin.address)).to.be.true;
    });

    it("Should revert bridging with invalid parameters", async () => {
        await expect(
            entangleToken.connect(user).bridge(
                DEST_CHAIN_ID,
                user.address,
                ethers.AbiCoder.defaultAbiCoder().encode(["address"], [user.address]),
                ethers.parseEther("100"),
                ethers.ZeroHash,
                0,
                0
            )
        ).to.be.revertedWithCustomError(entangleToken, "EntangelToken__UnknownOrigin");
        
        await expect(
            entangleToken.connect(protocol).bridge(
                await ethers.provider.getNetwork().then(n => n.chainId),
                user.address,
                ethers.AbiCoder.defaultAbiCoder().encode(["address"], [user.address]),
                ethers.parseEther("100"),
                ethers.ZeroHash,
                0,
                0
            )
        ).to.be.revertedWithCustomError(entangleToken, "EntangelToken__BridgingToTheSameChain");
        
        await expect(
            entangleToken.connect(protocol).bridge(
                DEST_CHAIN_ID,
                user.address,
                ethers.AbiCoder.defaultAbiCoder().encode(["address"], [user.address]),
                ethers.parseEther("5"),
                ethers.ZeroHash,
                0,
                0
            )
        ).to.be.revertedWithCustomError(entangleToken, "EntangelToken__AmountIsLessThanMinimum");
    });
    
    it("Should successfully bridge tokens", async () => {
        const amount = ethers.parseEther("100");
        await entangleToken.connect(admin).transfer(user.address, amount);
        await entangleToken.connect(user).approve(entangleToken.target, amount);
        
        await expect(
            entangleToken.connect(protocol).bridge(
                DEST_CHAIN_ID,
                user.address,
                ethers.AbiCoder.defaultAbiCoder().encode(["address"], [user.address]),
                amount,
                ethers.ZeroHash,
                0,
                0
            , { value: 5 })
        ).to.emit(entangleToken, "EntangelToken__Sent");
    });

    it("Should successfully redeem tokens", async () => {
        const to = user.address;
        const amount = ethers.parseEther("50");
        const marker = ethers.id("test-marker");
        
        const payload = ethers.AbiCoder.defaultAbiCoder().encode(
            ["bytes", "bytes", "uint256", "bytes32"],
            [
                ethers.AbiCoder.defaultAbiCoder().encode(["address"], [user.address]),
                ethers.AbiCoder.defaultAbiCoder().encode(["address"], [to]),
                amount,
                marker,
            ]
        );

        const data = ethers.AbiCoder.defaultAbiCoder().encode(
            ["uint256", "bytes", "bytes"],
            [
                SRC_CHAIN_ID,
                ethers.AbiCoder.defaultAbiCoder().encode(["address"], [admin.address]),
                payload
            ]
        );

        await expect(entangleToken.connect(spotter).redeem(data))
            .to.emit(entangleToken, "EntangelToken__Received")
            .withArgs(user.address, to, amount, SRC_CHAIN_ID, marker);

        expect(await entangleToken.balanceOf(to)).to.equal(amount);
    });

    it("Should allow burner to burn tokens", async () => {
        const burnAmount = ethers.parseEther("100");
        await entangleToken.connect(admin).transfer(user.address, burnAmount);
    
        await expect(entangleToken.connect(burner).burn(user.address, burnAmount))
        .to.changeTokenBalance(entangleToken, user, -burnAmount);
    });

    it("Should pause/unpause contract", async () => {
        await entangleToken.connect(admin).pauseBridge();
        expect(await entangleToken.paused()).to.be.true;
    
        await entangleToken.connect(admin).unpauseBridge();
        expect(await entangleToken.paused()).to.be.false;
    });

    it("Should update min bridge amounts", async () => {
        await entangleToken.connect(admin).setMinBridgeAmount([DEST_CHAIN_ID, SRC_CHAIN_ID], [100, 200]);
        expect(await entangleToken.minBridgeAmounts(DEST_CHAIN_ID)).to.equal(100);
        expect(await entangleToken.minBridgeAmounts(SRC_CHAIN_ID)).to.equal(200);
    });
});