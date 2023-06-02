// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "./ZsToken.sol";

contract Seller {
    function transferTokens(
        uint256 tokens,
        ZsToken tokenAddress,
        address auctionAddress
    ) public {
        tokenAddress.transfer(auctionAddress, tokens);
    }
}
