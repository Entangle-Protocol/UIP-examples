import * as anchor from "@coral-xyz/anchor";
import { Destination, sendBigMessage } from "../helpers/messenger";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { BN } from "bn.js";

async function main(): Promise<void> {
  if (process.argv.length < 2 + 3) {
    console.error("Usage: sendBigMessage <dst-chain> <ccm-fee> <custom-gas-limit> <text>");
    process.exit(1);
  }

  const dstChain = process.argv[2];
  const ccmFee = new BN(process.argv[3]);
  const customGasLimit = new BN(process.argv[4]);
  const text = process.argv.slice(5).join(" ");

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const payer = (provider.wallet as NodeWallet).payer;

  let destination: Destination;
  switch (dstChain) {
    case "solana-mainnet":
      destination = { solanaMainnet: {} };
      break;
    case "solana-devnet":
      destination = { solanaDevnet: {} };
      break;
    case "ethereum-sepolia":
      destination = { ethereumSepolia: {} };
      break;
    case "polygon-amoy":
      destination = { polygonAmoy: {} };
      break;
    case "mantle-sepolia":
      destination = { mantleSepolia: {} };
      break;
    case "teib":
      destination = { teib: {} };
      break;
    default:
      throw new Error(
        "Invalid chain name, must be one of solana-mainnet, solana-devnet, ethereum-sepolia, polygon-amoy, mantle-sepolia, teib",
      );
  }

  const { transactionSignature } = await sendBigMessage({
    ccmFee,
    customGasLimit,
    destination,
    sender: payer,
    text,
    payer,
  });
  console.log("Transaction signature:", transactionSignature);
}

main();
