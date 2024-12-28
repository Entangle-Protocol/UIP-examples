import {
    HardhatEthersSigner,
    SignerWithAddress,
} from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { BytesLike } from "ethers";
import { ethers } from "hardhat";
import { MessageLib } from "../typechain-types/contracts/EndPoint";
import { log } from "./testLogger";
import { TEST_DEST_CHAIN_ID } from "../utils/constants";

const coder = ethers.AbiCoder.defaultAbiCoder();

async function signConsensus(
    signers: SignerWithAddress[],
    data: any
): Promise<any> {
    const signatures: any = [];

    const hash = ethers.solidityPackedKeccak256(
        [
            "uint256",
            "uint256",
            "bytes32",
            "bytes",
            "uint256",
            "bytes",
            "uint256",
            "bytes",
            "uint256",
            "bytes",
            "uint256",
            "bytes32[2]",
        ],
        [
            data.destChainId,
            data.nativeAmount,
            data.selectorSlot,
            data.senderAddr,
            getLenBytes(data.senderAddr.length),
            data.destAddr,
            getLenBytes(data.destAddr.length),
            data.payload,
            getLenBytes(data.payload.length),
            data.reserved,
            data.location,
            data.srcOpTxId,
        ]
    );

    log("Hash TS :", hash);

    const hashPrefixed = ethers.solidityPackedKeccak256(
        ["string", "bytes32"],
        ["\x19Ethereum Signed Message:\n32", ethers.toBeArray(hash)]
    );
    log("Prefixed TS:", hashPrefixed, "\n");

    // sign data with ethers
    log("=== Consensus Signatures ===");
    for (const signer of signers) {
        const hashBytes = ethers.getBytes(hash);
        const sig = await signer.signMessage(hashBytes);

        signatures.push(sig);

        const sigStruct = ethers.Signature.from(sig);
        expect(signer.address).eq(ethers.verifyMessage(hashBytes, sigStruct));

        // log them all
        const indexOfSigner = signers.indexOf(signer);
        log(indexOfSigner, ":", await signer.getAddress(), ":", sig);
    }
    log("")

    return signatures;
}

function getLenBytes(dataLen: number) {
    return (dataLen - 2) / 2
}

export const selector = "0x61605daf" // Endpoint::execute(...)
export const exCode = 1
const exCodeType = "0x01"

function encodeDefaultSelector() {
    // create new 32 byte hex string
    const bytes4 = ethers.hexlify(Buffer.from(selector.replace('0x', ''), 'hex'));
    const bytes32 = ethers.zeroPadValue(bytes4, 32);
    return bytes32
}

function encodeExecutionCode() {
    // uint256 to hex 
    const slot = coder.encode(
        ["uint256"],
        [exCode]
    )
    // replace 0x0 with 0x1
    const res = slot.replace('0x00', exCodeType);
    return res
}

async function signSolo(signer: HardhatEthersSigner, data: MessageLib.MessageDataStruct) {
    const hash = ethers.solidityPackedKeccak256(
        [
            "uint256",
            "uint256",
            "bytes32",
            "bytes32",
            "bytes",
            "bytes",
            "uint256",
            "bytes",
            "uint256",
            "bytes",
            "uint256",
            "bytes",
            "uint256",
            "uint256",
            "bytes32[2]",
        ],
        [
            data.initialProposal.destChainId,
            data.initialProposal.nativeAmount,
            data.initialProposal.selectorSlot,
            data.initialProposal.senderAddr,
            data.initialProposal.senderAddr.length,
            data.initialProposal.destAddr,
            data.initialProposal.destAddr.length,
            data.initialProposal.payload,
            data.initialProposal.payload.length,
            data.initialProposal.reserved,
            data.initialProposal.reserved.length,
            data.srcChainData.location,
            data.srcChainData.srcOpTxId,
        ]
    );

    const hashBytes = ethers.getBytes(hash);
    const sig = await signer.signMessage(hashBytes);

    // separate sig to v,r,s
    const sigStruct = ethers.Signature.from(sig);
    return sigStruct
}

async function getTestMsg(
    addressTo: string = "0xF135B9eD84E0AB08fdf03A744947cb089049bd79"
) {
    const payload = coder.encode(
            ["string"],
            ["hello world"]
    )

    const proposal: MessageLib.ProposalStruct = {
        destChainId: TEST_DEST_CHAIN_ID,
        nativeAmount: 1,
        selectorSlot: encodeDefaultSelector(),
        senderAddr: coder.encode(["address"], ["0xF135B9eD84E0AB08fdf03A744947cb089049bd79"]),
        destAddr: coder.encode(
            ["address"],
            [addressTo]
        ),
        payload: payload,
        reserved: ethers.ZeroHash,
    };

    // test data only
    // const txIdTestPack: BytesLike = ethers.getBytes(ethers.ZeroHash);           -- conflict with master::validateSrcData()
    const txIdTestPack: BytesLike = ethers.randomBytes(32)
    const srcChainData: MessageLib.SrcChainDataStruct = {
        // srcChainId: 1,
        // srcBlockNumber: 111,
        location: (1n << 128n) + 111n,
        srcOpTxId: [txIdTestPack, txIdTestPack],
    };

    const opData: MessageLib.MessageDataStruct = {
        initialProposal: proposal,
        srcChainData: srcChainData,
    };

    return opData;
}

async function getChainDataHash(data: MessageLib.SrcChainDataStruct) {
    return ethers.solidityPackedKeccak256(
        ["uint128", "bytes32", "bytes32"],
        [
            (BigInt(data.location) >> 128n),
            data.srcOpTxId[0],
            data.srcOpTxId[1]
        ]
    );
}

async function getPrefixedMsg(data: any) {
    const hash = ethers.solidityPackedKeccak256(
        [
            "uint256",
            "uint256",
            "bytes32",
            "bytes",
            "uint256",
            "bytes",
            "uint256",
            "bytes",
            "uint256",
            "bytes",
            "uint256",
            "bytes32[2]",
        ],
        [
            data.destChainId,
            data.nativeAmount,
            data.selectorSlot,
            data.senderAddr,
            data.senderAddr.length,
            data.destAddr,
            data.destAddr.length,
            data.payload,
            data.payload.length,
            data.reserved,
            data.location,
            data.srcOpTxId,
        ]
    );

    const hashPrefixed = ethers.solidityPackedKeccak256(
        ["string", "bytes32"],
        ["\x19Ethereum Signed Message:\n32", ethers.toBeArray(hash)]
    );
    return hashPrefixed
}

export { 
    signConsensus,
    encodeDefaultSelector,
    encodeExecutionCode,
    getTestMsg,
    signSolo,
    getChainDataHash,
    getPrefixedMsg
};
