import { task } from "hardhat/config";
import { loadDeploymentAddress } from "../scripts/utils";
import { FeesEvm, FeesSolana, UIPProvider } from "@entangle-labs/uip-sdk";
import { networks } from "../scripts/utils";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";

task("sendTokens", "Initiates token transfer through the bridge")
    .addParam("tochainid", "Destination chain id")
    .addParam("to", "Receiver address")
    .addParam("amount", "Amount to transfer")
    .addOptionalParam("finalization", "Block finalization option")
    .addOptionalParam("gaslimit", "Custom gas limit")
    .setAction(async (taskParams, {network, ethers}) => {
        const netname = network.name;
        console.log(`Using network: ${netname}`);
        const [signer] = await ethers.getSigners();
        console.log("signer: ", signer.address);

        const provider = new UIPProvider("https://evm-testnet.entangle.fi");
        const feesEvm = new FeesEvm(provider);

        if (!(networks.get(network.config.chainId!)?.includes("mainnet"))) {
            feesEvm.mode = "testnet"
            feesEvm.EIBName = "teib"
        }

        const blockFinalizationOption = taskParams.finalization || 0
        let customGasLimit = taskParams.gaslimit || 60000n

        if (taskParams.tochainid == 5003) {
            customGasLimit = 40000000n
        }

        const address = loadDeploymentAddress(network.name, "ExampleToken");
        const tokenBridge = await ethers.getContractAt("ExampleToken", address, signer);

        let receiverAddress: string;
        let estimatedFees;

        if (taskParams.to.length === 42 && taskParams.to.startsWith("0x")) {
            receiverAddress = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [taskParams.to]);

            estimatedFees = await feesEvm.estimateExecutionWithGas({
                srcChainId: BigInt(network.config.chainId!),
                destChainId: BigInt(taskParams.tochainid),
                gasLimit: BigInt(customGasLimit)
            });
        } else {
            const solanaPublicKey = Buffer.from(require("bs58").decode(taskParams.to));
            if (solanaPublicKey.length !== 32) {
                throw new Error("Invalid Solana address");
            }

            receiverAddress = ethers.AbiCoder.defaultAbiCoder().encode(["bytes32"], [solanaPublicKey]);
            const senderAddr = ethers.zeroPadValue(address, 32);

            const payload = ethers.AbiCoder.defaultAbiCoder().encode(["bytes", "bytes", "uint256"], [                
                Buffer.from(senderAddr.slice(2, ), "hex"),
                Buffer.from(receiverAddress.slice(2, ), "hex"),
                taskParams.amount
            ]);

            const feesSolana = new FeesSolana();
            estimatedFees = await feesSolana.estimateExecutionSolana({
                connection: new Connection('https://api.devnet.solana.com'),
                payload: Buffer.from(payload.slice(2, ), 'hex'),
                srcChain: BigInt(network.config.chainId!),
                senderAddr: Buffer.from(senderAddr.slice(2, ), 'hex'),
                destChain: BigInt(taskParams.tochainid),
                destAddr: new PublicKey(""),
                accounts: [
                    {
                        pubkey: new PublicKey("Ere3yTTR2TR8n1irGj15rhKqUrTauccdoZt7e5BZVVEC"),
                        isSigner: false,
                        isWritable: true
                    },
                    {
                        pubkey: new PublicKey("8bPE4PGRQy2nvVXgUA8yrXqLWCBpzozguvkBk2Gsuwrx"),
                        isSigner: false,
                        isWritable: true
                    },
                    {
                        pubkey: SystemProgram.programId,
                        isSigner: false,
                        isWritable: false 
                    }
                ]
            });
        }

        if (estimatedFees == undefined) {
            console.log("Estimate fee returned with error");
            return;
        }

        console.log("estimated fees = ", estimatedFees);

        const tx = await tokenBridge.bridge(
            taskParams.tochainid,
            receiverAddress,
            taskParams.amount,
            blockFinalizationOption,
            customGasLimit,
            {   
                value: estimatedFees + ((estimatedFees * 10n) / 100n),
            }
        );
        await tx.wait();
        console.log("\nTransaction sent:", tx.hash);
        console.log("\n\n", `${taskParams.amount} tokens sent to chain ${taskParams.tochainid} to address ${taskParams.to} from chain ${network.config.chainId} from address ${signer.address}`);
    });