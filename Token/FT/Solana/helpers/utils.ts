import {
  Connection,
  Keypair,
  PublicKey,
  RpcResponseAndContext,
  sendAndConfirmTransaction,
  SimulatedTransactionResponse,
  SystemProgram,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { BN } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { readFileSync } from "fs";

export const SOLANA_MAINNET_CHAIN_ID = new BN("11100000000000000501");
export const SOLANA_DEVNET_CHAIN_ID = new BN("100000000000000000000");
export const SEPOLIA_CHAIN_ID = new BN("11155111");
export const POLYGON_AMOY_CHAIN_ID = new BN("80002");
export const POLYGON_CHAIN_ID = new BN("137");
export const EIB_CHAIN_ID = new BN("33033");
export const TEIB_CHAIN_ID = new BN("33133");

export const SOLANA_CHAIN_ID = SOLANA_DEVNET_CHAIN_ID;

export function setupTests(): { connection: Connection; payer: Keypair } {
  const provider = anchor.AnchorProvider.env();
  const connection = provider.connection;
  anchor.setProvider(provider);
  const payer = (provider.wallet as NodeWallet).payer;
  return { connection, payer };
}

export async function disperse(
  connection: Connection,
  toPubkeys: PublicKey[],
  fromKeypair: Keypair,
  amount: number,
): Promise<void> {
  const tx = new Transaction();
  for (const toPubkey of toPubkeys) {
    tx.add(
      SystemProgram.transfer({
        fromPubkey: fromKeypair.publicKey,
        lamports: amount,
        toPubkey,
      }),
    );
  }
  await sendAndConfirmTransaction(connection, tx, [fromKeypair]);
}

export async function transfer(
  connection: Connection,
  from: Keypair,
  to: PublicKey,
  lamports: number,
): Promise<void> {
  await sendAndConfirmTransaction(
    connection,
    new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: from.publicKey,
        toPubkey: to,
        lamports,
      }),
    ),
    [from],
  );
}

export async function transferEverything(
  connection: Connection,
  fromKeypairs: Keypair[],
  toKeypair: Keypair,
): Promise<void> {
  if (fromKeypairs.length == 0) {
    return;
  }

  const tx = new Transaction();
  for (const fromKeypair of fromKeypairs) {
    const lamports = await connection.getBalance(fromKeypair.publicKey);

    tx.add(
      SystemProgram.transfer({
        fromPubkey: fromKeypair.publicKey,
        lamports,
        toPubkey: toKeypair.publicKey,
      }),
    );
  }

  tx.feePayer = toKeypair.publicKey;

  await sendAndConfirmTransaction(
    connection,
    tx,
    [toKeypair].concat(fromKeypairs),
  );
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function readKeypairFromFile(filepath: string): Keypair {
  const contents = readFileSync(filepath, "utf-8");
  const parsedContents = JSON.parse(contents);
  return Keypair.fromSecretKey(new Uint8Array(parsedContents));
}

export function formatChainId(chainId: BN): string {
  if (chainId.eq(SOLANA_DEVNET_CHAIN_ID)) {
    return "Solana devnet";
  } else if (chainId.eq(SOLANA_MAINNET_CHAIN_ID)) {
    return "Solana mainnet";
  } else if (chainId.eq(SEPOLIA_CHAIN_ID)) {
    return "Sepolia";
  } else if (chainId.eq(POLYGON_AMOY_CHAIN_ID)) {
    return "Polygon amoy";
  } else if (chainId.eq(TEIB_CHAIN_ID)) {
    return "TEIB";
  } else if (chainId.eq(EIB_CHAIN_ID)) {
    return "EIB";
  } else {
    return "chain id " + chainId.toString();
  }
}

export function encodeU32Le(value: number): ArrayBuffer {
  const buffer = new ArrayBuffer(4);
  const dataView = new DataView(buffer);
  dataView.setUint32(0, value, true);
  return buffer;
}

export function decodeI128Le(buffer: Buffer) {
  if (buffer.length !== 16) {
    throw new Error("Invalid input length for i128");
  }

  const low = BigInt(
    buffer.subarray(0, 8).reduce(
      (sum, byte, i) => sum + (BigInt(byte) << BigInt(8 * i)),
      BigInt(0),
    ),
  );
  const high = BigInt(
    buffer.subarray(8, 16).reduce(
      (sum, byte, i) => sum + (BigInt(byte) << BigInt(8 * i)),
      BigInt(0),
    ),
  );

  const combined = (high << BigInt(64)) | low;

  return combined >= BigInt(1) << BigInt(127)
    ? combined - (BigInt(1) << BigInt(128))
    : combined;
}

export async function simulateTransaction(
  connection: Connection,
  tx: Transaction,
  payerKey: PublicKey,
): Promise<RpcResponseAndContext<SimulatedTransactionResponse>> {
  const messageV0 = new TransactionMessage({
    payerKey,
    recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
    instructions: tx.instructions,
  }).compileToV0Message();

  const versionedTx = new VersionedTransaction(messageV0);

  return await connection
    .simulateTransaction(
      versionedTx,
      {
        sigVerify: false,
      },
    );
}
