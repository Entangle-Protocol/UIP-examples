import BN from "bn.js";
import { AnchorProvider, Coder } from "@coral-xyz/anchor";
import {
  BlockhashWithExpiryBlockHeight,
  Commitment,
  ComputeBudgetProgram,
  Connection,
  GetAccountInfoConfig,
  PublicKey,
  RpcResponseAndContext,
  Signer,
  SimulatedTransactionResponse,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";

export function hexToBytes(hex: string): Buffer {
  return Buffer.from(hex.startsWith("0x") ? hex.slice(2) : hex, "hex");
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
  instructions: TransactionInstruction[],
  payerKey: PublicKey,
): Promise<RpcResponseAndContext<SimulatedTransactionResponse>> {
  const { verTx } = await toVersionedTx(connection, instructions, payerKey);
  return await connection.simulateTransaction(verTx, { sigVerify: false });
}

async function toVersionedTx(
  connection: Connection,
  instructions: TransactionInstruction[],
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
    instructions,
  }).compileToV0Message();

  return {
    verTx: new VersionedTransaction(messageV0),
    latestBlockhash,
  };
}

export const getMockProvider = () =>
  new AnchorProvider(
    new Connection("http://mock.mock"),
    {
      publicKey: PublicKey.default,
      async signTransaction(): Promise<any> {
        throw new Error("Please don't sign with mock wallet");
      },
      async signAllTransactions(): Promise<any[]> {
        throw new Error("Please don't sign with mock wallet");
      },
    },
  );

export type InstructionWithCu = {
  instruction: TransactionInstruction;
  cuLimit: number;
};

export const cuLimitInstruction = (ixs: InstructionWithCu[]) =>
  ComputeBudgetProgram.setComputeUnitLimit({
    units: ixs.reduce((n, { cuLimit }) => n + cuLimit, 0),
  });

export const toTransaction = (
  ixs: InstructionWithCu[],
  recentBlockhash: string,
  feePayer: Signer,
) => {
  const tx = new Transaction()
    .add(cuLimitInstruction(ixs), ...ixs.map((x) => x.instruction));
  tx.recentBlockhash = recentBlockhash;
  tx.feePayer = feePayer.publicKey;
  tx.sign(feePayer);
  return tx;
};

export const toBN = (value: BN | bigint): BN =>
  BN.isBN(value) ? value : new BN((value as bigint).toString(16), 16);

export async function fetchAccount<T>(
  connection: Connection,
  coder: Coder<string, string>,
  publicKey: PublicKey,
  accountName: string,
  commitmentOrConfig?: Commitment | GetAccountInfoConfig,
): Promise<T | null> {
  const acc = await connection.getAccountInfo(publicKey, commitmentOrConfig);

  if (!acc || acc.data === null || acc.data.length === 0) {
    return null;
  }

  return coder.accounts.decode<T>(accountName, acc.data);
}
