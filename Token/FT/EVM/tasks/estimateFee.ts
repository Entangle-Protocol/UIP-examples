import { task } from "hardhat/config";
import { FeesEvm, UIPProvider } from "@entangle-labs/uip-sdk";
import { formatUnits } from "ethers";
import { networks } from "../scripts/utils"

task("estimateFee", "Calculate cross-chain execution fee")
    .addParam("srcchainid", "Source chain ID")
    .addParam("destchainid", "Destination chain ID")
    .addParam("gaslimit", "Custom gas limit")
    .setAction(async (taskArgs, { network }) => {
        const provider = new UIPProvider("https://evm-testnet.entangle.fi");
        const feesEvm = new FeesEvm(provider);

        if (!(networks.get(network.config.chainId!)?.includes("mainnet"))) {
            feesEvm.mode = "testnet"
            feesEvm.EIBName = "teib"
        }

        const nativeValue = await feesEvm.estimateExecutionWithGas({
            srcChainId: BigInt(taskArgs.srcchainid),
            destChainId: BigInt(taskArgs.destchainid),
            gasLimit: BigInt(taskArgs.gaslimit)
        });

        if (!nativeValue) {
            throw new Error("Fee estimation returned null");
        }

        console.log(`\nCross-chain Fee Estimate:`);
        console.log(`- Network: Chain ${taskArgs.srcchainid} → Chain ${taskArgs.destchainid}`);
        console.log(`- Estimated native value (ETH): ${formatUnits(nativeValue, 18)}`);
        console.log(`- Estimated native value (Gwei): ${formatUnits(nativeValue, 9)}`);
        console.log(`- Estimated native value (Wei): ${nativeValue.toString()}`);
  });