// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AgentParamsLib} from "./lib/AgentParamsLib.sol";

contract AgentParamsEncoderMock {

    function encode(uint256 _waitForBlocks, uint256 _customGasLimit) external pure returns (bytes memory packedParams) {
        AgentParamsLib.AgentParams memory params = AgentParamsLib.AgentParams({
            waitForBlocks: _waitForBlocks,
            customGasLimit: _customGasLimit
        });
        return AgentParamsLib.encode(params);
    }
}