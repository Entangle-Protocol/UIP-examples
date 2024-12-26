// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

abstract contract MessageReceiver {
    /**
     * @dev Executes a function call from a specified source chain and address.
     *
     * This internal function is intended to be used for executing cross-chain
     * calls with the provided payload. It requires to be overridden by child contracts to execute the command
     * @param data The data payload to be sent along with the function call.
     *
     */
    function execute(bytes calldata data) external virtual {}

    function _decode(
        bytes calldata data
    )
        internal
        virtual
        returns (
            uint256 sourceChainId,
            bytes memory senderAddr,
            bytes memory payload
        )
    {
        (sourceChainId, senderAddr, payload) = abi.decode(
            data,
            (uint256, bytes, bytes)
        );
    }
}
