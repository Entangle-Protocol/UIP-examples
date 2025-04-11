import { IdlTypes, Program } from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import BN from "bn.js";
import {
  AccountMeta,
  ComputeBudgetProgram,
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionSignature,
} from "@solana/web3.js";
import { UipEndpoint } from "../target/types/uip_endpoint";
import { BaseWallet, BytesLike, ethers } from "ethers";
import { decodeI128Le, simulateTransaction, SOLANA_CHAIN_ID } from "./utils";

anchor.setProvider(anchor.AnchorProvider.env());
export const UIP_PROGRAM: Program<UipEndpoint> = anchor.workspace.UipEndpoint;

export type MessageData = IdlTypes<UipEndpoint>["messageData"];
export type SignatureEcdsa = IdlTypes<UipEndpoint>["signatureEcdsa"];
export type TransmitterParams = IdlTypes<UipEndpoint>["transmitterParams"];

export const ENDPOINT_CONFIG = PublicKey.findProgramAddressSync(
  [Buffer.from("ENDPOINT_CONFIG")],
  UIP_PROGRAM.programId,
)[0];

const IMPOSSIBLE_MESSAGE = PublicKey.findProgramAddressSync(
  [Buffer.from("IMPOSSIBLE_MESSAGE")],
  UIP_PROGRAM.programId,
)[0];

export const findMessage = (msg: MessageData) =>
  PublicKey.findProgramAddressSync(
    [Buffer.from("MESSAGE"), msgHashFull(msg)],
    UIP_PROGRAM.programId,
  )[0];

export const findExtension = (program: PublicKey) =>
  PublicKey.findProgramAddressSync([
    Buffer.from("EXTENSION"),
    program.toBuffer(),
  ], UIP_PROGRAM.programId)[0];

export type SimulateExecuteLiteInput = {
  payload: Buffer;
  srcChainId: BN;
  senderAddr: Buffer;
  destAddr: PublicKey;
  payer: PublicKey;
  accounts: AccountMeta[];
  computeUnits?: number;
};

export async function simulateExecuteLite(
  {
    payload,
    srcChainId,
    senderAddr,
    destAddr,
    payer,
    accounts,
    computeUnits,
  }: SimulateExecuteLiteInput,
): Promise<bigint> {
  const preInstructions = new Array<TransactionInstruction>();
  if (computeUnits != undefined) {
    preInstructions.push(ComputeBudgetProgram.setComputeUnitLimit({
      units: computeUnits,
    }));
  }

  const tx = await UIP_PROGRAM.methods
    .simulateExecuteLite(payload, srcChainId, senderAddr)
    .accountsStrict({
      message: IMPOSSIBLE_MESSAGE,
      payer,
      dstProgram: destAddr,
    })
    .remainingAccounts(accounts)
    .preInstructions(preInstructions)
    .transaction();

  const simulation = await simulateTransaction(
    UIP_PROGRAM.provider.connection,
    tx,
    payer,
  );

  if (simulation.value.returnData) {
    const binary = Buffer.from(simulation.value.returnData.data[0], "base64");
    return decodeI128Le(binary);
  } else {
    throw new Error(
      `Failed to simulate the transaction\n${JSON.stringify(simulation)}`,
    );
  }
}

export type ExecuteFullInput = {
  executor: Keypair;
  msgData: MessageData;
  signatures: SignatureEcdsa[];
  superSignatures: SignatureEcdsa[];
  accounts: AccountMeta[];
  spendingLimit: BN;
  computeUnits?: number;
  computePrice?: number;
};

// loads, signs and executes
export async function executeFull(
  {
    executor,
    msgData,
    signatures,
    superSignatures,
    accounts,
    spendingLimit,
    computeUnits,
  }: ExecuteFullInput,
): Promise<{ transactionSignature: TransactionSignature; message: PublicKey }> {
  const preInstructions = new Array<TransactionInstruction>();
  if (computeUnits != undefined) {
    preInstructions.push(ComputeBudgetProgram.setComputeUnitLimit({
      units: computeUnits,
    }));
  }

  const message = findMessage(msgData);

  preInstructions.push(
    await UIP_PROGRAM.methods
      .loadMessage(msgData)
      .accountsStrict({
        executor: executor.publicKey,
        endpointConfig: ENDPOINT_CONFIG,
        message,
        systemProgram: SystemProgram.programId,
      })
      .signers([executor])
      .instruction(),
  );

  preInstructions.push(
    await UIP_PROGRAM.methods
      .checkConsensus(signatures, superSignatures)
      .accounts({
        endpointConfig: ENDPOINT_CONFIG,
        message,
        executor: executor.publicKey,
      })
      .instruction(),
  );

  const tx = await UIP_PROGRAM.methods
    .execute(spendingLimit)
    .accounts({
      endpointConfig: ENDPOINT_CONFIG,
      message,
      executor: executor.publicKey,
      dstProgram: msgData.initialProposal.destAddr,
    })
    .preInstructions(preInstructions)
    .remainingAccounts(accounts)
    .signers([executor])
    .transaction();

  tx.signatures = [];
  tx.feePayer = executor.publicKey;

  const transactionSignature = await UIP_PROGRAM.provider.connection
    .sendTransaction(tx, [executor]);
  const latestBlockHash = await UIP_PROGRAM.provider.connection
    .getLatestBlockhash();
  await UIP_PROGRAM.provider.connection.confirmTransaction({
    blockhash: latestBlockHash.blockhash,
    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
    signature: transactionSignature,
  });

  return { transactionSignature, message };
}

export type UnloadMessageInput = {
  payer: Keypair;
  message: PublicKey;
};

export async function unloadMessage(
  {
    payer,
    message,
  }: UnloadMessageInput,
): Promise<{ transactionSignature: TransactionSignature }> {
  const transactionSignature = await UIP_PROGRAM.methods
    .unloadMessage()
    .accountsStrict({
      payer: payer.publicKey,
      endpointConfig: ENDPOINT_CONFIG,
      message,
    })
    .signers([payer])
    .rpc();
  return { transactionSignature };
}

type MessageDataEth = {
  initialProposal: ProposalEth;
  srcChainData: SrcChainDataEth;
};

type ProposalEth = {
  destChainId: bigint;
  totalFee: bigint;
  selector: BytesLike;
  senderAddr: BytesLike;
  destAddr: BytesLike;
  payload: BytesLike;
  reserved: BytesLike;
  transmitterParams: BytesLike;
};

type SrcChainDataEth = {
  srcChainId: bigint;
  srcBlockNumber: bigint;
  srcOpTxId: [BytesLike, BytesLike];
};

function msgHash(msgData: MessageDataEth) {
  return ethers.solidityPackedKeccak256(
    [
      "uint256",
      "uint256",
      "bytes32",
      "uint256",
      "bytes",
      "uint256",
      "bytes",
      "uint256",
      "bytes",
      "uint256",
      "bytes",
      "uint256",
      "bytes",
      "uint256",
      "bytes32",
      "bytes32",
    ],
    [
      msgData.initialProposal.destChainId,
      msgData.initialProposal.totalFee,
      msgData.initialProposal.selector,
      msgData.initialProposal.senderAddr.length,
      msgData.initialProposal.senderAddr,
      msgData.initialProposal.destAddr.length,
      msgData.initialProposal.destAddr,
      msgData.initialProposal.payload.length,
      msgData.initialProposal.payload,
      msgData.initialProposal.reserved.length,
      msgData.initialProposal.reserved,
      msgData.initialProposal.transmitterParams.length,
      msgData.initialProposal.transmitterParams,
      (msgData.srcChainData.srcChainId << 128n) +
      msgData.srcChainData.srcBlockNumber,
      msgData.srcChainData.srcOpTxId[0],
      msgData.srcChainData.srcOpTxId[1],
    ],
  );
}

function convertMsgData(msgData: MessageData): MessageDataEth {
  return {
    initialProposal: {
      destChainId: BigInt(SOLANA_CHAIN_ID.toString()),
      totalFee: BigInt(msgData.initialProposal.totalFee.toString()),
      selector: Buffer.from(msgData.initialProposal.selector),
      senderAddr: msgData.initialProposal.senderAddr,
      destAddr: msgData.initialProposal.destAddr.toBuffer(),
      payload: msgData.initialProposal.payload,
      reserved: msgData.initialProposal.reserved,
      transmitterParams: msgData.initialProposal.transmitterParams,
    },
    srcChainData: {
      srcChainId: BigInt(msgData.srcChainData.srcChainId.toString()),
      srcBlockNumber: BigInt(msgData.srcChainData.srcBlockNumber.toString()),
      srcOpTxId: [
        Buffer.from(msgData.srcChainData.srcOpTxId[0]),
        Buffer.from(msgData.srcChainData.srcOpTxId[1]),
      ] as [Buffer, Buffer],
    },
  };
}

function _msgHashFull(msgData: MessageDataEth) {
  return ethers.solidityPackedKeccak256(
    ["string", "bytes32"],
    ["\x19Ethereum Signed Message:\n32", ethers.getBytes(msgHash(msgData))],
  );
}

export function hexToBytes(hex: string): Buffer {
  return Buffer.from(hex.startsWith("0x") ? hex.slice(2) : hex, "hex");
}

export function msgHashFull(msgData: MessageData): Buffer {
  return Buffer.from(hexToBytes(_msgHashFull(convertMsgData(msgData))));
}

export function signMsg(
  transmitter: BaseWallet,
  msg: MessageData,
): SignatureEcdsa {
  const hash = ethers.getBytes(msgHash(convertMsgData(msg)));
  const sign = ethers.Signature.from(transmitter.signMessageSync(hash));
  const v = sign.v;
  const r = hexToBytes(sign.r);
  const s = hexToBytes(sign.s);
  return { v, r: Array.from(r), s: Array.from(s) };
}

export function encodeTransmitterParams(
  transmitterParams: TransmitterParams,
): Buffer {
  return hexToBytes(ethers.solidityPacked(["uint256", "uint256"], [
    transmitterParams.proposalCommitment.confirmed ? 1 : 0,
    BigInt(transmitterParams.customGasLimit.toString()),
  ]));
}

export async function fetchUtsConnector(): Promise<PublicKey> {
  return await UIP_PROGRAM.account.utsConfig.fetch(
    new PublicKey("CTspuKSu7eRXzKqtYzR83H5VCZMWVRC4uRLfrA5Cy8WX"),
  ).then((c) => c.utsConnector);
}
