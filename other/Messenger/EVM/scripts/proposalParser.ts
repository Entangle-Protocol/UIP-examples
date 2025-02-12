import { Log, TransactionReceipt } from "ethers";
import { MessageLib } from "../typechain-types/@entangle-labs/uip-contracts/contracts/endpoint/Endpoint";

const abiPath = "../artifacts/@entangle-labs/uip-contracts/contracts/endpoint/Endpoint.sol/Endpoint.json";

async function loadChainID(userConfig: any, net: string) {
    if (userConfig && userConfig.networks && userConfig.networks[net]) {
        return userConfig.networks[net].chainId;
    } else {
        console.log("ChainID is NOT found for network:", net);
    }
}

async function getSrcChainData(
    ethers: any,
    userConfig: any,
    srcNet: string,
    receipt: TransactionReceipt
) {
    const chainID = await loadChainID(userConfig, srcNet!);
    const srcChainData: MessageLib.SrcChainDataRawStruct = {
        srcChainId: BigInt(chainID),
        srcBlockNumber: receipt.blockNumber,
        srcOpTxId: [receipt.hash, ethers.ZeroHash],
    };

    return srcChainData;
}

function getLenBytes(dataLen: number) {
    return (dataLen - 2) / 2
}

async function createMsgHash(
    ethers: any,
    initialProposal: MessageLib.ProposalStruct,
    srcChainData: MessageLib.SrcChainDataStruct
) {
    // create hash as in MessageLib
    let hash = ethers.solidityPackedKeccak256(
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
            "bytes32[2]",
        ],
        [
            initialProposal.destChainId,
            initialProposal.nativeAmount,
            initialProposal.selectorSlot,
            getLenBytes(initialProposal.senderAddr.length),
            initialProposal.senderAddr,
            getLenBytes(initialProposal.destAddr.length),
            initialProposal.destAddr,
            getLenBytes(initialProposal.payload.length),
            initialProposal.payload,
            getLenBytes(initialProposal.reserved.length),
            initialProposal.reserved,
            getLenBytes(initialProposal.agentParams.length),
            initialProposal.agentParams,
            srcChainData.location,
            srcChainData.srcOpTxId,
        ]
    );

    hash = ethers.solidityPackedKeccak256(
        ["string", "bytes32"],
        ["\x19Ethereum Signed Message:\n32", ethers.getBytes(hash)]
    );

    return hash;
}

function LenBytes(data: any) {
    return (data.length - 2) / 2;
}

function location(srcChainId: bigint, srcBlockNumber: bigint) {
    // pack into 1 32-bytes variable
    const loc =  (srcChainId << 128n) + srcBlockNumber;
    return loc;
}

function convertRawSrcChainData(raw: MessageLib.SrcChainDataRawStruct) {
    const packed: MessageLib.SrcChainDataStruct = {
        location: location(BigInt(raw.srcChainId), BigInt(raw.srcBlockNumber)),
        srcOpTxId: raw.srcOpTxId
    }

    return packed
}

async function getReceipt(ethers: any, txHash: string) {
    let receipt: TransactionReceipt;
    try {
        receipt = await ethers.provider.getTransactionReceipt(txHash);
    } catch {
        throw new Error("Unable to get receipt");
    }

    return receipt;
}

async function getEndpointAbi() {
    const contractABI = require(abiPath).abi;
    return contractABI;
}

async function readProposeEvents(ethers: any, receipt: TransactionReceipt) {
    const contractABI = await getEndpointAbi();
    const iface = new ethers.Interface(contractABI);

    // console.log(iface)

    // Filter logs for the 'Propose' event
    const proposeEvents = receipt!.logs
        .map((log: Log) => {
            try {
                return iface.parseLog(log);
            } catch (e) {
                console.log("Log found but not parsed")
                return null;
            }
        })
        .filter((event: any) => event && event.name === "MessageProposed");

    return proposeEvents;
}

function constructProposal(data: any) {
    const proposal = {
        destChainId: data[0],
        nativeAmount: data[1],
        selectorSlot: data[2],
        agentParams: data[3],
        senderAddr: data[4],
        destAddr: data[5],
        payload: data[6],
        reserved: data[7],
    };

    return proposal;
}

export {
    readProposeEvents,
    getReceipt,
    getSrcChainData,
    createMsgHash,
    constructProposal,
    getEndpointAbi,
    convertRawSrcChainData
};
