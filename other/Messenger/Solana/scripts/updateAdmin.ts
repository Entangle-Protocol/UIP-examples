import * as anchor from "@coral-xyz/anchor";
import { updateAdmin } from "@lincot/uip-solana-messenger-example";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { PublicKey } from "@solana/web3.js";
import { toTransaction } from "@lincot/uip-solana-sdk";
import { sendAndConfirmVersionedTx } from "../helpers/utils";

async function main(): Promise<void> {
  if (process.argv.length < 2 + 1) {
    console.error("Usage: update-admin <new-admin>");
    process.exit(1);
  }

  const newAdmin = new PublicKey(process.argv[2]);

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const payer = (provider.wallet as NodeWallet).payer;

  const ix = await updateAdmin({
    admin: payer.publicKey,
    newAdmin,
  });

  const transactionSignature = await sendAndConfirmVersionedTx(
    provider.connection,
    toTransaction(
      [ix],
      await provider.connection.getLatestBlockhash().then((b) => b.blockhash),
      payer,
    ),
    [payer],
    payer.publicKey,
  );

  console.log("Transaction signature:", transactionSignature);
}

main();
