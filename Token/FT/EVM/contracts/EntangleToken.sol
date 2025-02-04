// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { ERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { AccessControlUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { PausableUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import { IEndpoint, AgentParams } from "@entangle-labs/uip-contracts/contracts/interfaces/endpoint/IEndpoint.sol";
import { SelectorLib } from "@entangle-labs/uip-contracts/contracts/lib/SelectorLib.sol";
import { MessageReceiver } from "@entangle-labs/uip-contracts/contracts/MessageReceiver.sol";

/// @title  EntangleToken
/// @notice Represents an *NGL token used for bridging operations between different chains.
contract EntangleToken is
    Initializable,
    ERC20Upgradeable,
    PausableUpgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable,
    MessageReceiver
{

    // ==============================
    //          ERRORS
    // ==============================
    error EntangelToken__ZeroAddress();
    error EntangelToken__UnknownOrigin();
    error EntangelToken__EndpointNotSet();
    error EntangelToken__BridgingToTheSameChain();
    error EntangelToken__AmountIsLessThanMinimum();
    error EntangelToken__ChainIsNotSupported();
    error EntangelToken__LengthsMismatch();

    // ==============================
    //          EVENTS
    // ==============================
    event EntangelToken__NewEndpoint(address oldEndpoint, address newEndpoint);
    event EntangelToken__Sent(address from, address to, uint256 amount, uint256 toChainId, bytes32 indexed marker);
    event EntangelToken__Received(address from, address to, uint256 amount, uint256 srcChainId, bytes32 indexed marker);

    bytes32 public constant SPOTTER = keccak256("SPOTTER");
    bytes32 public constant BURNER = keccak256("BURNER");
    
    IEndpoint endpoint;
    mapping(uint256 destChainId => uint256 minAmount) public minBridgeAmounts;
    mapping(address origin => bool isKnown) public knownOrigins;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        string memory name,
        string memory symbol,
        address admin,
        address startReceipient,
        uint256 startAmount
    )
        initializer public
    {
        __ERC20_init(name,symbol);
        __Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _setRoleAdmin(BURNER, DEFAULT_ADMIN_ROLE);
        _mint(startReceipient, startAmount);
    }

    /// @notice Initiates the token bridging operation between chains.
    /// @param toChainId The ID of the target chain for token bridging.
    /// @param to The address of the recipient on the target chain.
    /// @param amount The amount of tokens to bridge.
    /// @param marker The marker for the currect bridge operation.
    function bridge(
        uint256 toChainId,
        address from,
        bytes memory to,
        uint256 amount,
        bytes32 marker,
        uint256 waitForBlocks,
        uint256 customGasLimit
    ) external payable whenNotPaused {
        if (!knownOrigins[msg.sender]) revert EntangelToken__UnknownOrigin();
        if (address(endpoint) == address(0)) revert EntangelToken__EndpointNotSet();
        if (toChainId == block.chainid) revert EntangelToken__BridgingToTheSameChain();
        if (amount < minBridgeAmounts[toChainId]) revert EntangelToken__AmountIsLessThanMinimum();
        if (minBridgeAmounts[toChainId] == 0) revert EntangelToken__ChainIsNotSupported();

        AgentParams memory agentParams = AgentParams(
            waitForBlocks,
            customGasLimit
        );
        bytes memory encodedParams = abi.encodePacked(agentParams.waitForBlocks, agentParams.customGasLimit);

        _burn(from, amount);
        endpoint.propose{ value: msg.value }(
            toChainId,
            SelectorLib.encodeDefaultSelector(bytes4(keccak256("redeem(bytes calldata)"))),
            encodedParams,
            to,
            abi.encode(abi.encode(from), to, amount, marker)
        );

        emit EntangelToken__Sent(from, abi.decode(to, (address)), amount, toChainId, marker);
    }

    /// @notice Redeems tokens on the receiving chain after a successful bridge operation.
    /// @param data Keeper encoded data, real params below
    /// @custom:param to The recipient address in bytes
    /// @custom:param amount The amount of tokens to transfer.
    /// @custom:param _fromChain The ID of the sending chain.
    function redeem(bytes calldata data) external onlyRole(SPOTTER) whenNotPaused {
        if (!knownOrigins[msg.sender]) revert EntangelToken__UnknownOrigin();

        (uint256 srcChainId, ,bytes memory payload) = _decode(data);
        (
            bytes memory sender,
            bytes memory receiver,
            uint256 amount,
            bytes32 marker
        ) = abi.decode(payload, (bytes, bytes, uint256, bytes32));

        address to = abi.decode(receiver, (address));
        address from = abi.decode(sender, (address));

        _mint(to, amount);
        emit EntangelToken__Received(from, to, amount, srcChainId, marker);
    }

    /// @notice Burns a specified amount of tokens.
    /// Only the burner role can execute this function.
    /// @param amount The amount of wrapped tokens to burn.
    function burn(address user, uint256 amount) external onlyRole(BURNER) {
        _burn(user, amount);
    }

    function _afterTokenTransfer(address, address to, uint256 amount) internal {
        if (to == address(this)) {
            _approve(address(this), msg.sender, allowance(address(this), msg.sender) + amount);
        }
    }

    // ======    ADMIN   ======

    /// @notice Sets the endpoint address.
    /// This value can only be set ONCE.
    /// @param newEndpoint The address of the aggregation spotter.
    function setEndpoint(address newEndpoint) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newEndpoint == address(0)) revert EntangelToken__ZeroAddress();

        address oldEndpoint = address(endpoint);
        endpoint = IEndpoint(newEndpoint);
        _grantRole(SPOTTER, newEndpoint);

        emit EntangelToken__NewEndpoint(oldEndpoint, newEndpoint);
    }

    /// @notice Sets the minimum amount of tokens that can be bridged.
    /// @param chainIds The IDs of the chains.
    /// @param minAmounts The minimum amounts of tokens that can be bridged to chains
    function setMinBridgeAmount(uint256[] memory chainIds, uint256[] memory minAmounts) public onlyRole(DEFAULT_ADMIN_ROLE) {
        if (chainIds.length != minAmounts.length) revert EntangelToken__LengthsMismatch();
        uint256 chainIdsLen = chainIds.length;

        for (uint256 i; i < chainIdsLen; ++i) {
            uint256 key = chainIds[i];
            uint256 value = minAmounts[i];
            minBridgeAmounts[key] = value;
        }
    }

    function setOrigins(address[] memory origins, bool[] memory statuses) public onlyRole(DEFAULT_ADMIN_ROLE) {
        if (origins.length != statuses.length) revert EntangelToken__LengthsMismatch();

        for (uint256 i = 0; i < origins.length; ++i) {
            knownOrigins[origins[i]] = statuses[i];
        }
    }

    /// @notice Pauses token bridging.
    function pauseBridge() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /// @notice Unpauses token bridging.
    function unpauseBridge() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyRole(DEFAULT_ADMIN_ROLE)
        override
    {}
}

