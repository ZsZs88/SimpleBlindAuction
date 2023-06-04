let SealedBidAuction = artifacts.require("SealedBidAuction");
let ZsToken = artifacts.require("ZsToken");

let Web3 = require("web3");
let provider = new Web3.providers.HttpProvider("http://127.0.0.1:8484");
let web3 = new Web3(provider);

let chai = require("chai");
let chaiAsPromised = require("chai-as-promised");
let { expect } = chai;

// Enable the chai-as-promised plugin
chai.use(chaiAsPromised);

const {
	BN,
	ether,
	constants,
	expectEvent,
	shouldFail,
	time,
} = require("@openzeppelin/test-helpers");

// let getTime = (anything) => {
// 	web3.eth
// 		.getBlockNumber()
// 		.then((blockNumber) => {
// 			// Get the block information for the latest block
// 			web3.eth.getBlock(blockNumber).then((block) => {
// 				// Access the block timestamp
// 				const timestamp = block.timestamp;
// 				console.log("Block timestamp: ", timestamp, " - ", anything);
// 			});
// 		})
// 		.catch((error) => {
// 			console.error("Error:", error);
// 		});
// };

contract("SealedBidAuction", (accounts) => {
	var sellerAddress = accounts[0];
	var bidderAddresses = [
		{
			address: accounts[1],
			bid: {
				value: 150,
				nonce: 150,
				hash: "0x0102cc5146d1051ce44a18587305db975f3797c2fc61f502425d48ef991848a5",
			},
		},
		{
			address: accounts[2],
			bid: {
				value: 160,
				nonce: 160,
				hash: "0xa7c5540d5e7703313131c73d900900e3981ef27e9153b6e219297c289213a2aa",
			},
		},
		{
			address: accounts[3],
			bid: {
				value: 170,
				nonce: 170,
				hash: "0x103bfe8127b54989c5ec4fbed4b10d2fe84c24e1a5d88d257535149701f9b0f4",
			},
		},
		{
			address: accounts[4],
			bid: {
				value: 180,
				nonce: 180,
				hash: "0x302df660fb6996f25227d7563474b0416fb1248e3baf10e37d53417d0a9afaa1",
			},
		},
		{
			//badbidder
			address: accounts[5],
			bid: {
				value: 250,
				nonce: 250,
				hash: "0x302df660fb6996f25227d7563474b0416fb1248e3baf10e37d53417d0a9afaa1",
			},
		},
	];

	var token;
	var tokenAddress;
	var auction;
	var auctionAddress;

	beforeEach(async () => {
		token = await ZsToken.deployed();
		tokenAddress = token.address;
		auction = await SealedBidAuction.deployed();
		auctionAddress = auction.address;
	});

	it("Check initiialization", async () => {
		let sellerBalance = await token.balanceOf(sellerAddress);
		let auctionBalance = await token.balanceOf(auctionAddress);

		assert.equal(sellerBalance, 2000, "Seller has no tokens");
		assert.equal(auctionBalance, 0, "Auction has balance");
	});

	it("Check state after tokentransfer", async () => {
		await token.transfer(auctionAddress, 1000, { from: sellerAddress });

		let sellerBalance = await token.balanceOf(sellerAddress);
		let auctionBalance = await token.balanceOf(auctionAddress);

		assert.equal(sellerBalance, 1000, "Not good amount of tokens");
		assert.equal(auctionBalance, 1000, "Not good amount of tokens");
	});

	it("Check for error thrown if someone tries to start the auction who is not the seller", async () => {
		try {
			await auction.startAuction({ from: accounts[6] });
		} catch (error) {
			assert(
				error.message.includes("revert"),
				"Only the seller can perform this action"
			);
		}
	});

	it("Check for error thrown if value is less than reservePrice", async () => {
		await auction.startAuction({ from: sellerAddress });

		//To increase time
		await time.increase(80);
		await time.advanceBlock();

		try {
			await auction.placeBid(bidderAddresses[0]["bid"]["hash"], {
				from: bidderAddresses[0]["address"],
				value: 50,
			});
		} catch (error) {
			assert(
				error.message.includes("revert"),
				"Bid amount must be equal to or higher than the reserve price"
			);
		}
	});

	it("Check for error thrown if seller tries to start the auction again", async () => {
		try {
			await auction.startAuction({ from: sellerAddress });
		} catch (error) {
			assert(error.message.includes("revert"), "Auction has already started");
		}
	});

	it("Check state after bids were placed", async () => {
		for (let bidderAddress of bidderAddresses) {
			await auction.placeBid(bidderAddress["bid"]["hash"], {
				from: bidderAddress["address"],
				value: 200,
			});
		}

		assert.equal(
			await web3.eth.getBalance(auctionAddress),
			1000,
			"Auctions balance is not as expected"
		);
	});

	it("Check for error thrown if bidder has already placed a bid", async () => {
		try {
			await auction.placeBid(bidderAddresses[0]["bid"]["hash"], {
				from: bidderAddresses[0]["address"],
				value: 200,
			});
		} catch (error) {
			assert(
				error.message.includes("revert"),
				"Bidder has already placed a bid"
			);
		}
	});

	it("Check for error thrown if bidding phase has ended", async () => {
		//To increase time
		await time.increase(120);
		await time.advanceBlock();

		try {
			await auction.placeBid(bidderAddresses[0]["bid"]["hash"], {
				from: bidderAddresses[0]["address"],
				value: 200,
			});
		} catch (error) {
			assert(error.message.includes("revert"), "Bidding phase has ended");
		}
	});

	it("Check for error thrown for bad hash", async () => {
		try {
			await auction.revealBid(600, bidderAddresses[0]["bid"]["nonce"], {
				from: bidderAddresses[0]["address"],
			});
		} catch (error) {
			assert(error.message.includes("revert"), "Hashes do not match");
		}
	});

	it("Check for error thrown if bidder has not placed a bid", async () => {
		try {
			await auction.revealBid(200, 0xffff, {
				from: accounts[6],
			});
		} catch (error) {
			assert(error.message.includes("revert"), "Bidder has not placed a bid");
		}
	});

	it("Check for error thrown if bidder has not deposited enough for paying their bid", async () => {
		try {
			await auction.revealBid(
				bidderAddresses[4]["bid"]["value"],
				bidderAddresses[4]["bid"]["nonce"],
				{
					from: bidderAddresses[4]["address"],
				}
			);
		} catch (error) {
			assert(
				error.message.includes("revert"),
				"The bids value is not payable from balance placed"
			);
		}
	});

	it("Check state after bids were revealed", async () => {
		for (let bidderAddress of bidderAddresses.slice(0, 4)) {
			await auction.revealBid(
				bidderAddress["bid"]["value"],
				bidderAddress["bid"]["nonce"],
				{
					from: bidderAddress["address"],
				}
			);
		}

		let highestBid = await auction.highestBid();
		assert.equal(highestBid, 180, "Unexpected highest bid");

		let winner = await auction.highestBidder();
		assert.equal(winner, accounts[4], "Not expected winner");
	});

	it("Check for error thrown if bid has already been revealed", async () => {
		try {
			await auction.revealBid(
				bidderAddresses[0]["bid"]["value"],
				bidderAddresses[0]["bid"]["nonce"],
				{
					from: bidderAddresses[0]["address"],
				}
			);
		} catch (error) {
			assert(error.message.includes("revert"), "Bid has already been revealed");
		}
	});

	it("Check for error thrown for claiming the token before auction end", async () => {
		let winner = await auction.highestBidder();
		try {
			await auction.claimToken({ from: winner });
		} catch (error) {
			assert(error.message.includes("revert"), "Auction has not ended yet");
		}
	});

	it("Check for error thrown if revealing phase already ended", async () => {
		//To increase time
		await time.increase(80);
		await time.advanceBlock();

		try {
			await auction.revealBid(
				bidderAddresses[0]["bid"]["value"],
				bidderAddresses[0]["bid"]["nonce"],
				{
					from: bidderAddresses[0]["address"],
				}
			);
		} catch (error) {
			assert(error.message.includes("revert"), "Revealing phase has ended");
		}
	});

	it("Check for error thrown if token claim is not from winner", async () => {
		try {
			await auction.claimToken({
				from: bidderAddresses[0]["address"],
			});
		} catch (error) {
			assert(
				error.message.includes("revert"),
				"Only the highest bidder can claim the token"
			);
		}
	});

	it("Check for error thrown if winner wants to withdraw", async () => {
		let winner = await auction.highestBidder();
		try {
			await auction.withdrawExcessFunds({ from: winner });
		} catch (error) {
			assert(
				error.message.includes("revert"),
				"The highest bidder cannot withdraw excess funds"
			);
		}
	});

	it("Check results of withdraws", async () => {
		let winner = await auction.highestBidder();

		for (var bidderAddress of bidderAddresses) {
			if (bidderAddress["address"] !== winner)
				await auction.withdrawExcessFunds({ from: bidderAddress["address"] });
		}

		assert.equal(
			await web3.eth.getBalance(auctionAddress),
			200,
			"Auctions balance is not as expected"
		);
	});

	it("Check results of withdraws", async () => {
		let winner = await auction.highestBidder();

		await auction.claimToken({ from: winner });

		assert.equal(
			await web3.eth.getBalance(auctionAddress),
			180,
			"Auctions balance is not as expected"
		);

		assert(token.balanceOf(winner), 1000, "Winner did not get the tokens");
		assert(
			token.balanceOf(auctionAddress),
			0,
			"Auction did not transfer the tokens"
		);
	});

	it("Check for error thrown if winner tries to claim tokens again", async () => {
		let winner = await auction.highestBidder();
		try {
			await auction.claimToken({
				from: winner,
			});
		} catch (error) {
			assert(error.message.includes("revert"), "Tokens already claimed");
		}
	});
});
