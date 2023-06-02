let SealedBidAuction = artifacts.require("SealedBidAuction");
let ZsToken = artifacts.require("ZsToken");

let Web3 = require("web3");
let provider = new Web3.providers.HttpProvider("http://127.0.0.1:8545");
let web3 = new Web3(provider);

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

	// it("Initialization before auction shoud be good", async () => {
	// 	sellerBalance = await token.balanceOf(sellerAddress);
	// 	auctionBalance = await token.balanceOf(auctionAddress);

	// 	assert.equal(sellerBalance, 2000, "Seller has no tokens");
	// 	assert.equal(auctionBalance, 0, "Auction has balance");
	// });

	// it("Transfer from seller should work", async () => {
	// 	await token.transfer(auctionAddress, 1000, { from: sellerAddress });

	// 	sellerBalance = await token.balanceOf(sellerAddress);
	// 	auctionBalance = await token.balanceOf(auctionAddress);

	// 	assert.equal(sellerBalance, 1000, "Not good amount of tokens");
	// 	assert.equal(auctionBalance, 1000, "Not good amount of tokens");

	// 	//only to fill it back to 2000
	// 	token.addMore(1000, { from: sellerAddress });
	// });

	// it("After transfer the seller should be able to start the auction and the bidders should be able to bid", async () => {
	// 	await token.transfer(auctionAddress, 1000, { from: sellerAddress });
	// 	await auction.startAuction({ from: sellerAddress });

	// 	//To increase time
	// 	await time.increase(80);
	// 	await time.advanceBlock();

	// 	for (var bidderAddress of bidderAddresses) {
	// 		await auction.placeBid(bidderAddress["bid"]["hash"], {
	// 			from: bidderAddress["address"],
	// 			value: 200,
	// 		});
	// 	}

	// 	assert.equal(
	// 		await web3.eth.getBalance(auctionAddress),
	// 		800,
	// 		"Auctions balance is not as expected"
	// 	);

	// 	//To increase time
	// 	await time.increase(120);
	// 	await time.advanceBlock();

	// 	for (var bidderAddress of bidderAddresses) {
	// 		await auction.revealBid(
	// 			bidderAddress["bid"]["value"],
	// 			bidderAddress["bid"]["nonce"],
	// 			{
	// 				from: bidderAddress["address"],
	// 			}
	// 		);
	// 	}

	// 	//To increase time
	// 	await time.increase(80);
	// 	await time.advanceBlock();

	// 	let highestBid = await auction.highestBid();
	// 	assert.equal(highestBid, 180, "Unexpected highest bid");

	// 	//only to fill it back to 2000
	// 	token.addMore(1000, { from: sellerAddress });
	// });

	it("The winner should be able to claim the tokens, the others should withdraw their excess funds", async () => {
		sellerBalance = await token.balanceOf(sellerAddress);
		auctionBalance = await token.balanceOf(auctionAddress);

		assert.equal(sellerBalance, 2000, "Seller has no tokens");
		assert.equal(auctionBalance, 0, "Auction has balance");

		await token.transfer(auctionAddress, 1000, { from: sellerAddress });

		sellerBalance = await token.balanceOf(sellerAddress);
		auctionBalance = await token.balanceOf(auctionAddress);

		assert.equal(sellerBalance, 1000, "Not good amount of tokens");
		assert.equal(auctionBalance, 1000, "Not good amount of tokens");

		await auction.startAuction({ from: sellerAddress });

		//To increase time
		await time.increase(80);
		await time.advanceBlock();

		for (var bidderAddress of bidderAddresses) {
			await auction.placeBid(bidderAddress["bid"]["hash"], {
				from: bidderAddress["address"],
				value: 200,
			});
		}

		assert.equal(
			await web3.eth.getBalance(auctionAddress),
			800,
			"Auctions balance is not as expected"
		);

		//To increase time
		await time.increase(120);
		await time.advanceBlock();

		for (var bidderAddress of bidderAddresses) {
			await auction.revealBid(
				bidderAddress["bid"]["value"],
				bidderAddress["bid"]["nonce"],
				{
					from: bidderAddress["address"],
				}
			);
		}

		//To increase time
		await time.increase(80);
		await time.advanceBlock();

		let highestBid = await auction.highestBid();
		assert.equal(highestBid, 180, "Unexpected highest bid");

		let winner = await auction.highestBidder();
		assert.equal(winner, accounts[4], "Not expected winner");

		for (var bidderAddress of bidderAddresses) {
			if (bidderAddress["address"] !== winner)
				await auction.withdrawExcessFunds({ from: bidderAddress["address"] });
		}

		await auction.claimToken({ from: winner });

		assert(token.balanceOf(winner), 1000, "Winner did not get the tokens");
		assert(
			token.balanceOf(auctionAddress),
			0,
			"Auction did not transfer the tokens"
		);
	});
});
