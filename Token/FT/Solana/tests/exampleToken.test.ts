import {
  encodeTransmitterParams,
  executeFull,
  findExtension,
  findMessage,
  signMsg,
  simulateExecute,
  simulateExecuteLite,
  UIP_PROGRAM,
  unloadMessage,
} from "../helpers/endpoint";
import {
  bridge,
  Destination,
  EXA_MINT,
  EXAMPLE_TOKEN_CONFIG,
  EXAMPLE_TOKEN_PROGRAM,
  initialize,
  mint,
  registerExtension,
  updateAdmin,
} from "../helpers/exampleToken";
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
import { Wallet } from "ethers";
import { randomInt } from "crypto";
import { CID } from "multiformats";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAccount,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

const admin = readKeypairFromFile("keys/admin.json");
const executor = readKeypairFromFile("keys/executor.json");
const proposer = new Keypair();
const sender = new Keypair();
const receiver = new Keypair();
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

describe("example token", () => {
  test("initialize", async () => {
    // await createMint(
    //   connection,
    //   payer,
    //   sender.publicKey,
    //   null,
    //   9,
    //   exaMint,
    // );

    // await mintTo(
    //   connection,
    //   payer,
    //   exaMint.publicKey,
    //   getAssociatedTokenAddressSync(exaMint.publicKey, sender.publicKey),
    //   sender,
    //   1_000_000_000,
    // );

    // await setAuthority(
    //   connection,
    //   payer,
    //   exaMint.publicKey,
    //   sender,
    //   AuthorityType.MintTokens,
    //   EXAMPLE_TOKEN_CONFIG,
    // );

    try {
      await initialize({
        payer,
        admin: admin.publicKey,
        decimals: 18,
      });
    } catch (e) {
      expect(e.toString()).toInclude("already in use");
    }

    const config = await EXAMPLE_TOKEN_PROGRAM.account.exampleTokenConfig
      .fetch(
        EXAMPLE_TOKEN_CONFIG,
      );
    expect(config.admin).toEqual(admin.publicKey);
  });

  test("mint", async () => {
    await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      EXA_MINT,
      sender.publicKey,
      true,
    );

    const exaBalanceBefore = await getAccount(
      connection,
      getAssociatedTokenAddressSync(EXA_MINT, sender.publicKey),
    ).then((x) => x.amount);

    const amount = new BN(1_000_000 * Math.pow(10, 9));

    await mint({
      admin,
      amount,
      owner: sender.publicKey,
    });

    const exaBalanceAfter = await getAccount(
      connection,
      getAssociatedTokenAddressSync(EXA_MINT, sender.publicKey),
    ).then((x) => x.amount);

    expect(exaBalanceAfter - exaBalanceBefore).toEqual(
      BigInt(amount.toString()),
    );
  });

  test("registerExtension", async () => {
    const ipfsCid =
      "bafkreihwalovxt6jjsko7gws4m34frlqoqi5huqd5x3lacjrqyyzxm3tuy";

    await registerExtension({
      admin,
      payer,
      ipfsCid,
    });

    const extension = await UIP_PROGRAM.account.extension.fetch(
      findExtension(EXAMPLE_TOKEN_PROGRAM.programId),
    );
    expect(extension.program).toEqual(EXAMPLE_TOKEN_PROGRAM.programId);
    expect(extension.ipfsCid).toEqual(
      Array.from(CID.parse(ipfsCid).toV1().bytes),
    );
  });

  const uipFee = new BN(80085);
  const customGasLimit = new BN(1_000_000);
  const srcOpTxId = new Array<Array<number>>();
  const amount = new BN(1_000_000);
  const destination: Destination = connection.rpcEndpoint.includes("mainnet")
    ? { solanaMainnet: {} }
    : { solanaDevnet: {} };

  test("bridge", async () => {
    const eventPromise: Promise<void> = new Promise((resolve, reject) => {
      UIP_PROGRAM.addEventListener(
        "messageProposed",
        (event) => {
          try {
            expect(event.sender).toEqual(EXAMPLE_TOKEN_PROGRAM.programId);
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

    const exaBalanceBefore = await getAccount(
      connection,
      getAssociatedTokenAddressSync(EXA_MINT, sender.publicKey),
    ).then((x) => x.amount);

    const { transactionSignature } = await bridge({
      destination,
      uipFee,
      customGasLimit,
      sender,
      amount,
      to: receiver.publicKey.toBuffer(),
    });
    const txId = bs58.decode(transactionSignature);
    srcOpTxId[0] = Array.from(txId.subarray(0, 32));
    srcOpTxId[1] = Array.from(txId.subarray(32));

    await eventPromise;

    const exaBalanceAfter = await getAccount(
      connection,
      getAssociatedTokenAddressSync(
        EXA_MINT,
        sender.publicKey,
      ),
    ).then((x) => x.amount);
    expect(exaBalanceBefore - exaBalanceAfter).toEqual(
      BigInt(amount.toString()),
    );
  });

  test("receive", async () => {
    const destAddr = EXAMPLE_TOKEN_PROGRAM.programId.toBuffer();
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
            expect(event.sender).toEqual(EXAMPLE_TOKEN_PROGRAM.programId);
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

    const { transactionSignature } = await bridge({
      uipFee,
      customGasLimit,
      destination,
      sender,
      amount,
      to: receiver.publicKey.toBuffer(),
    });

    const txId = bs58.decode(transactionSignature);
    srcOpTxId[0] = Array.from(txId.subarray(0, 32));
    srcOpTxId[1] = Array.from(txId.subarray(32));

    await eventPromise;

    const msgData = {
      initialProposal: {
        senderAddr: EXAMPLE_TOKEN_PROGRAM.programId.toBuffer(),
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
      { pubkey: EXAMPLE_TOKEN_CONFIG, isSigner: false, isWritable: false },
      { pubkey: EXA_MINT, isSigner: false, isWritable: true },
      {
        pubkey: getAssociatedTokenAddressSync(
          EXA_MINT,
          receiver.publicKey,
        ),
        isSigner: false,
        isWritable: true,
      },
      { pubkey: receiver.publicKey, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      {
        pubkey: ASSOCIATED_TOKEN_PROGRAM_ID,
        isSigner: false,
        isWritable: false,
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

    const simulationLamports = await simulateExecute({
      payer: admin.publicKey,
      accounts,
      msgData,
    });

    const liteSimulationLamports = await simulateExecuteLite({
      payer: admin.publicKey,
      accounts,
      destAddr: new PublicKey(destAddr),
      payload,
      senderAddr: EXAMPLE_TOKEN_PROGRAM.programId.toBuffer(),
      srcChainId,
    });

    const balanceBefore = await connection.getBalance(executor.publicKey);

    let exaBalanceBefore: bigint = 0n;
    try {
      exaBalanceBefore = await getAccount(
        connection,
        getAssociatedTokenAddressSync(
          EXA_MINT,
          receiver.publicKey,
        ),
      ).then((x) => x.amount);
    } catch (e) {
      expect(e.toString()).toInclude("TokenAccountNotFoundError");
    }

    input.spendingLimit = new BN(3_000_000);
    await executeFull(input);

    const exaBalanceAfter = await getAccount(
      connection,
      getAssociatedTokenAddressSync(
        EXA_MINT,
        receiver.publicKey,
      ),
    ).then((x) => x.amount);
    expect(exaBalanceAfter - exaBalanceBefore).toEqual(
      BigInt(amount.toString()),
    );

    await unloadMessage({ payer: executor, message: findMessage(msgData) });

    const balanceAfter = await connection.getBalance(executor.publicKey);

    expect(balanceBefore - balanceAfter).toEqual(
      Number(simulationLamports) + 5000,
    );
    expect(simulationLamports).toEqual(liteSimulationLamports);
  });

  test("update admin", async () => {
    await updateAdmin({
      admin,
      newAdmin: payer.publicKey,
    });

    const config = await EXAMPLE_TOKEN_PROGRAM.account.exampleTokenConfig.fetch(
      EXAMPLE_TOKEN_CONFIG,
    );
    expect(config.admin).toEqual(payer.publicKey);

    await updateAdmin({
      admin: payer,
      newAdmin: admin.publicKey,
    });

    const config2 = await EXAMPLE_TOKEN_PROGRAM.account.exampleTokenConfig
      .fetch(
        EXAMPLE_TOKEN_CONFIG,
      );
    expect(config2.admin).toEqual(admin.publicKey);
  });
});
