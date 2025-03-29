import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { EXA_MINT, mint } from "../helpers/exampleToken";
import { BN } from "bn.js";
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";

async function main(): Promise<void> {
  if (process.argv.length < 2 + 2) {
    console.error("Usage: mint <owner> <amount>");
    process.exit(1);
  }

  const owner = new PublicKey(process.argv[2]);
  const amount = new BN(process.argv[3]);

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const payer = (provider.wallet as NodeWallet).payer;

  await getOrCreateAssociatedTokenAccount(
    provider.connection,
    payer,
    EXA_MINT,
    owner,
  );

  const { transactionSignature } = await mint({
    admin: payer,
    amount,
    owner,
  });
  console.log("Mint transaction signature:", transactionSignature);
}

main();
