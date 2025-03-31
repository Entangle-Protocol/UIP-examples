import * as anchor from "@coral-xyz/anchor";
import { bridge, Destination } from "../helpers/exampleToken";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { BN } from "bn.js";
import { hexToBytes } from "../helpers/endpoint";
import { PublicKey } from "@solana/web3.js";

async function main(): Promise<void> {
  if (process.argv.length < 2 + 6) {
    console.error(
      "Usage: sendMessage <#times> <dst-chain> <uip-fee> <custom-gas-limit> <to> <base-amount>",
    );
    process.exit(1);
  }

  const times = Number(process.argv[2]);
  const dstChain = process.argv[3];
  const uipFee = new BN(process.argv[4]);
  const customGasLimit = new BN(process.argv[5]);
  let to: Buffer;
  if (process.argv[6].startsWith("0x")) {
    to = hexToBytes(process.argv[6]);
  } else {
    to = new PublicKey(process.argv[6]).toBuffer();
  }
  const baseAmount = new BN(process.argv[7]);

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
        "Invalid chain name, must be one of solana-mainnet, solana-devnet, polygon-amoy, mantle-sepolia, teib",
      );
  }

  const promises = Array.from({ length: times }, async (_, i) => {
    while (true) {
      try {
        const { transactionSignature } = await bridge({
          uipFee,
          customGasLimit,
          destination,
          sender: payer,
          amount: baseAmount.add(new BN(i)),
          to,
        });
        console.log(`${i + 1} signature:`, transactionSignature);
        break;
      } catch (err) {
        console.error(`${i + 1} failed:`, err);
        if (err.toString().includes("Transaction was not confirmed")) {
          break;
        }
      }
    }
  });

  await Promise.all(promises);
  process.exit();
}

main();
