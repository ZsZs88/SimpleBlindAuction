var SealedBidAuction = artifacts.require("./SealedBidAuction.sol");
var ZsToken = artifacts.require("./ZsToken.sol");
var Bidder1 = artifacts.require("./Bidder1.sol");
var Seller = artifacts.require("./Seller.sol");
// import { addresses } from "../config";
module.exports = async function (deployer, network, accounts) {
	let sellerAddress = accounts[0];
	var tokenAddress;

	// console.log(accounts);

	await deployer
		.deploy(ZsToken, 2000, { from: sellerAddress })
		.then(() => ZsToken.deployed())
		.then((token) => {
			tokenAddress = token.address;
			console.log("TokenAddress: ", tokenAddress);
		});

	await deployer
		.deploy(
			SealedBidAuction,
			tokenAddress, //Address of the token contract
			100, //Minimum price of the auction
			120, //Bidding phase
			120, //Revealing phase
			1000, //Amount of tokens on auction
			{ from: sellerAddress }
		)
		.then(() => SealedBidAuction.deployed())
		.then((auction) => {
			console.log("Auction: ", auction.address);
		});
};
