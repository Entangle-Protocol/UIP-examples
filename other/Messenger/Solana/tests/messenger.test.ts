import {
  checkConsensus,
  encodeTransmitterParams,
  execute,
  fetchExtension,
  findExtension,
  findMessage,
  loadMessage,
  msgHashFull,
  onMessageProposed,
  sendSimulateExecuteLite,
  setProvider as setEndpointProvider,
  signMsg,
  unloadMessage,
} from "@lincot/uip-solana-sdk";
import {
  Destination,
  fetchMessenger,
  findMessage as findMessengerMessage,
  getMessagesBySender,
  initialize as initializeMessenger,
  MAX_TEXT_LEN_ONE_TX,
  MESSENGER,
  PROGRAM_ID,
  registerExtension as registerExtensionMessenger,
  sendMessage,
  sendMessageOneTx,
  setAllowedSenders,
  updateAdmin,
} from "@lincot/uip-solana-messenger-example";
import {
  Keypair,
  PublicKey,
  Signer,
  SystemProgram,
  TransactionSignature,
} from "@solana/web3.js";
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
  disperse,
  hexToBytes,
  readKeypairFromFile,
  sendAndConfirmVersionedTx,
  setupTests,
  solanaChainId,
  transferEverything,
} from "../helpers/utils";
import BN from "bn.js";
import bs58 from "bs58";
import { randomInt } from "crypto";
import { CID } from "multiformats";
import { InstructionWithCu, toTransaction } from "@lincot/solana-chunk-loader";
import { privateKeyToAccount } from "viem/accounts";
import { bytesToHex, encodeAbiParameters } from "viem";

const admin = readKeypairFromFile("keys/admin.json");
const executor = readKeypairFromFile("keys/executor.json");
const proposer = new Keypair();
const sender = new Keypair();
const signer = privateKeyToAccount(
  "0x74e3ffad2b87174dc1d806edf1a01e3b017cf1be05d1894d329826f10fa1d72f",
);
const superSigner = privateKeyToAccount(
  "0xf496bcca0a4896011dbdbe2ec80417ed759a6a9cc72477b3a65b8d99b066b150",
);
const transmitterParams = {
  proposalCommitment: { confirmed: {} },
  customGasLimit: new BN(2),
};
const transmitterParamsEncoded = encodeTransmitterParams(transmitterParams);

const { provider, payer } = setupTests();
const connection = provider.connection;
setEndpointProvider(provider);

const sendTx = async (
  ixs: InstructionWithCu[],
  signers: Signer[] = [payer],
): Promise<TransactionSignature> => {
  const tx = toTransaction(
    ixs,
    await connection.getLatestBlockhash().then((x) => x.blockhash),
    payer,
  );
  return await sendAndConfirmVersionedTx(
    connection,
    tx,
    signers,
    signers[0].publicKey,
  );
};

const sendIx = async (
  ix: InstructionWithCu,
  signers: Signer[] = [payer],
): Promise<TransactionSignature> => {
  return sendTx([ix], signers);
};

beforeAll(async () => {
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
      await sendIx(
        await initializeMessenger({
          payer: payer.publicKey,
          admin: admin.publicKey,
          allowedSenders: null,
        }),
      );
    } catch (e) {
      expect(e.toString()).toInclude("already in use");
      await sendIx(
        await setAllowedSenders({
          payer: payer.publicKey,
          admin: admin.publicKey,
          allowedSenders: null,
        }),
        [payer, admin],
      );
    }

    const messenger = await fetchMessenger(connection);
    expect(messenger.admin).toEqual(admin.publicKey);
    expect(messenger.allowedSenders).toEqual(null);
  });

  test("registerExtension", async () => {
    const ipfsCid =
      "bafkreia2gxlqwpkvtx2bzetzuk4swfqf54j5g2tufasexoiqrrud3xakgu";

    await sendIx(
      await registerExtensionMessenger({
        admin: admin.publicKey,
        payer: payer.publicKey,
        ipfsCid,
      }),
      [payer, admin],
    );

    const extension = await fetchExtension(
      connection,
      findExtension(PROGRAM_ID),
    );
    expect(extension.program).toEqual(PROGRAM_ID);
    expect(extension.ipfsCid).toEqual(
      Array.from(CID.parse(ipfsCid).toV1().bytes),
    );
  });

  const destAddr = PROGRAM_ID.toBuffer();
  const uipFee = new BN(80085);
  const customGasLimit = new BN(1_000_000);
  const srcBlockNumber = new BN(randomInt(256));
  const srcOpTxId = new Array<Array<number>>();
  const text = "Hello, world!";
  let selector: number[];
  let payload: Buffer;
  const destination: Destination = connection.rpcEndpoint.includes("mainnet")
    ? { solanaMainnet: {} }
    : { solanaDevnet: {} };

  test("sendMessage", async () => {
    const eventPromise: Promise<void> = new Promise((resolve, reject) => {
      onMessageProposed((event) => {
        try {
          expect(event.sender).toEqual(PROGRAM_ID);
          selector = event.selector;
          payload = event.payload;
          resolve();
        } catch (error) {
          reject(error);
        }
      });

      setTimeout(() => {
        reject(new Error("Event did not fire within timeout"));
      }, 12000);
    });

    const transactionSignature = await sendIx(
      await sendMessageOneTx({
        connection,
        destination: solanaChainId,
        uipFee,
        customGasLimit,
        text,
        sender: sender.publicKey,
      }),
      [sender],
    );
    const txId = bs58.decode(transactionSignature);
    srcOpTxId[0] = Array.from(txId.subarray(0, 32));
    srcOpTxId[1] = Array.from(txId.subarray(32));

    await eventPromise;

    const testLongMessage = async (len: number) => {
      const text = "a".repeat(len);
      await sendIx(
        await sendMessageOneTx({
          connection,
          destination,
          uipFee,
          customGasLimit,
          text,
          sender: sender.publicKey,
        }),
        [sender],
      );
    };
    await testLongMessage(MAX_TEXT_LEN_ONE_TX);
    expect(testLongMessage(MAX_TEXT_LEN_ONE_TX + 1)).rejects.toThrow(
      "Transaction too large",
    );
  });

  test("sendMessage (big)", async () => {
    const bigText = "a".repeat(5000);
    const eventPromise: Promise<void> = new Promise((resolve, reject) => {
      onMessageProposed((event) => {
        try {
          expect(event.sender).toEqual(PROGRAM_ID);
          expect(event.payload).toEqual(
            hexToBytes(
              encodeAbiParameters([{ type: "bytes" }, { type: "bytes" }], [
                encodeAbiParameters([{ type: "string" }], [bigText]),
                bytesToHex(sender.publicKey.toBuffer()),
              ]),
            ),
          );
          resolve();
        } catch (error) {
          reject(error);
        }
      });

      setTimeout(() => {
        reject(new Error("Event did not fire within timeout"));
      }, 12000);
    });

    const { preInstructions, instruction } = await sendMessage({
      connection,
      destination,
      uipFee,
      customGasLimit,
      text: bigText,
      sender: sender.publicKey,
    });
    await Promise.all(preInstructions.map((ix) => sendIx(ix, [sender])));
    await sendIx(instruction, [sender]);

    await eventPromise;
  });

  test("receiveMessage", async () => {
    const text = "hello everyone!";
    const destAddr = PROGRAM_ID;
    const uipFee = new BN(80085);
    const srcBlockNumber = new BN(randomInt(256));
    const srcChainId = solanaChainId;
    const srcOpTxId = new Array<Array<number>>();
    let selector = new Array<number>();
    let payload: Buffer = Buffer.alloc(0);

    const eventPromise: Promise<void> = new Promise((resolve, reject) => {
      onMessageProposed((event) => {
        try {
          expect(event.sender).toEqual(PROGRAM_ID);
          selector = event.selector;
          payload = event.payload;
          resolve();
        } catch (error) {
          reject(error);
        }
      });

      setTimeout(() => {
        reject(new Error("Event did not fire within timeout"));
      }, 15000);
    });

    const transactionSignature = await sendIx(
      await sendMessageOneTx({
        connection,
        uipFee,
        customGasLimit,
        destination,
        text,
        sender: sender.publicKey,
      }),
      [sender],
    );

    const txId = bs58.decode(transactionSignature);
    srcOpTxId[0] = Array.from(txId.subarray(0, 32));
    srcOpTxId[1] = Array.from(txId.subarray(32));

    await eventPromise;

    const msgData = {
      initialProposal: {
        senderAddr: PROGRAM_ID.toBuffer(),
        destAddr: new PublicKey(destAddr),
        totalFee: uipFee,
        payload,
        reserved: Buffer.from([]),
        transmitterParams: transmitterParamsEncoded,
        selector,
      },
      srcChainData: {
        srcBlockNumber,
        srcChainId,
        srcOpTxId,
      },
    };

    const signatures = [await signMsg({ signer, msgData, solanaChainId })];
    const superSignatures = [
      await signMsg({ signer: superSigner, msgData, solanaChainId }),
    ];

    const accounts = [
      { pubkey: MESSENGER, isSigner: false, isWritable: true },
      {
        pubkey: findMessengerMessage(msgHashFull(msgData, solanaChainId)),
        isSigner: false,
        isWritable: true,
      },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ];

    const accountsSimulation = [
      { pubkey: MESSENGER, isSigner: false, isWritable: true },
      {
        pubkey: findMessengerMessage(Array.from({ length: 32 }, () => 0)),
        isSigner: false,
        isWritable: true,
      },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ];

    const liteSimulationLamports = await sendSimulateExecuteLite({
      connection,
      payer: admin.publicKey,
      accounts: accountsSimulation,
      destAddr: new PublicKey(destAddr),
      destChain: solanaChainId,
      payload,
      senderAddr: PROGRAM_ID.toBuffer(),
      srcChainId,
    });

    const balanceBefore = await connection.getBalance(executor.publicKey);

    const message = findMessage(msgData, solanaChainId);
    await sendTx([
      await loadMessage({
        executor: executor.publicKey,
        msgData,
        solanaChainId,
      }),
      await checkConsensus({
        executor: executor.publicKey,
        message,
        signatures,
        superSignatures,
      }),
      await execute({
        executor: executor.publicKey,
        accounts,
        spendingLimit: new BN(2_000_000),
        deadline: new BN(Math.floor(Date.now() / 1000) + 10),
        destinationComputeUnits: 30_000,
        dstProgram: msgData.initialProposal.destAddr,
        message,
      }),
    ], [executor]);

    await sendIx(
      await unloadMessage({ executor: executor.publicKey, message }),
      [
        executor,
      ],
    );

    const balanceAfter = await connection.getBalance(executor.publicKey);

    expect(balanceBefore - balanceAfter).toEqual(
      Number(liteSimulationLamports) + 2 * 5000,
    );

    const messagesBySender = await getMessagesBySender(
      connection,
      sender.publicKey.toBuffer(),
    );
    expect(messagesBySender.length).toEqual(1);
    expect(messagesBySender[0].text).toEqual(text);
  });

  test("setAllowedSenders", async () => {
    await sendIx(
      await setAllowedSenders({
        payer: payer.publicKey,
        admin: admin.publicKey,
        allowedSenders: [],
      }),
      [payer, admin],
    );

    const eventPromise: Promise<void> = new Promise((resolve, reject) => {
      onMessageProposed((event) => {
        try {
          expect(event.sender).toEqual(PROGRAM_ID);
          selector = event.selector;
          payload = event.payload;
          resolve();
        } catch (error) {
          reject(error);
        }
      });

      setTimeout(() => {
        reject(new Error("Event did not fire within timeout"));
      }, 12000);
    });

    const transactionSignature = await sendIx(
      await sendMessageOneTx({
        connection,
        uipFee,
        customGasLimit,
        destination,
        text,
        sender: sender.publicKey,
      }),
      [sender],
    );
    const txId = bs58.decode(transactionSignature);
    srcOpTxId[0] = Array.from(txId.subarray(0, 32));
    srcOpTxId[1] = Array.from(txId.subarray(32));

    await eventPromise;

    const senderAddr = PROGRAM_ID.toBuffer();
    const srcChainId = solanaChainId;
    const msgData = {
      initialProposal: {
        senderAddr,
        destAddr: new PublicKey(destAddr),
        totalFee: uipFee,
        payload,
        reserved: Buffer.from([]),
        transmitterParams: transmitterParamsEncoded,
        selector,
      },
      srcChainData: {
        srcBlockNumber,
        srcChainId,
        srcOpTxId,
      },
    };

    const signatures = [await signMsg({ signer, msgData, solanaChainId })];
    const superSignatures = [
      await signMsg({ signer: superSigner, msgData, solanaChainId }),
    ];
    const message = findMessage(msgData, solanaChainId);
    expect(
      sendTx([
        await loadMessage({
          executor: executor.publicKey,
          msgData,
          solanaChainId,
        }),
        await checkConsensus({
          executor: executor.publicKey,
          message,
          signatures,
          superSignatures,
        }),
        await execute({
          executor: executor.publicKey,
          accounts: [
            { pubkey: MESSENGER, isSigner: false, isWritable: true },
            {
              pubkey: findMessengerMessage(msgHashFull(msgData, solanaChainId)),
              isSigner: false,
              isWritable: true,
            },
            {
              pubkey: SystemProgram.programId,
              isSigner: false,
              isWritable: false,
            },
          ],
          spendingLimit: new BN(2_000_000),
          deadline: new BN(Math.floor(Date.now() / 1000) + 10),
          destinationComputeUnits: 30_000,
          dstProgram: msgData.initialProposal.destAddr,
          message,
        }),
      ], [executor]),
    ).rejects.toThrow("SenderNotAllowed");

    await sendIx(
      await setAllowedSenders({
        payer: payer.publicKey,
        admin: admin.publicKey,
        allowedSenders: [sender.publicKey.toBuffer()],
      }),
      [payer, admin],
    );

    await sendTx([
      await loadMessage({
        executor: executor.publicKey,
        msgData,
        solanaChainId,
      }),
      await checkConsensus({
        executor: executor.publicKey,
        message,
        signatures,
        superSignatures,
      }),
      await execute({
        executor: executor.publicKey,
        accounts: [
          { pubkey: MESSENGER, isSigner: false, isWritable: true },
          {
            pubkey: findMessengerMessage(msgHashFull(msgData, solanaChainId)),
            isSigner: false,
            isWritable: true,
          },
          {
            pubkey: SystemProgram.programId,
            isSigner: false,
            isWritable: false,
          },
        ],
        spendingLimit: new BN(2_000_000),
        deadline: new BN(Math.floor(Date.now() / 1000) + 10),
        destinationComputeUnits: 30_000,
        dstProgram: msgData.initialProposal.destAddr,
        message,
      }),
    ], [executor]);
  });

  test("update admin", async () => {
    await sendIx(
      await updateAdmin({
        admin: admin.publicKey,
        newAdmin: payer.publicKey,
      }),
      [payer, admin],
    );

    const messenger = await fetchMessenger(connection);
    expect(messenger.admin).toEqual(payer.publicKey);

    await sendIx(
      await updateAdmin({
        admin: payer.publicKey,
        newAdmin: admin.publicKey,
      }),
    );

    const messenger2 = await fetchMessenger(connection);
    expect(messenger2.admin).toEqual(admin.publicKey);
  });
});
