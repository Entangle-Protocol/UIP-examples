// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {LocationLib} from "./LocationLib.sol";

/// @title A library for message management in a multi-chain environment
/// @notice This library provides structures and functions to manage messages across different blockchains
library MessageLib {
    using LocationLib for SrcChainData;

    struct Proposal {
        uint256 destChainId;
        uint256 nativeAmount;
        bytes32 selectorSlot;
        bytes senderAddr;
        bytes destAddr;
        bytes payload;
        bytes reserved;
    }

    struct SrcChainData {
        uint256 location;
        bytes32[2] srcOpTxId;
    }

    struct SrcChainDataRaw {
        uint128 srcChainId;
        uint128 srcBlockNumber;
        bytes32[2] srcOpTxId;
    }

    struct MessageData {
        Proposal initialProposal;
        SrcChainData srcChainData;
    }

    /**
     * @dev Message statuses
     * @notice Different kinds of message status
     * @param NOT_INITIALIZED - message is not initialized (default)
     * @param SAVED - message is saved in message storage,
     * but transmission consensus is not reached
     * @param TRANSMITTED - message is proposed in EOB,
     * but not yet ready for execution, only consensus 1 reached
     * @param QUEUED - message is queued for execution
     * @param SUCCESS - message is executed
     * @param FAILED - message execution failed
     * @param OUTOFGAS - message execution failed due to out of gas
     * @param LOW_GAS - message execution is estimated as underpriced, and not invoked
     * @param INVALID - message is detected as invalid on step 1 consensus
     */
    enum MessageStatus {
        NOT_INITIALIZED, // default
        INVALID, // consensus zone
        SAVED, //
        TRANSMITTED, //
        QUEUED, //
        PENDING, // executor zone
        LOW_GAS, // delivery zone
        SUCCESS, //
        FAILED, //
        OUTOFGAS //
    }

    struct Message {
        MessageStatus status;
        uint256 globalNonce;
        MessageData data;
    }

    function statusChangeValid(
        MessageLib.MessageStatus oldStatus,
        MessageLib.MessageStatus newStatus
    ) internal pure returns (bool) {
        if (newStatus == oldStatus) {
            return false;
        }

        if (newStatus == MessageLib.MessageStatus.NOT_INITIALIZED) {
            return false;
        }

        // check if tx status is already determined in
        // blockchain state or consensus
        if (
            oldStatus == MessageLib.MessageStatus.INVALID ||
            oldStatus == MessageLib.MessageStatus.OUTOFGAS ||
            oldStatus == MessageLib.MessageStatus.FAILED ||
            oldStatus == MessageLib.MessageStatus.SUCCESS
        ) {
            return false;
        }

        return true;
    }

    /**
     * @notice This function creates a hash that serves as a unique
     * identifier for the message in a whole UIP network
     * @dev Bytes fields len is used in a hash to prevent collisions from 
     * shifting and falsify or faking message data
     * @param msgData The message data, including src chain data and proposal
     * @return hash Resulting hash of the message data
     */
    function getHashPrefixed(
        MessageLib.MessageData memory msgData
    ) internal pure returns (bytes32) {
        bytes32 msgHash = keccak256(
            abi.encodePacked(
                msgData.initialProposal.destChainId,
                msgData.initialProposal.nativeAmount,
                msgData.initialProposal.selectorSlot,
                msgData.initialProposal.senderAddr,
                msgData.initialProposal.senderAddr.length,
                msgData.initialProposal.destAddr,
                msgData.initialProposal.destAddr.length,
                msgData.initialProposal.payload,
                msgData.initialProposal.payload.length,
                msgData.initialProposal.reserved,
                msgData.srcChainData.location,
                msgData.srcChainData.srcOpTxId
            )
        );

        return
            keccak256(
                abi.encodePacked("\x19Ethereum Signed Message:\n32", msgHash)
            );
    }
}
