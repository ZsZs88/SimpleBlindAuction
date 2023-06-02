// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ZsToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("ZsToken", "ZS") {
        address address1 = address(0x7Cd53d0D8C70A14cE66f4a8590F7DD9748551C24);
        _mint(address1, initialSupply);
    }
}
