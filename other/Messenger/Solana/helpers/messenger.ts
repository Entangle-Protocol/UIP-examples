import { IdlTypes, Program } from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionSignature,
} from "@solana/web3.js";
import { Messenger } from "../target/types/messenger";
import BN from "bn.js";
import { findExtension, UIP_PROGRAM } from "./endpoint";
import { CID } from "multiformats";
import { encodeU32Le } from "./utils";
import { UTS_VAULT } from "./utsMock";
import { loadChunk, MAX_CHUNK_LEN, passToCpi } from "./chunkLoader";
import { randomInt } from "crypto";

anchor.setProvider(anchor.AnchorProvider.env());
export const MESSENGER_PROGRAM: Program<Messenger> = anchor.workspace.Messenger;

export type Message = IdlTypes<Messenger>["crossChainMessage"];
export type Destination = IdlTypes<Messenger>["destination"];

export const MAX_TEXT_LEN_ONE_TX = 796;

export const MESSENGER = PublicKey.findProgramAddressSync(
  [Buffer.from("messenger")],
  MESSENGER_PROGRAM.programId,
)[0];

export const findMessage = (msgHash: number[] | Buffer) =>
  PublicKey.findProgramAddressSync(
    [
      Buffer.from("message"),
      Buffer.from(msgHash),
    ],
    MESSENGER_PROGRAM.programId,
  )[0];

export type InitializeInput = {
  payer: Keypair;
  admin: PublicKey;
  allowedSenders: Buffer[] | null;
};

export async function initialize(
  {
    payer,
    admin,
    allowedSenders,
  }: InitializeInput,
): Promise<{ transactionSignature: TransactionSignature }> {
  const transactionSignature = await MESSENGER_PROGRAM.methods
    .initialize(allowedSenders, admin)
    .accounts({
      payer: payer.publicKey,
    })
    .signers([payer])
    .rpc();
  return { transactionSignature };
}

export type RegisterExtensionInput = {
  admin: Keypair;
  payer: Keypair;
  ipfsCid: string;
};

export async function registerExtension(
  {
    admin,
    payer,
    ipfsCid,
  }: RegisterExtensionInput,
): Promise<{ transactionSignature: TransactionSignature }> {
  const transactionSignature = await MESSENGER_PROGRAM.methods
    .registerExtension(Array.from(CID.parse(ipfsCid).toV1().bytes))
    .accounts({
      payer: payer.publicKey,
      extension: findExtension(MESSENGER_PROGRAM.programId),
      admin: admin.publicKey,
      messenger: MESSENGER,
    })
    .signers([payer, admin])
    .rpc();
  return { transactionSignature };
}

export type SetAllowedSendersInput = {
  payer: Keypair;
  admin: Keypair;
  allowedSenders: Buffer[] | null;
};

export async function setAllowedSenders(
  {
    payer,
    admin,
    allowedSenders,
  }: SetAllowedSendersInput,
): Promise<{ transactionSignature: TransactionSignature }> {
  const transactionSignature = await MESSENGER_PROGRAM.methods
    .setAllowedSenders(allowedSenders)
    .accountsStrict({
      payer: payer.publicKey,
      admin: admin.publicKey,
      messenger: MESSENGER,
      systemProgram: SystemProgram.programId,
    })
    .signers([payer, admin])
    .rpc();
  return { transactionSignature };
}

export type SendMessageInput = {
  destination: Destination;
  ccmFee: BN;
  customGasLimit: BN;
  text: string;
  sender: Keypair;
  payer: Keypair;
};

export async function sendMessage(
  input: SendMessageInput,
): Promise<{ transactionSignature: TransactionSignature }> {
  if (input.text.length <= MAX_TEXT_LEN_ONE_TX) {
    return await sendMessageOneTx(input);
  } else {
    return await sendMessageManyTx(input);
  }
}

export async function sendMessageOneTx(
  {
    ccmFee,
    customGasLimit,
    destination,
    text,
    sender,
  }: SendMessageInput,
): Promise<{ transactionSignature: TransactionSignature }> {
  const transactionSignature = await MESSENGER_PROGRAM.methods
    .sendMessage(destination, ccmFee, customGasLimit, text)
    .accounts({
      utsVault: UTS_VAULT,
      sender: sender.publicKey,
    })
    .signers([sender])
    .rpc();
  return { transactionSignature };
}

async function sendMessageManyTx(
  {
    ccmFee,
    customGasLimit,
    destination,
    text,
    sender,
    payer,
  }: SendMessageInput,
): Promise<{ transactionSignature: TransactionSignature }> {
  const data = encodeSendMessageParams({
    ccmFee,
    customGasLimit,
    destination,
    text,
  });

  const chunkId = randomInt(1 << 19);

  const doLoadChunk = async (
    index: number,
    len?: number,
  ) => {
    await loadChunk({
      owner: payer,
      chunk: {
        data: data.subarray(
          index * MAX_CHUNK_LEN,
          len ? index * MAX_CHUNK_LEN + len : undefined,
        ),
        index,
      },
      chunkId,
    });
  };

  const num_extends = Math.floor(data.length / MAX_CHUNK_LEN);

  const promises: Array<Promise<void>> = [];
  for (let i = 0; i < num_extends; i++) {
    promises.push(doLoadChunk(i, MAX_CHUNK_LEN));
  }
  promises.push(doLoadChunk(num_extends));
  await Promise.all(promises);

  return await passToCpi({
    owner: payer,
    program: MESSENGER_PROGRAM.programId,
    chunkId,
    accounts: [
      { pubkey: sender.publicKey, isSigner: true, isWritable: true },
      { pubkey: UTS_VAULT, isSigner: false, isWritable: true },
      {
        pubkey: PublicKey.findProgramAddressSync(
          [Buffer.from("uip_signer")],
          MESSENGER_PROGRAM.programId,
        )[0],
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: SystemProgram.programId,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: UIP_PROGRAM.programId,
        isSigner: false,
        isWritable: false,
      },
    ],
    signers: [sender],
  });
}

export async function getMessagesBySender(
  connection: Connection,
  senderAddr: Buffer,
): Promise<Message[]> {
  const messages = await connection.getProgramAccounts(
    MESSENGER_PROGRAM.programId,
    {
      filters: [
        {
          memcmp: {
            offset: 0,
            // discriminator taken from IDL
            bytes: Buffer.from([
              13,
              175,
              177,
              236,
              30,
              82,
              224,
              162,
            ]).toString("base64"),
            encoding: "base64",
          },
        },
        {
          memcmp: {
            offset: 8 + 8 + 8 + 16,
            bytes: Buffer.from(encodeU32Le(senderAddr.length)).toString(
              "base64",
            ),
            encoding: "base64",
          },
        },
        {
          memcmp: {
            offset: 8 + 8 + 8 + 16 + 4,
            bytes: senderAddr.toString("base64"),
            encoding: "base64",
          },
        },
      ],
    },
  );

  return messages.map((message) =>
    MESSENGER_PROGRAM.account.crossChainMessage.coder.accounts.decode(
      "crossChainMessage",
      message.account.data,
    )
  );
}

const SEND_MESSAGE_DISCRIMINATOR = [57, 40, 34, 178, 189, 10, 65, 26];

type SendMessgeParams = {
  destination: Destination;
  ccmFee: BN;
  customGasLimit: BN;
  text: string;
};

export function encodeSendMessageParams({
  destination,
  ccmFee,
  customGasLimit,
  text,
}: SendMessgeParams): Buffer {
  const res = Buffer.alloc(8 + 1 + 8 + 16 + 4 + text.length);
  let offset = 0;

  res.set(SEND_MESSAGE_DISCRIMINATOR, offset);
  offset += 8;

  let destinationNum: number;
  if (destination.solanaMainnet) {
    destinationNum = 0;
  } else if (destination.solanaDevnet) {
    destinationNum = 1;
  } else if (destination.ethereumSepolia) {
    destinationNum = 2;
  } else if (destination.polygonAmoy) {
    destinationNum = 3;
  } else if (destination.mantleSepolia) {
    destinationNum = 4;
  } else if (destination.teib) {
    destinationNum = 5;
  } else {
    throw new Error("invalid destination");
  }

  res.set([destinationNum], offset);
  offset += 1;

  res.set(ccmFee.toArrayLike(Buffer, "le", 8), offset);
  offset += 8;

  res.set(customGasLimit.toArrayLike(Buffer, "le", 16), offset);
  offset += 16;

  res.writeUint32LE(text.length, offset);
  offset += 4;
  res.set(new TextEncoder().encode(text), offset);
  offset += text.length;

  return res;
}
