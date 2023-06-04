// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ZsToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("ZsToken", "ZS") {
        _mint(msg.sender, initialSupply);
    }
}
