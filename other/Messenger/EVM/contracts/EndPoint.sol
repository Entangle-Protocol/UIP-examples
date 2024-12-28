// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {Initializable, AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IWNative} from "./interfaces/IWNative.sol";
import {MessageLib} from "./lib/MessageLib.sol";
import {SignatureLib} from "./lib/SignatureLib.sol";
import {SelectorLib} from "./lib/SelectorLib.sol";
import {LocationLib} from "./lib/LocationLib.sol";
import {SafeCall} from "./lib/SafeCall.sol";

import "hardhat/console.sol";

/**
 * @notice Endpoint contract
 * @dev Contract for message proposing and execution to destination protocol
 */
contract EndPoint is Initializable, UUPSUpgradeable, AccessControlUpgradeable {
    using MessageLib for MessageLib.MessageData;
    using LocationLib for uint256;

    // =========
    //   ERRORS 
    // ========= 

    error EndPoint__ZeroAddress();
    error EndPoint__InvalidSelector();
    error EndPoint__InvalidDestination();
    error EndPoint__InvalidExecutor(address executor);
    error EndPoint__MessageAlreadyExecuted(bytes32 msgHash);
    error EndPoint__ZeroMsgValue();

    error EndPoint__AgentAlreadyRegistered(address agent);
    error EndPoint__AgentAlreadyExcluded(address agent);
    error EndPoint__ExecutorAlreadyRegistered(address agent);
    error EndPoint__ExecutorAlreadyExcluded(address agent);
    error EndPoint__InvalidConsensusRate(uint256 rate);
    error EndPoint__ConsensusNotReached(uint256 validSigs, uint256 sigsThreshold);

    error EndPoint__RetryExecutionFailed(bytes32, bytes);
    error EndPoint__InvalidReplenish();
    error EndPoint__InvalidResend();
    error EndPoint__InvalidValue(uint256 sum, uint256 value);

    // =========
    //   EVENTS 
    // ========= 

    event ConsensusReached(uint256 validSigs, uint256 sigsRequired);
    event AgentSet(address indexed agent, bool status);
    event ExecutorSet(address indexed executor, bool status);
    event MessageProposed(
        uint256 destChainId,
        uint256 nativeAmount,
        bytes32 selectorSlot,
        bytes agentParams,
        bytes senderAddr,
        bytes destAddr,
        bytes payload,
        bytes reserved
    );
    event InvalidSignature(address indexed signer, uint256 id);
    event MessageExecuted(bytes32 msgHashPrefixed);
    event FailedWithData(
        bytes32 msgHashPrefixed,
        bytes data
    );


    // ====================
    //   ROLES & CONSTANTS 
    // ====================

    bytes32 public constant ADMIN = keccak256("ADMIN");
    uint256 public constant MIN_SIGS_REQUIRED = 1;
    uint256 public constant CONSENSUS_DENOM = 10_000;

    // Interface-compatible
    // bytes4(keccak256("execute(bytes calldata)"));
    bytes4 public constant DEFAULT_SELECTOR = 0x09c5eabe;
    bytes4 public constant MR_REPLENISH_SELECTOR = bytes4(keccak256("replenish(bytes)"));      
    bytes4 public constant MR_RESEND_SELECTOR = bytes4(keccak256("resend(bytes)"));
    uint256 public constant EIB_CHAINID = 33133; 

    

    // ==========
    //   STORAGE 
    // ==========

    /// @notice Consensus rate
    uint256 public consensusRate;

    /// @notice Active Agents
    uint256 public totalActiveAgents;

    address public repeater;
    address public connector;
    address public wNative;

    /// @notice This mapping allows agents to participate in message execution
    mapping(address agent => bool status) public allowedAgents;
    mapping(address executor => bool status) public allowedExecutors;
    mapping(bytes32 msgHashPrefixed => uint256 statusCode) public messagesExecuted;
    mapping(uint256 executionCode => bytes4 selector) public supportedCommands;


    // ============
    //   FUNCTIONS 
    // ============

    function initialize(
        address[] calldata initAddr,
        uint256 _defaultConsensusRate
    ) public initializer {
        __UUPSUpgradeable_init();
        __AccessControl_init();
        _setRoleAdmin(ADMIN, ADMIN);
        _grantRole(ADMIN, initAddr[0]);
        consensusRate = _defaultConsensusRate;
    }

    function propose(
        uint256 destChainID,
        bytes32 selectorSlot,
        bytes calldata agentParams,
        bytes calldata destAddress,
        bytes calldata params
    ) external payable {
        if (msg.value == 0) {
            revert EndPoint__ZeroMsgValue();
        }

        IWNative(wNative).deposit{value: msg.value}();
        SafeERC20.safeTransfer(IWNative(wNative), connector, msg.value);

        emit MessageProposed(
            destChainID,
            msg.value,
            selectorSlot,
            agentParams,
            abi.encode(_msgSender()),
            destAddress,
            params,
            ""
        );
    }

    function execute(
        MessageLib.MessageData calldata msgData,
        bytes calldata agentSigs
    ) external payable {
        if (msgData.initialProposal.destChainId != block.chainid) {
            revert EndPoint__InvalidDestination();
        }
        if (!allowedExecutors[_msgSender()]) {
            revert EndPoint__InvalidExecutor(_msgSender());
        }

        bytes32 msgHashPrefixed = msgData.getHashPrefixed();
        if (messagesExecuted[msgHashPrefixed] == 1) {
            revert EndPoint__MessageAlreadyExecuted(msgHashPrefixed);
        }

        verifyConsensus(msgHashPrefixed, agentSigs);

        address addressToCall = abi.decode(
            msgData.initialProposal.destAddr,
            (address)
        );

        bytes4 selector = _getSelector(msgData.initialProposal.selectorSlot);
        bytes memory internalCallData = abi.encode(
            msgData.srcChainData.location.getChain(),
            msgData.initialProposal.senderAddr,
            msgData.initialProposal.payload
        );
        (bool success, bytes memory ret) = SafeCall.safeCall(
            addressToCall,
            gasleft(),
            msg.value,
            480, // 12 slots + 3 default slots for errors
            abi.encodeWithSelector(selector, internalCallData)
        );

        if (success) {
            messagesExecuted[msgHashPrefixed] = 1;
            emit MessageExecuted(msgHashPrefixed);
        } else {
            messagesExecuted[msgHashPrefixed] = 2;
            emit FailedWithData(msgHashPrefixed, ret);
        }
    }

    function retry(
        MessageLib.MessageData calldata msgData
    ) external payable {
        bytes32 msgHashPrefixed = msgData.getHashPrefixed();

        if (messagesExecuted[msgHashPrefixed] == 1) {
            revert EndPoint__MessageAlreadyExecuted(msgHashPrefixed);
        }

        address addressToCall = abi.decode(
            msgData.initialProposal.destAddr,
            (address)
        );

        bytes4 selector = _getSelector(msgData.initialProposal.selectorSlot);
        bytes memory internalCallData = abi.encode(
            msgData.srcChainData.location.getChain(),
            msgData.initialProposal.senderAddr,
            msgData.initialProposal.payload
        );
        (bool success, bytes memory ret) = SafeCall.safeCall(
            addressToCall,
            gasleft(),
            msg.value,
            480, // 12 slots + 3 default slots for errors
            abi.encodeWithSelector(selector, internalCallData)
        );

        if (success) {
            messagesExecuted[msgHashPrefixed] = 1;
            emit MessageExecuted(msgHashPrefixed);
        } else
            revert EndPoint__RetryExecutionFailed(msgHashPrefixed, ret);
    }

    // TODO: executeBatch ?, test all boundary conditions

    function verifyConsensus(
        bytes32 msgHash,
        bytes calldata agentSigs
    ) private {
        uint256 sigsThreshold = ((consensusRate * totalActiveAgents) / CONSENSUS_DENOM);

        uint256 validSigs;
        uint256 sigLen;
        address recovered;

        assembly {
            sigLen := byte(0, calldataload(agentSigs.offset))
        }

        if (sigLen < MIN_SIGS_REQUIRED) {
            revert EndPoint__ConsensusNotReached(0, consensusRate); 
        }

        for (uint i = 0; i < sigLen; i++) {
            uint8 v;
            bytes32 r;
            bytes32 s;

            assembly {
                v := byte(add(1, i), calldataload(agentSigs.offset))

                // get agent sigs pointer -> skip (sigLen + 1) bytes -> skip next (32*2*i) bytes -> take 32 bytes
                r := calldataload( add(add(agentSigs.offset, add(sigLen, 1)), mul(0x20, mul(2, i)) ) )        
                
                // get agent sigs pointer -> skip (sigLen + 1) bytes -> skip next (32*(2*i+1)) bytes -> take 32 bytes     
                s := calldataload( add(add(agentSigs.offset, add(sigLen, 1)), mul(0x20, add(mul(2, i), 1)) ) )
            }
            console.log(v);
            console.logBytes32(r);
            console.logBytes32(s);
            recovered = ecrecover(
                msgHash,
                v,
                r,
                s
            );
            if (allowedAgents[recovered]) {
                validSigs += 1;
            } else {
                emit InvalidSignature(recovered, i);
            }

            // Check if the amount of valid signatures exceeds the required amount of signatures
            if (validSigs > sigsThreshold) {
                emit ConsensusReached(
                    validSigs,
                    sigsThreshold
                );
                // Exit early if consensus is reached
                return; 
            }

        }

        if (validSigs <= sigsThreshold) {
            revert EndPoint__ConsensusNotReached(
                validSigs,
                sigsThreshold
            );
        }

    }

    /**
     * @dev Selector is not checked for some value
     * as it can be empty for fallback
     * @param selectorSlot Selector slot encoded to bytes32 with
     * UIP SelectorLib
     */
    function _getSelector(
        bytes32 selectorSlot
    ) private view returns (bytes4 selector) {
        if (
            SelectorLib.getType(selectorSlot) ==
            SelectorLib.SelectorType.SELECTOR
        ) {
            // (selector, ) = SelectorLib.extract(selectorSlot);
            // use default
            selector = DEFAULT_SELECTOR;
        } else {
            (, uint256 exCode) = SelectorLib.extract(selectorSlot);
            selector = supportedCommands[exCode];
        }
    }

    function replenish (
        // uint256 waitForBlocks, 
        // uint256 customGasLimit,
        uint256 fee,
        uint256 amount,
        bytes calldata msgHash
    ) external payable {
        if (msg.value == 0) {
            revert EndPoint__ZeroMsgValue();
        }

        if (msg.value < amount + fee) {
            revert EndPoint__InvalidValue(amount + fee, msg.value);
        }

        IWNative(wNative).deposit{value: msg.value}();
        IWNative(wNative).transfer(connector, msg.value);

        emit MessageProposed (
            EIB_CHAINID,
            fee,
            MR_REPLENISH_SELECTOR,                   
            "",
            abi.encode(address(this)),
            abi.encode(repeater),
            abi.encode(msgHash, amount),
            ""
        );
    }

    function resend(
        // uint256 waitForBlocks,
        // uint256 customGasLimit,
        bytes calldata msgHash
    ) external payable {
    
        emit MessageProposed (
            EIB_CHAINID,
            msg.value,
            MR_RESEND_SELECTOR,                   
            "",
            abi.encode(address(this)),
            abi.encode(repeater),
            abi.encode(msgHash),
            ""
        );
    }

    // =========
    //   ADMIN 
    // ========= 

    function setRepeater(address _repeater) public onlyRole(ADMIN) {
        if (_repeater != address(0)) {
            repeater = _repeater;
        } else
            revert EndPoint__ZeroAddress();
    }

    function registerAgent(address agent) public onlyRole(ADMIN) {
        if (agent == address(0)) {
            revert EndPoint__ZeroAddress();
        }
        if (allowedAgents[agent]) {
            revert EndPoint__AgentAlreadyRegistered(agent);
        }

        _setAgent(agent, true);
    }

    function registerExecutor(address executor) public onlyRole(ADMIN) {
        if (executor == address(0)) {
            revert EndPoint__ZeroAddress();
        }
        if (allowedExecutors[executor]) {
            revert EndPoint__ExecutorAlreadyRegistered(executor);
        }

        _setExecutor(executor, true);
    }

    function excludeAgent(address agent) public onlyRole(ADMIN) {
        if (agent == address(0)) {
            revert EndPoint__ZeroAddress();
        }
        if (!allowedAgents[agent]) {
            revert EndPoint__AgentAlreadyExcluded(agent);
        }

        _setAgent(agent, false);
    }

    function excludeExecutor(address executor) public onlyRole(ADMIN) {
        if (executor == address(0)) {
            revert EndPoint__ZeroAddress();
        }
        if (allowedExecutors[executor]) {
            revert EndPoint__ExecutorAlreadyExcluded(executor);
        }

        _setExecutor(executor, false);
    }

    // TODO: add checks

    function registerOrExcludeBatch(
        address[] calldata agents,
        bool isAgent,
        bool isRegistering
    ) external onlyRole(ADMIN) {
        if (isAgent) {
            totalActiveAgents += agents.length;
        }
        uint256 len = agents.length;
        for (uint256 i = 0; i < len; i++) {
            if (isAgent) {
                _setAgent(agents[i], isRegistering);
            } else {
                _setExecutor(agents[i], isRegistering);
            }
        }
    }

    function _setAgent(address agent, bool status) private {
        allowedAgents[agent] = status;
        emit AgentSet(agent, status);
    }

    function _setExecutor(address executor, bool status) private {
        allowedExecutors[executor] = status;
        emit ExecutorSet(executor, status);
    }

    function setConsensusTargetRate(uint256 rate) external onlyRole(ADMIN) {
        if (rate < 5000) {
            revert EndPoint__InvalidConsensusRate(rate);
        }
        consensusRate = rate;
    }

    function setTotalActiveAgents(uint256 num) external onlyRole(ADMIN) {
        totalActiveAgents = num;
    }

    function setConnector(address _connector) external onlyRole(ADMIN) {
        if (_connector == address(0)) {
            revert EndPoint__ZeroAddress();
        }
        connector = _connector;
    }

    function setNative(address native) external onlyRole(ADMIN) {
        if (native == address(0)) {
            revert EndPoint__ZeroAddress();
        }
        wNative = native;
    }

    function _authorizeUpgrade(address) internal override onlyRole(ADMIN) {}
}
