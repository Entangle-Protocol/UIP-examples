import { IdlTypes, Program } from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import {
  AccountMeta,
  Keypair,
  PublicKey,
  TransactionSignature,
} from "@solana/web3.js";
import { ChunkLoader } from "../target/types/chunk_loader";
import { BN } from "bn.js";

anchor.setProvider(anchor.AnchorProvider.env());
export const CHUNK_LOADER_PROGRAM: Program<ChunkLoader> =
  anchor.workspace.ChunkLoader;

export const MAX_CHUNK_LEN = 985;

export type Chunk = IdlTypes<ChunkLoader>["chunk"];

export const findChunkHolder = (owner: PublicKey, chunkId: number) =>
  PublicKey.findProgramAddressSync([
    Buffer.from("chunk_holder"),
    owner.toBuffer(),
    new BN(chunkId).toArrayLike(Buffer, "le", 4),
  ], CHUNK_LOADER_PROGRAM.programId)[0];

export type LoadChunkInput = {
  owner: Keypair;
  chunkId: number;
  chunk: Chunk;
};

export async function loadChunk(
  {
    owner,
    chunkId,
    chunk,
  }: LoadChunkInput,
): Promise<{ transactionSignature: TransactionSignature }> {
  const transactionSignature = await CHUNK_LOADER_PROGRAM.methods
    .loadChunk(chunkId, chunk)
    .accounts({
      owner: owner.publicKey,
    })
    .signers([owner])
    .rpc();
  return { transactionSignature };
}

export type PassToCpiInput = {
  owner: Keypair;
  chunkId: number;
  program: PublicKey;
  accounts: AccountMeta[];
  signers: Keypair[];
};

export async function passToCpi(
  {
    owner,
    program,
    chunkId,
    accounts,
    signers,
  }: PassToCpiInput,
): Promise<{ transactionSignature: TransactionSignature }> {
  const transactionSignature = await CHUNK_LOADER_PROGRAM.methods
    .passToCpi()
    .accountsStrict({
      owner: owner.publicKey,
      chunkHolder: findChunkHolder(owner.publicKey, chunkId),
      program,
    })
    .remainingAccounts(accounts)
    .signers(signers.concat([owner]))
    .rpc();
  return { transactionSignature };
}
