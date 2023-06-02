// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ZsToken is ERC20 {
    // constructor(address seller, uint256 initialSupply) ERC20("ZsToken", "ZS") {
    //     _mint(seller, initialSupply);
    // }
    constructor(uint256 initialSupply) ERC20("ZsToken", "ZS") {
        _mint(msg.sender, initialSupply);
    }

    function addMore(uint256 supply) public {
        _mint(msg.sender, supply);
    }
}
