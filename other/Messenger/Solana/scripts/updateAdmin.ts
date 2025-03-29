import * as anchor from "@coral-xyz/anchor";
import { updateAdmin } from "../helpers/messenger";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { PublicKey } from "@solana/web3.js";

async function main(): Promise<void> {
  if (process.argv.length < 2 + 1) {
    console.error("Usage: update-admin <new-admin>");
    process.exit(1);
  }

  const newAdmin = new PublicKey(process.argv[2]);

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const payer = (provider.wallet as NodeWallet).payer;

  const { transactionSignature } = await updateAdmin({
    admin: payer,
    newAdmin,
  });

  console.log("Transaction signature:", transactionSignature);
}

main();
