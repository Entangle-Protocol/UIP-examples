// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.22;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {IWNative} from "@entangle-labs/uip-contracts/contracts/interfaces/external/IWNative.sol";

contract WNative is ERC20, ERC20Permit {
    constructor() ERC20("WNative", "WNative") ERC20Permit("WNative") {
        _mint(msg.sender, 100 * 10 ** decimals());
    }

    function deposit() external payable {
        _mint(msg.sender, msg.value);
    }
    
    function withdraw(uint wad) external {
        _burn(msg.sender, wad);
        (bool ok, ) = msg.sender.call{value: wad}("");
        if (!ok) revert ();
    }

}