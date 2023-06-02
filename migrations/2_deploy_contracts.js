var SealedBidAuction = artifacts.require("./SealedBidAuction.sol");
var ZsToken = artifacts.require("./ZsToken.sol");
var Bidder = artifacts.require("./Bidder.sol");
// import { addresses } from "../config";
module.exports = function (deployer) {
	deployer.deploy(Bidder);
	deployer.deploy(Seller);
	// deployer.deploy(ZsToken, 2000);
	// deployer.deploy(
	// 	SealedBidAuction("0x7cD53D0d8C70a14cE66F4A8590f7Dd9748551c24", 100, 10, 10),
	// 	{ from: "0x6B614D891D43A6d7d82666f42a7B7C3a9D2Eb1f1" }
	// );
};
