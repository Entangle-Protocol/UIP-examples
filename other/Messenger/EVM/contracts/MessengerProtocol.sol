// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {Initializable, AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {IProposer, AgentParams} from "@entangle-labs/uip-contracts/contracts/interfaces/IProposer.sol";
import {MessageReceiver} from "@entangle-labs/uip-contracts/contracts/MessageReceiver.sol";
import {SelectorLib} from "./lib/SelectorLib.sol";

contract MessengerProtocol is
    Initializable,
    UUPSUpgradeable,
    AccessControlUpgradeable,
    MessageReceiver
{
    // ==============================
    //          ERRORS
    // ==============================
    error ErrorMsgForbidden(bytes msg);

    // ==============================
    //          EVENTS
    // ==============================
    event MessageReceived(bytes sender, bytes message);

    // ==============================
    //        ROLES & CONST
    // ==============================
    bytes32 public constant ADMIN = keccak256("ADMIN");
    bytes4  public constant DEFAULT_SELECTOR = bytes4(keccak256("execute(bytes calldata)"));
    bytes32 public constant ERROR_MSG_HASH =
        0x530008cb6b9f448ff819fbbb1a14a5fc15a8f9255317261cd6388cfc927c6363;

    // ==============================
    //          STORAGE
    // ==============================
    address public endPoint;
    mapping(bytes => uint256) messagesReceived;
    mapping(bytes => bytes[]) messages;

    // ==============================
    //          MODIFIERS
    // ==============================
    modifier onlyEndPoint() {
        require(msg.sender == endPoint, "Not endpoint");
        _;
    }

    // ==============================
    //          FUNCTIONS
    // ==============================
    function initialize(address admin, address newEndPoint) public initializer {
        __UUPSUpgradeable_init();
        __AccessControl_init();
        _setRoleAdmin(ADMIN, ADMIN);
        _grantRole(ADMIN, admin);
        endPoint = newEndPoint;
    }

    function sendMessage(
        uint256 chainID,
        uint256 waitForBlocks,
        uint256 customGasLimit,
        bytes calldata destAddress,
        string calldata _msg
    ) external payable {
        AgentParams memory agentParams = AgentParams(
            waitForBlocks,
            customGasLimit
        );
        IProposer(endPoint).propose{value: msg.value}(
            chainID,
            SelectorLib.encodeDefaultSelector(
                DEFAULT_SELECTOR
            ),
            agentParams,
            destAddress,
            abi.encode(abi.encode(_msg), abi.encode(_msgSender()))
        );
    }

    function execute(bytes calldata data) external override onlyEndPoint {
        bytes memory payload;
        bytes memory message;
        bytes memory sender;
        uint256 srcChainId;

        (srcChainId, , payload) = _decode(data);
        (message, sender) = abi.decode(payload, (bytes, bytes));

        if (keccak256(abi.encodePacked(message)) == ERROR_MSG_HASH) {
            revert ErrorMsgForbidden(message);
        }

        messages[sender].push(message);
        messagesReceived[sender]++;

        emit MessageReceived(sender, message);
    }

    function getMessage(
        uint256 msgIndex,
        bytes memory sender
    ) public view returns (bytes memory message) {
        return messages[sender][msgIndex];
    }

    function getLastMessage(
        bytes memory from
    ) public view returns (bytes memory message) {
        if (messagesReceived[from] == 0) {
            return "Not found";
        }
        return messages[from][messagesReceived[from] - 1];
    }

    function getMessageByAddress(
        uint256 msgIndex,
        address from
    ) public view returns (string memory message_string) {
        bytes memory address_bytes = abi.encode(from);
        bytes memory message = getMessage(msgIndex, address_bytes);
        return abi.decode(message, (string));
    }

    function getLastMessageByAddress(
        address from
    ) public view returns (string memory message_string) {
        bytes memory address_bytes = abi.encode(from);
        bytes memory message = getLastMessage(address_bytes);
        return abi.decode(message, (string));
    }

    // ======    ADMIN   ======
    function changeEndpoint(address _newEndpoint) external onlyRole(ADMIN) {
        endPoint = _newEndpoint;
    }

    function _authorizeUpgrade(address) internal override onlyRole(ADMIN) {}
}
