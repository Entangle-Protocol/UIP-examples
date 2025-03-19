import * as anchor from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { expect } from "bun:test";
import {
  initialize,
  registerExtension,
  setAllowedSenders,
} from "../helpers/messenger";
import { hexToBytes } from "../helpers/endpoint";
import { readKeypairFromFile } from "../helpers/utils";

async function main(): Promise<void> {
  if (process.argv.length < 2 + 1) {
    console.error("Usage: initialize <ipfs-cid> <allowed-senders-hex>...");
    process.exit(1);
  }

  const ipfsCid = process.argv[2];
  let allowedSenders: Array<Buffer> | null = null;
  if (process.argv.length > 2 + 1) {
    allowedSenders = process.argv.slice(3).map(hexToBytes);
  }

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const payer = (provider.wallet as NodeWallet).payer;

  const admin = readKeypairFromFile("keys/admin.json");

  try {
    const { transactionSignature } = await initialize({
      payer,
      admin: admin.publicKey,
      allowedSenders,
    });
    console.log("Initialize transaction signature:", transactionSignature);
  } catch (e) {
    expect(e.toString()).toInclude("already in use");
    const { transactionSignature } = await setAllowedSenders({
      payer,
      admin,
      allowedSenders,
    });
    console.log(
      "SetAllowedSenders transaction signature:",
      transactionSignature,
    );
  }

  const { transactionSignature } = await registerExtension({
    admin,
    payer,
    ipfsCid,
  });
  console.log("RegisterExtension transaction signature:", transactionSignature);
}

main();
