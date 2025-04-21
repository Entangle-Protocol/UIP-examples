import yargs from "yargs";
import * as anchor from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { expect } from "bun:test";
import {
  initialize,
  registerExtension,
  setAllowedSenders,
  toTransaction,
} from "@lincot/uip-solana-messenger-example";
import { hexToBytes, sendAndConfirmVersionedTx } from "../helpers/utils";

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
    const ix = await initialize({
      payer: payer.publicKey,
      admin: payer.publicKey,
      allowedSenders,
    });
    const transactionSignature = sendAndConfirmVersionedTx(
      provider.connection,
      toTransaction(
        [ix],
        await provider.connection.getLatestBlockhash().then((b) => b.blockhash),
        payer,
      ),
      [payer],
      payer.publicKey,
    );
    console.log("Initialize transaction signature:", transactionSignature);
  } catch (e) {
    expect(e.toString()).toInclude("already in use");
    const ix = await setAllowedSenders({
      payer: payer.publicKey,
      admin: payer.publicKey,
      allowedSenders,
    });
    const transactionSignature = sendAndConfirmVersionedTx(
      provider.connection,
      toTransaction(
        [ix],
        await provider.connection.getLatestBlockhash().then((b) => b.blockhash),
        payer,
      ),
      [payer],
      payer.publicKey,
    );
    console.log(
      "SetAllowedSenders transaction signature:",
      transactionSignature,
    );
  }

  const ix = await registerExtension({
    admin: payer.publicKey,
    payer: payer.publicKey,
    ipfsCid,
  });
  const transactionSignature = sendAndConfirmVersionedTx(
    provider.connection,
    toTransaction(
      [ix],
      await provider.connection.getLatestBlockhash().then((b) => b.blockhash),
      payer,
    ),
    [payer],
    payer.publicKey,
  );
  console.log("RegisterExtension transaction signature:", transactionSignature);
}

main();
