import * as anchor from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { expect } from "bun:test";
import { initialize, registerExtension } from "../helpers/exampleToken";
import { readKeypairFromFile } from "../helpers/utils";

async function main(): Promise<void> {
  if (process.argv.length < 2 + 1) {
    console.error("Usage: initialize <ipfs-cid> <decimals>");
    process.exit(1);
  }

  const ipfsCid = process.argv[2];
  const decimals = Number(process.argv[3]);

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const payer = (provider.wallet as NodeWallet).payer;

  const admin = readKeypairFromFile("keys/admin.json");

  try {
    const { transactionSignature } = await initialize({
      payer,
      admin: admin.publicKey,
      decimals,
    });
    console.log("Initialize transaction signature:", transactionSignature);
  } catch (e) {
    expect(e.toString()).toInclude("already in use");
    console.warn("Already initialized");
  }

  const { transactionSignature } = await registerExtension({
    admin,
    payer,
    ipfsCid,
  });
  console.log("RegisterExtension transaction signature:", transactionSignature);
}

main();
