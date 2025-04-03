// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { ERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { AccessControlUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { IEndpoint } from "@entangle-labs/uip-contracts/contracts/interfaces/endpoint/IEndpoint.sol";
import { TransmitterParamsLib } from "@entangle-labs/uip-contracts/contracts/lib/TransmitterParamsLib.sol";
import { SelectorLib } from "@entangle-labs/uip-contracts/contracts/lib/SelectorLib.sol";
import { MessageReceiver } from "@entangle-labs/uip-contracts/contracts/MessageReceiver.sol";

/// @title  ExampleToken
/// @notice Represents an *NGL token used for bridging operations between different chains.
contract ExampleToken is
    Initializable,
    ERC20Upgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable,
    MessageReceiver
{

    // ==============================
    //          ERRORS
    // ==============================
    error ExampleToken__ZeroAddress();
    error ExampleToken__UnknownOrigin();
    error ExampleToken__EndpointNotSet();
    error ExampleToken__BridgingToTheSameChain();
    error ExampleToken__LengthsMismatch();

    // ==============================
    //          EVENTS
    // ==============================
    event NewEndpoint(address oldEndpoint, address newEndpoint);
    event TokensBridged(address from, bytes to, uint256 amount, uint256 toChainId);
    event TokensReceived(bytes from, address to, uint256 amount, uint256 srcChainId);

    bytes32 public constant ENDPOINT = keccak256("ENDPOINT");
    
    IEndpoint public endpoint;
    mapping(uint256 chainId => bytes origin) public knownOrigins;

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
        __AccessControl_init();
        __UUPSUpgradeable_init();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _setRoleAdmin(ENDPOINT, DEFAULT_ADMIN_ROLE);
        _mint(startReceipient, startAmount);
    }

    /**
     * @notice Initiates the token bridging operation between chains.
     * @param toChainId The ID of the target chain for token bridging.
     * @param to The encoded address of the recipient on the target chain.
     * @param amount The amount of tokens to bridge.
     * @param blockFinalizationOption Finalization option
     * 0 - Fast Finalization (Default):
     *   - Prioritizes speed with a minimal finalization process.
     *   - Suitable for most applications.
     *
     * 1 - Standard Finalization:
     *   - Uses the full finalization process as defined by the network.
     *   - Ensures maximum security and data immutability.
     *
     * 2 - Unsafe Finalization:
     *   - Provides near-immediate confirmation by bypassing standard processes.
     *   - Risk of block reorgs; use only when immediate confirmation outweighs data integrity.
     * @param customGasLimit Custom gas limit for execution between endpoint and target protocol
     */
    function bridge(
        uint256 toChainId,
        bytes calldata to,
        uint256 amount,
        uint256 blockFinalizationOption,
        uint256 customGasLimit
    ) external payable {
        if (address(endpoint) == address(0)) revert ExampleToken__EndpointNotSet();
        if (toChainId == block.chainid) revert ExampleToken__BridgingToTheSameChain();

        bytes storage destAddress = knownOrigins[toChainId];
        if (destAddress.length == 0) {
            revert ExampleToken__UnknownOrigin();
        }

        TransmitterParamsLib.TransmitterParams memory transmitterParams = TransmitterParamsLib.TransmitterParams(
            blockFinalizationOption,
            customGasLimit
        );
        bytes memory encodedParams = abi.encode(transmitterParams.blockFinalizationOption, transmitterParams.customGasLimit);

        address from = msg.sender;
        _burn(from, amount);

        endpoint.propose{ value: msg.value }(
            toChainId,
            SelectorLib.encodeDefaultSelector(bytes4(keccak256("execute(bytes)"))),
            encodedParams,
            destAddress,
            abi.encode(abi.encode(from), to, amount)
        );

        emit TokensBridged(from, to, amount, toChainId);
    }

    function execute(bytes calldata data) external override payable onlyRole(ENDPOINT) {
        _redeem(data);
    }

    function _redeem(bytes calldata data) private {
        (
            uint256 srcChainId,
            bytes memory senderAddress, 
            bytes memory payload
        ) = _decode(data);

        if (keccak256(knownOrigins[srcChainId]) != keccak256(senderAddress)) {
            revert ExampleToken__UnknownOrigin();
        }

        (
            bytes memory sender,
            bytes memory receiver,
            uint256 amount
        ) = abi.decode(payload, (bytes, bytes, uint256));

        address to = abi.decode(receiver, (address));

        _mint(to, amount);
        emit TokensReceived(sender, to, amount, srcChainId);
    }

    // ======    ADMIN   ======

    /// @notice Sets the endpoint address.
    /// @param newEndpoint The address of the aggregation spotter.
    function setEndpoint(address newEndpoint) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newEndpoint == address(0)) revert ExampleToken__ZeroAddress();

        address oldEndpoint = address(endpoint);
        endpoint = IEndpoint(newEndpoint);
        _grantRole(ENDPOINT, newEndpoint);

        emit NewEndpoint(oldEndpoint, newEndpoint);
    }

    function setOrigins(uint256[] memory chainIds, bytes[] memory origins) public onlyRole(DEFAULT_ADMIN_ROLE) {
        if (chainIds.length != origins.length) {
            revert ExampleToken__LengthsMismatch();
        }

        for (uint256 i = 0; i < origins.length; ++i) {
            knownOrigins[chainIds[i]] = origins[i];
        }
    }

    function mint(address to, uint256 amount) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _mint(to, amount);
    }

    function decimals() public view virtual override returns (uint8) {
        // For compatibility with Solana
        return 9;
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyRole(DEFAULT_ADMIN_ROLE)
        override
    {}
}

