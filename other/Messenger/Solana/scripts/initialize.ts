import yargs from "yargs";
import * as anchor from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { expect } from "bun:test";
import {
  initialize,
  registerExtension,
  setAllowedSenders,
} from "../helpers/messenger";
import { hexToBytes } from "../helpers/endpoint";

async function main(): Promise<void> {
  const argv = yargs(process.argv.slice(2))
    .option("extension", {
      type: "string",
      demandOption: true,
      description: "Extension IPFS CID",
    })
    .array("allowed-senders")
    .argv;

  const ipfsCid: string = argv["extension"];
  const allowedSenders: Buffer[] = argv["allowed-senders"]
    ? argv["allowed-senders"].map((addr: string) => hexToBytes(addr))
    : null;

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const payer = (provider.wallet as NodeWallet).payer;

  try {
    const { transactionSignature } = await initialize({
      payer,
      admin: payer.publicKey,
      allowedSenders,
    });
    console.log("Initialize transaction signature:", transactionSignature);
  } catch (e) {
    expect(e.toString()).toInclude("already in use");
    const { transactionSignature } = await setAllowedSenders({
      payer,
      admin: payer,
      allowedSenders,
    });
    console.log(
      "SetAllowedSenders transaction signature:",
      transactionSignature,
    );
  }

  const { transactionSignature } = await registerExtension({
    admin: payer,
    payer,
    ipfsCid,
  });
  console.log("RegisterExtension transaction signature:", transactionSignature);
}

main();
