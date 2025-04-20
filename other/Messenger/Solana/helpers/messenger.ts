import { IdlTypes, Program } from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import { Messenger } from "../target/types/messenger";
import BN from "bn.js";
import {
  ENDPOINT_CONFIG,
  fetchUtsConfig,
  findExtension,
  PROGRAM_ID as ENDPOINT_PROGRAM_ID,
} from "@lincot/uip-solana-sdk";
import { CID } from "multiformats";
import { encodeU32Le } from "./utils";
import {
  InstructionWithCu,
  loadByChunks,
  passToCpi,
} from "@lincot/solana-chunk-loader";
import { randomInt } from "crypto";

anchor.setProvider(anchor.AnchorProvider.env());
export const MESSENGER_PROGRAM: Program<Messenger> = anchor.workspace.Messenger;

export type Message = IdlTypes<Messenger>["crossChainMessage"];
export type Destination = IdlTypes<Messenger>["destination"];

export const MAX_TEXT_LEN_ONE_TX = 817;

export const MESSENGER = PublicKey.findProgramAddressSync(
  [Buffer.from("MESSENGER")],
  MESSENGER_PROGRAM.programId,
)[0];

export const findMessage = (msgHash: number[] | Buffer) =>
  PublicKey.findProgramAddressSync(
    [
      Buffer.from("MESSAGE"),
      Buffer.from(msgHash),
    ],
    MESSENGER_PROGRAM.programId,
  )[0];

export type InitializeInput = {
  payer: PublicKey;
  admin: PublicKey;
  allowedSenders: Buffer[] | null;
};

export async function initialize(
  {
    payer,
    admin,
    allowedSenders,
  }: InitializeInput,
): Promise<InstructionWithCu> {
  const instruction = await MESSENGER_PROGRAM.methods
    .initialize(allowedSenders, admin)
    .accounts({ payer })
    .instruction();
  return { instruction, cuLimit: 50_000 };
}

export type RegisterExtensionInput = {
  admin: PublicKey;
  payer: PublicKey;
  ipfsCid: string;
};

export async function registerExtension(
  {
    admin,
    payer,
    ipfsCid,
  }: RegisterExtensionInput,
): Promise<InstructionWithCu> {
  const instruction = await MESSENGER_PROGRAM.methods
    .registerExtension(Array.from(CID.parse(ipfsCid).toV1().bytes))
    .accounts({
      payer,
      extension: findExtension(MESSENGER_PROGRAM.programId),
      admin,
      messenger: MESSENGER,
    })
    .instruction();
  return { instruction, cuLimit: 30_000 };
}

export type UpdateAdmin = {
  admin: PublicKey;
  newAdmin: PublicKey;
};

export async function updateAdmin(
  { admin, newAdmin }: UpdateAdmin,
): Promise<InstructionWithCu> {
  const instruction = await MESSENGER_PROGRAM.methods
    .updateAdmin(newAdmin)
    .accountsStrict({
      messenger: MESSENGER,
      admin,
    })
    .instruction();
  return { instruction, cuLimit: 20_000 };
}

export type SetAllowedSendersInput = {
  payer: PublicKey;
  admin: PublicKey;
  allowedSenders: Buffer[] | null;
};

export async function setAllowedSenders(
  {
    payer,
    admin,
    allowedSenders,
  }: SetAllowedSendersInput,
): Promise<InstructionWithCu> {
  const instruction = await MESSENGER_PROGRAM.methods
    .setAllowedSenders(allowedSenders)
    .accountsStrict({
      payer,
      admin,
      messenger: MESSENGER,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
  return { instruction, cuLimit: 30_000 };
}

export type SendMessageInput = {
  connection: Connection;
  destination: Destination;
  uipFee: BN;
  customGasLimit: BN;
  text: string;
  sender: PublicKey;
};

export async function sendMessage(
  input: SendMessageInput,
): Promise<
  { preInstructions: InstructionWithCu[]; instruction: InstructionWithCu }
> {
  if (input.text.length <= MAX_TEXT_LEN_ONE_TX) {
    return { preInstructions: [], instruction: await sendMessageOneTx(input) };
  } else {
    return await sendMessageManyTx(input);
  }
}

export async function sendMessageOneTx(
  {
    connection,
    uipFee,
    customGasLimit,
    destination,
    text,
    sender,
  }: SendMessageInput,
): Promise<InstructionWithCu> {
  const instruction = await MESSENGER_PROGRAM.methods
    .sendMessage(destination, uipFee, customGasLimit, text)
    .accounts({
      endpointConfig: ENDPOINT_CONFIG,
      utsConnector: await fetchUtsConfig(connection).then((x) =>
        x.utsConnector
      ),
      sender,
    })
    .instruction();
  return { instruction, cuLimit: 50_000 };
}

async function sendMessageManyTx(
  {
    connection,
    uipFee,
    customGasLimit,
    destination,
    text,
    sender,
  }: SendMessageInput,
): Promise<
  { preInstructions: InstructionWithCu[]; instruction: InstructionWithCu }
> {
  const data = encodeSendMessageParams({
    uipFee,
    customGasLimit,
    destination,
    text,
  });
  const chunkHolderId = randomInt(1 << 19);
  const preInstructions = await loadByChunks({
    owner: sender,
    data,
    chunkHolderId,
  });

  const instruction = await passToCpi({
    owner: sender,
    program: MESSENGER_PROGRAM.programId,
    chunkHolderId,
    accounts: [
      { pubkey: sender, isSigner: true, isWritable: true },
      { pubkey: ENDPOINT_CONFIG, isSigner: false, isWritable: false },
      {
        pubkey: await fetchUtsConfig(connection).then((x) => x.utsConnector),
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: PublicKey.findProgramAddressSync(
          [Buffer.from("UIP_SIGNER")],
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
        pubkey: ENDPOINT_PROGRAM_ID,
        isSigner: false,
        isWritable: false,
      },
    ],
    cpiComputeUnits: 30_000,
  });

  return { preInstructions, instruction };
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
  uipFee: BN;
  customGasLimit: BN;
  text: string;
};

export function encodeSendMessageParams({
  destination,
  uipFee,
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
  } else if (destination.baseSepolia) {
    destinationNum = 6;
  } else {
    throw new Error("invalid destination");
  }

  res.set([destinationNum], offset);
  offset += 1;

  res.set(uipFee.toArrayLike(Buffer, "le", 8), offset);
  offset += 8;

  res.set(customGasLimit.toArrayLike(Buffer, "le", 16), offset);
  offset += 16;

  res.writeUint32LE(text.length, offset);
  offset += 4;
  res.set(new TextEncoder().encode(text), offset);
  offset += text.length;

  return res;
}
