import { task } from "hardhat/config";
import { SEPARATOR } from "../utils/constants";
import { networks } from "../scripts/utils";
import { BytesLike, toUtf8Bytes } from "ethers";
import { loadDeploymentAddress } from "../utils/utils";
import { FeesEvm, FeesSolana, UIPProvider } from "@entangle-labs/uip-sdk";
import { Connection, PublicKey, sendAndConfirmRawTransaction, SystemProgram } from "@solana/web3.js";


task("sendMessage", "Proposes an operation")
    .addParam("destchainid", "The destination chain ID")
    .addParam("destaddress", "The destination address")
    .addParam("message", "The message to send")
    .addOptionalParam("finalization", "Block finalization option")
    .addOptionalParam("gaslimit", "Custom gas limit")
    .setAction(async (taskArgs, {network, ethers}) => {
        const coder = ethers.AbiCoder.defaultAbiCoder();

        const provider = new UIPProvider("https://evm-testnet.entangle.fi");
        const feesEvm = new FeesEvm(provider);

        if (!(networks.get(network.config.chainId!)?.includes("mainnet"))) {
            feesEvm.mode = "testnet"
            feesEvm.EIBName = "teib"
        }
        
        const netname = network.name
        console.log(`Using network: ${netname}`)
        const [signer] = await ethers.getSigners();
        console.log("signer: ", signer.address);

        const blockFinalizationOption = taskArgs.finalization || 0
        let customGasLimit = taskArgs.gaslimit || 272200

        if (taskArgs.destchainid == 5003) {
            customGasLimit = 4000000000
        }

        const address = await loadDeploymentAddress(netname, "MessengerProtocol");
        const instance = await ethers.getContractAt("MessengerProtocol", address, signer);

        let estimateFee
    
        let destAddress_bytes;
        if (taskArgs.destaddress.length == 42 && taskArgs.destaddress.startsWith("0x")) {
            destAddress_bytes = coder.encode(
                ["address"],
                [taskArgs.destaddress]
            );

            estimateFee = await feesEvm.estimateExecutionWithGas({
                srcChainId: BigInt(network.config.chainId!),
                destChainId: BigInt(taskArgs.destchainid),
                gasLimit: BigInt(customGasLimit)
            });
        } else {
            let solanaPublicKey;

            if (taskArgs.destaddress == 32) {
                solanaPublicKey = Buffer.from(require("bs58").decode(taskArgs.destaddress));
            } else {
                solanaPublicKey = Buffer.from(taskArgs.destaddress, 'hex');
            }
            if (solanaPublicKey.length !== 32) {
                throw new Error("Invalid Solana address");
            }

            destAddress_bytes = coder.encode(
                ["bytes32"], 
                [solanaPublicKey]
            );

            const senderAddr = ethers.zeroPadValue(address, 32)
            const payload = coder.encode(["bytes", "bytes"], [
                coder.encode(["string"], [
                    taskArgs.message,
                ]),
                
                Buffer.from(senderAddr.slice(2, ), "hex"),
            ])


            const feesSolana = new FeesSolana()
            estimateFee = await feesSolana.estimateExecutionSolana({
                connection: new Connection('https://api.devnet.solana.com'),
                payload: Buffer.from(payload.slice(2, ), 'hex'),
                srcChain: BigInt(network.config.chainId!),
                senderAddr: Buffer.from(senderAddr.slice(2, ), 'hex'),
                destChain: BigInt(taskArgs.destchainid),
                destAddr: new PublicKey("MeskEHG9jyVQGrZsNSYTLzxH9waE6UjrWEsviCQn2E1"),
                accounts: [
                    { pubkey: new PublicKey("4D5VH9HLUdXtPmDbBjzNHiPkktwu7P7EHi1KGvFkxTTT"), isSigner: false, isWritable: true},
                    {
                        pubkey: new PublicKey("GJVi1Nqwqq5ejGYYa5nFjuRTveVUAhS1ycMLunBhPEJp"),
                        isSigner: false,
                        isWritable: true
                    },
                    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
                ]
            })
        }

        if (estimateFee == undefined) {
            console.log("Estimate fee returned with error")
            return
        }

        console.log("estimate fee = ", estimateFee)
        
        const tx = await instance.sendMessage(
            taskArgs.destchainid,
            blockFinalizationOption,
            customGasLimit,
            destAddress_bytes,
            taskArgs.message,
            {   
                value: estimateFee + (estimateFee / 100n * 10n),
                // value: estimateFee * 2n
            }
        )
        const rec = await tx.wait();
        console.log(SEPARATOR)
        console.log(rec)
        console.log(SEPARATOR)
        console.log(`Operation proposed to chain ${taskArgs.destchainid} to address ${taskArgs.destaddress} with message: "${taskArgs.message}"`);
    });
