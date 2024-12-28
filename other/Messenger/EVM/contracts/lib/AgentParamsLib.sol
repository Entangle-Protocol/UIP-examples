// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title  Library for endpoint
library AgentParamsLib {

    struct AgentParams {
        uint256 waitForBlocks;
        uint256 customGasLimit;
    }

    function encode(AgentParamsLib.AgentParams memory params) external pure returns(bytes memory packedParams) {
        return abi.encodePacked(params.waitForBlocks, params.customGasLimit);
    }

    function decode(bytes calldata packedParams) external pure returns(AgentParamsLib.AgentParams memory params) {
        (params.waitForBlocks, params.customGasLimit) = abi.decode(packedParams, (uint256, uint256));
    }

}
