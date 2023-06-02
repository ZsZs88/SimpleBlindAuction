// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

// These files are dynamically created at test time
import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/SealedBidAuction.sol";
import "../contracts/ZsToken.sol";
import "../contracts/Bidder.sol";

// import {addresses} from "../config.js";

contract TestBid {
    function testAddres() public {
        // ZsToken bidContract = ZsToken(DeployedAddresses.ZsToken());
        // Assert.equal(
        //     bidContract.balanceOf(
        //         address(0x7Cd53d0D8C70A14cE66f4a8590F7DD9748551C24)
        //     ),
        //     2000,
        //     "Owner should have 2000 ZsToken initially"
        // );
        // Bidder bidder = Bidder(DeployedAddresses.Bidder());
        // Assert.equal(
        //     bidder.address,
        //     address(0x7Cd53d0D8C70A14cE66f4a8590F7DD9748551C24),
        //     "Nope"
        // );
    }
}
