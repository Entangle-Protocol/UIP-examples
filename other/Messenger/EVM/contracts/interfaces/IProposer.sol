// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

struct AgentParams {
    uint256 waitForBlocks;
    uint256 customGasLimit;
}

interface IProposer {
    function propose(
        uint256 destChainID,
        bytes32 selectorSlot,
        AgentParams calldata agentParams,
        bytes calldata destAddress,
        bytes calldata params
    ) external payable;
}
