import yargs from "yargs";
import * as anchor from "@coral-xyz/anchor";
import { Destination, sendMessage } from "@lincot/uip-solana-messenger-example";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { BN } from "bn.js";
import { sendAndConfirmVersionedTx } from "../helpers/utils";
import { toTransaction } from "@lincot/uip-solana-sdk";

async function main(): Promise<void> {
  const argv = yargs(process.argv.slice(2))
    .option("times", {
      type: "string",
      demandOption: true,
      description:
        "The number of times to send the message. Every message except the first one will have its index added as suffix.",
    })
    .option("dst-chain", {
      type: "string",
      demandOption: true,
      description: "Destination chain name or identifier",
    })
    .option("fee", {
      type: "string",
      demandOption: true,
      description: "Fee to pay for sending the message",
    })
    .option("custom-gas-limit", {
      type: "string",
      demandOption: true,
      description: "Custom gas limit",
    })
    .option("text", {
      type: "array",
      demandOption: true,
      description: "The text to send",
    })
    .argv;

  const times = Number(argv["times"]);
  const dstChain = argv["dst-chain"];
  const uipFee = new BN(argv["fee"]);
  const customGasLimit = new BN(argv["custom-gas-limit"]);
  const baseText = argv["text"].join(" ");

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const payer = (provider.wallet as NodeWallet).payer;

  let destination: Destination | bigint;
  switch (dstChain) {
    case "solana-mainnet":
      destination = { solanaMainnet: {} };
      break;
    case "solana-devnet":
      destination = { solanaDevnet: {} };
      break;
    case "ethereum":
      destination = { ethereum: {} };
      break;
    case "ethereum-sepolia":
      destination = { ethereumSepolia: {} };
      break;
    case "polygon":
      destination = { polygon: {} };
      break;
    case "polygon-amoy":
      destination = { polygonAmoy: {} };
      break;
    case "mantle":
      destination = { mantle: {} };
      break;
    case "mantle-sepolia":
      destination = { mantleSepolia: {} };
      break;
    case "eib":
      destination = { eib: {} };
      break;
    case "teib":
      destination = { teib: {} };
      break;
    case "base":
      destination = { base: {} };
      break;
    case "base-sepolia":
      destination = { baseSepolia: {} };
      break;
    case "sonic":
      destination = { sonic: {} };
      break;
    case "sonic-blaze-testnet":
      destination = { sonicBlazeTestnet: {} };
      break;
    case "avalanche":
      destination = { avalanche: {} };
      break;
    case "avalanche-fuji":
      destination = { avalancheFuji: {} };
      break;
    case "manta-pacific":
      destination = { mantaPacific: {} };
      break;
    case "abstract":
      destination = { abstract: {} };
      break;
    case "berachain":
      destination = { berachain: {} };
      break;
    case "bsc":
      destination = { bsc: {} };
      break;
    case "immutable":
      destination = { immutable: {} };
      break;
    case "optimism":
      destination = { optimism: {} };
      break;
    case "arbitrum":
      destination = { arbitrum: {} };
      break;
    default:
      try {
        destination = BigInt(dstChain);
      } catch {
        throw new Error(
          "Invalid destination, must be chain ID or one of solana-mainnet, solana-devnet, ethereum-sepolia, polygon, polygon-amoy, mantle, mantle-sepolia, eib, teib, base, base-sepolia, sonic-blaze-testnet, avalanche, avalanche-fuji, ethereum, sonic, manta-pacific, abstract, berachain, bsc, immutable, optimism, arbitrum",
        );
      }
  }

  const promises = Array.from({ length: times }, async (_, i) => {
    let text = baseText;
    if (i != 0) {
      text += " " + i;
    }

    while (true) {
      try {
        const { preInstructions, instruction } = await sendMessage({
          connection: provider.connection,
          uipFee,
          customGasLimit,
          destination,
          sender: payer.publicKey,
          text,
        });
        const latestBlockhash = await provider.connection.getLatestBlockhash()
          .then((b) => b.blockhash);
        await Promise.all(preInstructions.map((ix) =>
          sendAndConfirmVersionedTx(
            provider.connection,
            toTransaction([ix], latestBlockhash, payer),
            [payer],
            payer.publicKey,
          )
        ));
        const transactionSignature = await sendAndConfirmVersionedTx(
          provider.connection,
          toTransaction([instruction], latestBlockhash, payer),
          [payer],
          payer.publicKey,
        );
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
