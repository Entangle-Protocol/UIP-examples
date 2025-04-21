import { IdlTypes, Program } from "@coral-xyz/anchor";
import {
  Commitment,
  Connection,
  GetAccountInfoConfig,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import { Messenger } from "./idl/messenger";
import messengerIdl from "./idl/messenger.json";
import BN from "bn.js";
import {
  ENDPOINT_CONFIG,
  fetchUtsConnector,
  findExtension,
  PROGRAM_ID as ENDPOINT_PROGRAM_ID,
} from "@lincot/uip-solana-sdk";
import { CID } from "multiformats";
import {
  cuLimitInstruction,
  encodeU32Le,
  fetchAccount,
  getMockProvider,
  InstructionWithCu,
  toBN,
  toTransaction,
} from "./utils";
import { loadByChunks, passToCpi } from "@lincot/solana-chunk-loader";

export { cuLimitInstruction, InstructionWithCu, toTransaction };

let _program: Program<Messenger> | undefined;
const getProgram =
  () => (_program ??= new Program(messengerIdl, getMockProvider()));

export const PROGRAM_ID = new PublicKey(messengerIdl.address);

export type Message = IdlTypes<Messenger>["crossChainMessage"];
export type MessengerAccount = IdlTypes<Messenger>["messenger"];
export type Destination = IdlTypes<Messenger>["destination"];

export const MAX_TEXT_LEN_ONE_TX = 817;

export const MESSENGER = PublicKey.findProgramAddressSync(
  [Buffer.from("MESSENGER")],
  PROGRAM_ID,
)[0];

export const findMessage = (msgHash: number[] | Buffer) =>
  PublicKey.findProgramAddressSync(
    [
      Buffer.from("MESSAGE"),
      Buffer.from(msgHash),
    ],
    PROGRAM_ID,
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
  const instruction = await getProgram().methods
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
  const instruction = await getProgram().methods
    .registerExtension(Array.from(CID.parse(ipfsCid).toV1().bytes))
    .accounts({
      payer,
      extension: findExtension(PROGRAM_ID),
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
  const instruction = await getProgram().methods
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
  const instruction = await getProgram().methods
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
  uipFee: BN | bigint;
  customGasLimit: BN | bigint;
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
  const instruction = await getProgram().methods
    .sendMessage(destination, toBN(uipFee), toBN(customGasLimit), text)
    .accounts({
      endpointConfig: ENDPOINT_CONFIG,
      utsConnector: await fetchUtsConnector(connection),
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
  const chunkHolderId = Math.floor(Math.random() * (1 << 19));
  const preInstructions = await loadByChunks({
    owner: sender,
    data,
    chunkHolderId,
  });

  const instruction = await passToCpi({
    owner: sender,
    program: PROGRAM_ID,
    chunkHolderId,
    accounts: [
      { pubkey: sender, isSigner: true, isWritable: true },
      { pubkey: ENDPOINT_CONFIG, isSigner: false, isWritable: false },
      {
        pubkey: await fetchUtsConnector(connection),
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: PublicKey.findProgramAddressSync(
          [Buffer.from("UIP_SIGNER")],
          PROGRAM_ID,
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

export const fetchMessenger = async (
  connection: Connection,
  commitmentOrConfig?: Commitment | GetAccountInfoConfig,
): Promise<MessengerAccount | null> =>
  await fetchAccount(
    connection,
    getProgram().coder,
    MESSENGER,
    "messenger",
    commitmentOrConfig,
  );

export const fetchMessage = async (
  connection: Connection,
  publicKey: PublicKey,
  commitmentOrConfig?: Commitment | GetAccountInfoConfig,
): Promise<Message | null> =>
  await fetchAccount(
    connection,
    getProgram().coder,
    publicKey,
    "message",
    commitmentOrConfig,
  );

export async function getMessagesBySender(
  connection: Connection,
  senderAddr: Buffer,
): Promise<Message[]> {
  const messages = await connection.getProgramAccounts(
    PROGRAM_ID,
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
    getProgram().account.crossChainMessage.coder.accounts.decode(
      "crossChainMessage",
      message.account.data,
    )
  );
}

const SEND_MESSAGE_DISCRIMINATOR = [57, 40, 34, 178, 189, 10, 65, 26];

type SendMessgeParams = {
  destination: Destination;
  uipFee: BN | bigint;
  customGasLimit: BN | bigint;
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
  } else if (destination.sonicBlazeTestnet) {
    destinationNum = 7;
  } else if (destination.avalancheFuji) {
    destinationNum = 8;
  } else if (destination.ethereum) {
    destinationNum = 9;
  } else if (destination.sonic) {
    destinationNum = 10;
  } else if (destination.avalanche) {
    destinationNum = 11;
  } else if (destination.eib) {
    destinationNum = 12;
  } else if (destination.polygon) {
    destinationNum = 13;
  } else if (destination.mantaPacific) {
    destinationNum = 14;
  } else if (destination.abstract) {
    destinationNum = 15;
  } else if (destination.berachain) {
    destinationNum = 16;
  } else if (destination.mantle) {
    destinationNum = 17;
  } else if (destination.bsc) {
    destinationNum = 18;
  } else if (destination.immutable) {
    destinationNum = 19;
  } else {
    throw new Error("invalid destination");
  }

  res.set([destinationNum], offset);
  offset += 1;

  res.set(toBN(uipFee).toArrayLike(Buffer, "le", 8), offset);
  offset += 8;

  res.set(toBN(customGasLimit).toArrayLike(Buffer, "le", 16), offset);
  offset += 16;

  res.writeUint32LE(text.length, offset);
  offset += 4;
  res.set(new TextEncoder().encode(text), offset);
  offset += text.length;

  return res;
}
