import {
  encodeTransmitterParams,
  executeFull,
  findExtension,
  findMessage,
  hexToBytes,
  msgHashFull,
  signMsg,
  simulateExecute,
  simulateExecuteLite,
  UIP_PROGRAM,
  unloadMessage,
} from "../helpers/endpoint";
import {
  Destination,
  findMessage as findMessengerMessage,
  getMessagesBySender,
  initialize as initializeMessenger,
  MAX_TEXT_LEN_ONE_TX,
  MESSENGER,
  MESSENGER_PROGRAM,
  registerExtension as registerExtensionMessenger,
  sendMessage,
  sendMessageOneTx,
  setAllowedSenders,
} from "../helpers/messenger";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
  airdrop,
  disperse,
  readKeypairFromFile,
  setupTests,
  SOLANA_CHAIN_ID,
  transferEverything,
} from "../helpers/utils";
import BN from "bn.js";
import bs58 from "bs58";
import { ethers, Wallet } from "ethers";
import { randomInt } from "crypto";
import { CID } from "multiformats";

const admin = readKeypairFromFile("keys/admin.json");
const executor = readKeypairFromFile("keys/executor.json");
const proposer = new Keypair();
const sender = new Keypair();
const signer = new Wallet(
  "0x74e3ffad2b87174dc1d806edf1a01e3b017cf1be05d1894d329826f10fa1d72f",
);
const superSigner = new Wallet(
  "0xf496bcca0a4896011dbdbe2ec80417ed759a6a9cc72477b3a65b8d99b066b150",
);
const transmitterParams = {
  proposalCommitment: { confirmed: {} },
  customGasLimit: new BN(2),
};
const transmitterParamsEncoded = encodeTransmitterParams(transmitterParams);

const { connection, payer } = setupTests();

beforeAll(async () => {
  await airdrop(connection, payer.publicKey, 1_000_000_000);
  await disperse(
    connection,
    [proposer.publicKey, admin.publicKey, executor.publicKey, sender.publicKey],
    payer,
    150_000_000,
  );
});

afterAll(async () => {
  await transferEverything(connection, [proposer, executor, sender], payer);
});

describe("messenger", () => {
  test("initialize", async () => {
    try {
      await initializeMessenger({
        payer,
        admin: admin.publicKey,
        allowedSenders: null,
      });
    } catch (e) {
      expect(e.toString()).toInclude("already in use");
      await setAllowedSenders({
        payer,
        admin,
        allowedSenders: null,
      });
    }

    const messenger = await MESSENGER_PROGRAM.account.messenger.fetch(
      MESSENGER,
    );
    expect(messenger.admin).toEqual(admin.publicKey);
    expect(messenger.allowedSenders).toEqual(null);
  });

  test("registerExtension", async () => {
    const ipfsCid =
      "bafkreia2gxlqwpkvtx2bzetzuk4swfqf54j5g2tufasexoiqrrud3xakgu";

    await registerExtensionMessenger({
      admin,
      payer,
      ipfsCid,
    });

    const extension = await UIP_PROGRAM.account.extension.fetch(
      findExtension(MESSENGER_PROGRAM.programId),
    );
    expect(extension.program).toEqual(MESSENGER_PROGRAM.programId);
    expect(extension.ipfsCid).toEqual(
      Array.from(CID.parse(ipfsCid).toV1().bytes),
    );
  });

  const destAddr = MESSENGER_PROGRAM.programId.toBuffer();
  const uipFee = new BN(80085);
  const customGasLimit = new BN(1_000_000);
  const srcBlockNumber = new BN(randomInt(256));
  const srcOpTxId = new Array<Array<number>>();
  const text = "Hello, world!";
  let selectorSlot: number[];
  let payload: Buffer;
  const destination: Destination = connection.rpcEndpoint.includes("mainnet")
    ? { solanaMainnet: {} }
    : { solanaDevnet: {} };

  test("sendMessage", async () => {
    const eventPromise: Promise<void> = new Promise((resolve, reject) => {
      UIP_PROGRAM.addEventListener(
        "messageProposed",
        (event) => {
          try {
            expect(event.sender).toEqual(MESSENGER_PROGRAM.programId);
            selectorSlot = event.selectorSlot;
            payload = event.payload;
            resolve();
          } catch (error) {
            reject(error);
          }
        },
      );

      setTimeout(() => {
        reject(new Error("Event did not fire within timeout"));
      }, 12000);
    });

    const { transactionSignature } = await sendMessageOneTx({
      destination,
      uipFee,
      customGasLimit,
      text,
      sender,
      payer,
    });
    const txId = bs58.decode(transactionSignature);
    srcOpTxId[0] = Array.from(txId.subarray(0, 32));
    srcOpTxId[1] = Array.from(txId.subarray(32));

    await eventPromise;

    const testLongMessage = async (len: number) => {
      const text = "a".repeat(len);
      await sendMessageOneTx({
        destination,
        uipFee,
        customGasLimit,
        text,
        sender,
        payer,
      });
    };
    await testLongMessage(MAX_TEXT_LEN_ONE_TX);
    expect(testLongMessage(MAX_TEXT_LEN_ONE_TX + 1)).rejects.toThrow(
      "Transaction too large",
    );
  });

  test("sendMessage (big)", async () => {
    const bigText = "a".repeat(5000);
    const eventPromise: Promise<void> = new Promise((resolve, reject) => {
      UIP_PROGRAM.addEventListener(
        "messageProposed",
        (event) => {
          try {
            expect(event.sender).toEqual(MESSENGER_PROGRAM.programId);
            expect(event.payload).toEqual(
              hexToBytes(
                ethers.AbiCoder.defaultAbiCoder().encode(["bytes", "bytes"], [
                  ethers.AbiCoder.defaultAbiCoder().encode(["string"], [
                    bigText,
                  ]),
                  sender.publicKey.toBuffer(),
                ]),
              ),
            );
            resolve();
          } catch (error) {
            reject(error);
          }
        },
      );

      setTimeout(() => {
        reject(new Error("Event did not fire within timeout"));
      }, 12000);
    });

    await sendMessage({
      destination,
      uipFee,
      customGasLimit,
      text: bigText,
      sender,
      payer,
    });

    await eventPromise;
  });

  test("receiveMessage", async () => {
    const text = "hello everyone!";
    const destAddr = MESSENGER_PROGRAM.programId.toBuffer();
    const uipFee = new BN(80085);
    const srcBlockNumber = new BN(randomInt(256));
    const srcChainId = SOLANA_CHAIN_ID;
    const srcOpTxId = new Array<Array<number>>();
    let selectorSlot = new Array<number>();
    let payload: Buffer = Buffer.alloc(0);

    const eventPromise: Promise<void> = new Promise((resolve, reject) => {
      UIP_PROGRAM.addEventListener(
        "messageProposed",
        (event) => {
          try {
            expect(event.sender).toEqual(MESSENGER_PROGRAM.programId);
            selectorSlot = event.selectorSlot;
            payload = event.payload;
            resolve();
          } catch (error) {
            reject(error);
          }
        },
      );

      setTimeout(() => {
        reject(new Error("Event did not fire within timeout"));
      }, 15000);
    });

    const { transactionSignature } = await sendMessage({
      uipFee,
      customGasLimit,
      destination,
      text,
      sender,
      payer,
    });

    const txId = bs58.decode(transactionSignature);
    srcOpTxId[0] = Array.from(txId.subarray(0, 32));
    srcOpTxId[1] = Array.from(txId.subarray(32));

    await eventPromise;

    const msgData = {
      initialProposal: {
        senderAddr: MESSENGER_PROGRAM.programId.toBuffer(),
        destAddr: new PublicKey(destAddr),
        totalFee: uipFee,
        payload,
        reserved: Buffer.from([]),
        transmitterParams: transmitterParamsEncoded,
        selectorSlot,
      },
      srcChainData: {
        srcBlockNumber,
        srcChainId,
        srcOpTxId,
      },
    };

    const signatures = [signMsg(signer, msgData)];
    const superSignatures = [signMsg(superSigner, msgData)];

    const accounts = [
      { pubkey: MESSENGER, isSigner: false, isWritable: true },
      {
        pubkey: findMessengerMessage(msgHashFull(msgData)),
        isSigner: false,
        isWritable: true,
      },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ];

    const input = {
      executor,
      msgData,
      signatures,
      superSignatures,
      accounts,
      spendingLimit: new BN(100_000),
    };

    // expect(executeFull(input)).rejects.toThrow("SpendingLimitExceeded");

    const accountsSimulation = [
      { pubkey: MESSENGER, isSigner: false, isWritable: true },
      {
        pubkey: findMessengerMessage(Array.from({ length: 32 }, () => 0)),
        isSigner: false,
        isWritable: true,
      },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ];
    const simulationLamports = await simulateExecute({
      payer: admin.publicKey,
      accounts: accountsSimulation,
      msgData,
    });

    const liteSimulationLamports = await simulateExecuteLite({
      payer: admin.publicKey,
      accounts: accountsSimulation,
      destAddr: new PublicKey(destAddr),
      payload,
      senderAddr: MESSENGER_PROGRAM.programId.toBuffer(),
      srcChainId,
    });

    const balanceBefore = await connection.getBalance(executor.publicKey);

    input.spendingLimit = new BN(3_000_000);
    await executeFull(input);

    await unloadMessage({ payer: executor, message: findMessage(msgData) });

    const balanceAfter = await connection.getBalance(executor.publicKey);

    expect(balanceBefore - balanceAfter).toEqual(
      Number(simulationLamports) + 5000,
    );
    expect(simulationLamports).toEqual(liteSimulationLamports);

    const messagesBySender = await getMessagesBySender(
      connection,
      sender.publicKey.toBuffer(),
    );
    expect(messagesBySender.length).toEqual(1);
    expect(messagesBySender[0].text).toEqual(text);
  });

  test("setAllowedSenders", async () => {
    await setAllowedSenders({
      payer,
      admin,
      allowedSenders: [],
    });

    const eventPromise: Promise<void> = new Promise((resolve, reject) => {
      UIP_PROGRAM.addEventListener(
        "messageProposed",
        (event) => {
          try {
            expect(event.sender).toEqual(MESSENGER_PROGRAM.programId);
            selectorSlot = event.selectorSlot;
            payload = event.payload;
            resolve();
          } catch (error) {
            reject(error);
          }
        },
      );

      setTimeout(() => {
        reject(new Error("Event did not fire within timeout"));
      }, 12000);
    });

    const { transactionSignature } = await sendMessage({
      uipFee,
      customGasLimit,
      destination,
      text,
      sender,
      payer,
    });
    const txId = bs58.decode(transactionSignature);
    srcOpTxId[0] = Array.from(txId.subarray(0, 32));
    srcOpTxId[1] = Array.from(txId.subarray(32));

    await eventPromise;

    const senderAddr = MESSENGER_PROGRAM.programId.toBuffer();
    const srcChainId = SOLANA_CHAIN_ID;
    const msgData = {
      initialProposal: {
        senderAddr,
        destAddr: new PublicKey(destAddr),
        totalFee: uipFee,
        payload,
        reserved: Buffer.from([]),
        transmitterParams: transmitterParamsEncoded,
        selectorSlot,
      },
      srcChainData: {
        srcBlockNumber,
        srcChainId,
        srcOpTxId,
      },
    };

    const signatures = [signMsg(signer, msgData)];
    const superSignatures = [signMsg(superSigner, msgData)];
    expect(executeFull({
      executor,
      msgData,
      signatures,
      superSignatures,
      accounts: [
        { pubkey: MESSENGER, isSigner: false, isWritable: true },
        {
          pubkey: findMessengerMessage(msgHashFull(msgData)),
          isSigner: false,
          isWritable: true,
        },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      spendingLimit: new BN(3_000_000),
    })).rejects.toThrow("SenderNotAllowed");

    await setAllowedSenders({
      payer,
      admin,
      allowedSenders: [sender.publicKey.toBuffer()],
    });

    await executeFull({
      executor,
      msgData,
      signatures,
      superSignatures,
      accounts: [
        { pubkey: MESSENGER, isSigner: false, isWritable: true },
        {
          pubkey: findMessengerMessage(msgHashFull(msgData)),
          isSigner: false,
          isWritable: true,
        },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      spendingLimit: new BN(3_000_000),
    });
  });
});
