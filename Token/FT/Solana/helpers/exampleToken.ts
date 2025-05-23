import { IdlTypes, Program } from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import { Keypair, PublicKey, TransactionSignature } from "@solana/web3.js";
import { ExampleToken } from "../target/types/example_token";
import BN from "bn.js";
import { ENDPOINT_CONFIG, fetchUtsConnector, findExtension } from "./endpoint";
import { CID } from "multiformats";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

anchor.setProvider(anchor.AnchorProvider.env());
export const EXAMPLE_TOKEN_PROGRAM: Program<ExampleToken> =
  anchor.workspace.ExampleToken;

export type Destination = IdlTypes<ExampleToken>["destination"];

export const EXAMPLE_TOKEN_CONFIG = PublicKey.findProgramAddressSync(
  [Buffer.from("CONFIG")],
  EXAMPLE_TOKEN_PROGRAM.programId,
)[0];

export const EXA_MINT = PublicKey.findProgramAddressSync(
  [Buffer.from("EXA_MINT")],
  EXAMPLE_TOKEN_PROGRAM.programId,
)[0];

export type InitializeInput = {
  payer: Keypair;
  admin: PublicKey;
  decimals: number;
};

export async function initialize(
  {
    payer,
    admin,
    decimals,
  }: InitializeInput,
): Promise<{ transactionSignature: TransactionSignature }> {
  const transactionSignature = await EXAMPLE_TOKEN_PROGRAM.methods
    .initialize(admin, decimals)
    .accounts({
      payer: payer.publicKey,
    })
    .signers([payer])
    .rpc();
  return { transactionSignature };
}

export type MintInput = {
  admin: Keypair;
  amount: BN;
  owner: PublicKey;
};

export async function mint(
  {
    admin,
    amount,
    owner,
  }: MintInput,
): Promise<{ transactionSignature: TransactionSignature }> {
  const transactionSignature = await EXAMPLE_TOKEN_PROGRAM.methods
    .mint(amount)
    .accounts({
      admin: admin.publicKey,
      destinationAta: getAssociatedTokenAddressSync(EXA_MINT, owner),
    })
    .signers([admin])
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
  const transactionSignature = await EXAMPLE_TOKEN_PROGRAM.methods
    .registerExtension(Array.from(CID.parse(ipfsCid).toV1().bytes))
    .accounts({
      config: EXAMPLE_TOKEN_CONFIG,
      payer: payer.publicKey,
      extension: findExtension(EXAMPLE_TOKEN_PROGRAM.programId),
      admin: admin.publicKey,
    })
    .signers([payer, admin])
    .rpc();
  return { transactionSignature };
}

export type BridgeInput = {
  destination: Destination;
  to: Buffer;
  amount: BN;
  uipFee: BN;
  customGasLimit: BN;
  sender: Keypair;
};

export async function bridge(
  {
    uipFee,
    to,
    amount,
    customGasLimit,
    destination,
    sender,
  }: BridgeInput,
): Promise<{ transactionSignature: TransactionSignature }> {
  const transactionSignature = await EXAMPLE_TOKEN_PROGRAM.methods
    .bridge(destination, to, amount, uipFee, customGasLimit)
    .accounts({
      sender: sender.publicKey,
      endpointConfig: ENDPOINT_CONFIG,
      utsConnector: await fetchUtsConnector(),
      config: EXAMPLE_TOKEN_CONFIG,
      tokenAccount: getAssociatedTokenAddressSync(EXA_MINT, sender.publicKey),
    })
    .signers([sender])
    .rpc();
  return { transactionSignature };
}

export type UpdateAdmin = {
  admin: Keypair;
  newAdmin: PublicKey;
};

export async function updateAdmin(
  { admin, newAdmin }: UpdateAdmin,
): Promise<{ transactionSignature: TransactionSignature }> {
  const transactionSignature = await EXAMPLE_TOKEN_PROGRAM.methods
    .updateAdmin(newAdmin)
    .accountsStrict({
      config: EXAMPLE_TOKEN_CONFIG,
      admin: admin.publicKey,
    })
    .signers([admin])
    .rpc();
  return { transactionSignature };
}
