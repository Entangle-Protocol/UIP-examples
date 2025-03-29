import * as anchor from "@coral-xyz/anchor";
import { Destination, sendMessage } from "../helpers/messenger";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { BN } from "bn.js";

async function main(): Promise<void> {
  if (process.argv.length < 2 + 5) {
    console.error(
      "Usage: sendMessage <#times> <dst-chain> <uip-fee> <custom-gas-limit> <text>",
    );
    process.exit(1);
  }

  const times = Number(process.argv[2]);
  const dstChain = process.argv[3];
  const uipFee = new BN(process.argv[4]);
  const customGasLimit = new BN(process.argv[5]);
  const baseText = process.argv.slice(6).join(" ");

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
    case "base-sepolia":
      destination = { baseSepolia: {} };
      break;
    case "sonic-blaze-testnet":
      destination = { sonicBlazeTestnet: {} };
      break;
    case "avalanche-fuji":
      destination = { avalancheFuji: {} };
      break;
    default:
      throw new Error(
        "Invalid chain name, must be one of solana-mainnet, solana-devnet, ethereum-sepolia, polygon-amoy, mantle-sepolia, teib, base-sepolia, sonic-blaze-testnet, avalanche-fuji",
      );
  }

  const promises = Array.from({ length: times }, async (_, i) => {
    let text = baseText;
    if (i != 0) {
      text += " " + i;
    }

    while (true) {
      try {
        const { transactionSignature } = await sendMessage({
          uipFee,
          customGasLimit,
          destination,
          sender: payer,
          text,
          payer,
        });
        console.log(`${i + 1} signature:`, transactionSignature);
        break;
      } catch (error) {
        console.error(`${i + 1} failed:`, error);
      }
    }
  });

  await Promise.all(promises);
}

main();
