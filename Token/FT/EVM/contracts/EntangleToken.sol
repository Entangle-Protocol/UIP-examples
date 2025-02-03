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
    event BridgeDone(address from, address to, uint256 amount, uint256 srcChainId, bytes32 indexed marker);

    bytes32 public constant ADMIN = keccak256("ADMIN");
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
        address _admin,
        address _startReceipient,
        uint256 _startAmount
    )
        initializer public
    {
        __ERC20_init(name,symbol);
        __Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();
        _setRoleAdmin(ADMIN, ADMIN);
        _setRoleAdmin(BURNER, ADMIN);
        _grantRole(ADMIN, _admin);
        _mint(_startReceipient, _startAmount);
    }

    /// @notice Initiates the token bridging operation between chains.
    /// @param _chainIdTo The ID of the target chain for token bridging.
    /// @param _to The address of the recipient on the target chain.
    /// @param _amount The amount of tokens to bridge.
    /// @param _marker The marker for the currect bridge operation.
    function bridge(
        uint256 _chainIdTo,
        address _from,
        bytes memory _to,
        uint256 _amount,
        bytes32 _marker,
        uint256 waitForBlocks,
        uint256 customGasLimit
    ) external whenNotPaused {
        if (!knownOrigins[msg.sender]) revert EntangelToken__UnknownOrigin();
        if (address(endpoint) == address(0)) revert EntangelToken__EndpointNotSet();
        if (_chainIdTo == block.chainid) revert EntangelToken__BridgingToTheSameChain();
        if (_amount < minBridgeAmounts[_chainIdTo]) revert EntangelToken__AmountIsLessThanMinimum();
        if (minBridgeAmounts[_chainIdTo] == 0) revert EntangelToken__ChainIsNotSupported();

        AgentParams memory agentParams = AgentParams(
            waitForBlocks,
            customGasLimit
        );
        bytes memory encodedParams = abi.encodePacked(agentParams.waitForBlocks, agentParams.customGasLimit);

        _burn(_from, _amount);
        endpoint.propose(
            _chainIdTo,
            SelectorLib.encodeDefaultSelector(bytes4(keccak256("redeem(bytes calldata)"))),
            encodedParams,
            _to,
            abi.encode(abi.encode(_from), _to, _amount, _marker)
        );
    }

    /// @notice Redeems tokens on the receiving chain after a successful bridge operation.
    /// @param data Keeper encoded data, real params below
    /// @custom:param _to The recipient address in bytes
    /// @custom:param _amount The amount of tokens to transfer.
    /// @custom:param _fee The fee deducted from the transferred amount.
    /// @custom:param _txhash The transaction hash from the sending chain.
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
        emit BridgeDone(from, to, amount, srcChainId, marker);
    }

    /// @notice Burns a specified amount of tokens.
    /// Only the burner role can execute this function.
    /// @param _amount The amount of wrapped tokens to burn.
    function burn(uint256 _amount) external onlyRole(BURNER) {
        _burn(msg.sender, _amount);
    }

    function _afterTokenTransfer(address, address to, uint256 amount) internal {
        if (to == address(this)) {
            _approve(address(this), msg.sender, allowance(address(this), msg.sender) + amount);
        }
    }

    // ======    ADMIN   ======

    /// @notice Sets the endpoint address.
    /// This value can only be set ONCE.
    /// @param _endpoint The address of the aggregation spotter.
    function setEndpoint(address _endpoint) external onlyRole(ADMIN) {
        if (_endpoint == address(0)) revert EntangelToken__ZeroAddress();

        address oldEndpoint = address(endpoint);
        endpoint = IEndpoint(_endpoint);
        _grantRole(SPOTTER, _endpoint);

        emit EntangelToken__NewEndpoint(oldEndpoint, _endpoint);
    }

    /// @notice Sets the minimum amount of tokens that can be bridged.
    /// @param chainIds The IDs of the chains.
    /// @param minAmounts The minimum amounts of tokens that can be bridged to chains
    function setMinBridgeAmount(uint256[] memory chainIds, uint256[] memory minAmounts) public onlyRole(ADMIN) {
        if (chainIds.length != minAmounts.length) revert EntangelToken__LengthsMismatch();
        uint256 chainIdsLen = chainIds.length;

        for (uint256 i; i < chainIdsLen; ++i) {
            uint256 key = chainIds[i];
            uint256 value = minAmounts[i];
            minBridgeAmounts[key] = value;
        }
    }

    function setOrigins(address[] memory origins, bool[] memory statuses) public onlyRole(ADMIN) {
        if (origins.length != statuses.length) revert EntangelToken__LengthsMismatch();

        for (uint256 i = 0; i < origins.length; ++i) {
            knownOrigins[origins[i]] = statuses[i];
        }
    }

    /// @notice Pauses token bridging.
    function pauseBridge() external onlyRole(ADMIN) {
        _pause();
    }

    /// @notice Unpauses token bridging.
    function unpauseBridge() external onlyRole(ADMIN) {
        _unpause();
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyRole(ADMIN)
        override
    {}
}

