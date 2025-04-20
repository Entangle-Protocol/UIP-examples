import {
  BlockhashWithExpiryBlockHeight,
  Connection,
  Keypair,
  PublicKey,
  RpcResponseAndContext,
  sendAndConfirmTransaction,
  Signer,
  SimulatedTransactionResponse,
  SystemProgram,
  Transaction,
  TransactionMessage,
  TransactionSignature,
  VersionedTransaction,
} from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider, BN } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { readFileSync } from "fs";

const SOLANA_MAINNET_CHAIN_ID = new BN("11100000000000000501");
const SOLANA_DEVNET_CHAIN_ID = new BN("100000000000000000000");
const ETHEREUM_CHAIN_ID = new BN("1");
const ETHEREUM_SEPOLIA_CHAIN_ID = new BN("11155111");
const POLYGON_CHAIN_ID = new BN("137");
const POLYGON_AMOY_CHAIN_ID = new BN("80002");
const MANTLE_CHAIN_ID = new BN("5000");
const MANTLE_SEPOLIA_CHAIN_ID = new BN("5003");
const EIB_CHAIN_ID = new BN("33033");
const TEIB_CHAIN_ID = new BN("33133");
const BASE_CHAIN_ID = new BN("8453");
const BASE_SEPOLIA_CHAIN_ID = new BN("84532");
const SONIC_MAINNET_CHAIN_ID = new BN("146");
const SONIC_BLAZE_TESTNET_CHAIN_ID = new BN("57054");
const AVALANCHE_C_CHAIN_CHAIN_ID = new BN("43114");
const AVALANCHE_FUJI_CHAIN_ID = new BN("43113");
const MANTA_PACIFIC_CHAIN_ID = new BN(169);

// export const SOLANA_CHAIN_ID =
//   anchor.AnchorProvider.env().connection.rpcEndpoint.includes("devnet")
//     ? SOLANA_DEVNET_CHAIN_ID
//     : SOLANA_MAINNET_CHAIN_ID;
export const solanaChainId = SOLANA_DEVNET_CHAIN_ID;

export function setupTests(): { provider: AnchorProvider; payer: Keypair } {
  const provider = AnchorProvider.env();
  anchor.setProvider(provider);
  const payer = (provider.wallet as NodeWallet).payer;
  return { provider, payer };
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
  if (chainId.eq(SOLANA_MAINNET_CHAIN_ID)) {
    return "Solana Mainnet";
  } else if (chainId.eq(SOLANA_DEVNET_CHAIN_ID)) {
    return "Solana Devnet";
  } else if (chainId.eq(ETHEREUM_CHAIN_ID)) {
    return "Ethereum";
  } else if (chainId.eq(ETHEREUM_SEPOLIA_CHAIN_ID)) {
    return "Ethereum Sepolia";
  } else if (chainId.eq(POLYGON_CHAIN_ID)) {
    return "Polygon";
  } else if (chainId.eq(POLYGON_AMOY_CHAIN_ID)) {
    return "Polygon Amoy";
  } else if (chainId.eq(MANTLE_CHAIN_ID)) {
    return "Mantle";
  } else if (chainId.eq(MANTLE_SEPOLIA_CHAIN_ID)) {
    return "Mantle Sepolia";
  } else if (chainId.eq(EIB_CHAIN_ID)) {
    return "EIB";
  } else if (chainId.eq(TEIB_CHAIN_ID)) {
    return "TEIB";
  } else if (chainId.eq(BASE_CHAIN_ID)) {
    return "Base";
  } else if (chainId.eq(BASE_SEPOLIA_CHAIN_ID)) {
    return "Base Sepolia";
  } else if (chainId.eq(SONIC_MAINNET_CHAIN_ID)) {
    return "Sonic Mainnet";
  } else if (chainId.eq(SONIC_BLAZE_TESTNET_CHAIN_ID)) {
    return "Sonic Blaze Testnet";
  } else if (chainId.eq(AVALANCHE_C_CHAIN_CHAIN_ID)) {
    return "Avalanche C-Chain";
  } else if (chainId.eq(AVALANCHE_FUJI_CHAIN_ID)) {
    return "Avalanche Fuji";
  } else if (chainId.eq(MANTA_PACIFIC_CHAIN_ID)) {
    return "Manta Pacific";
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

export async function sendAndConfirmVersionedTx(
  connection: Connection,
  tx: Transaction,
  signers: Signer[],
  payerKey: PublicKey,
): Promise<TransactionSignature> {
  const { verTx, latestBlockhash } = await toVersionedTx(
    connection,
    tx,
    payerKey,
  );
  verTx.sign(signers);

  const transactionSignature = await connection
    .sendTransaction(verTx);

  await connection.confirmTransaction({
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    signature: transactionSignature,
  });

  return transactionSignature;
}

async function toVersionedTx(
  connection: Connection,
  tx: Transaction,
  payerKey: PublicKey,
): Promise<
  {
    verTx: VersionedTransaction;
    latestBlockhash: BlockhashWithExpiryBlockHeight;
  }
> {
  const latestBlockhash = await connection.getLatestBlockhash();
  const messageV0 = new TransactionMessage({
    payerKey,
    recentBlockhash: latestBlockhash.blockhash,
    instructions: tx.instructions,
  }).compileToV0Message();

  return {
    verTx: new VersionedTransaction(messageV0),
    latestBlockhash,
  };
}

export function hexToBytes(hex: string): Buffer {
  return Buffer.from(hex.startsWith("0x") ? hex.slice(2) : hex, "hex");
}
