var SimpleBank = artifacts.require("SimpleBank");
contract("SimpleBank", function (accounts) {
	var sb; // To store the instance when running
	// Test case 1
	it("Test initial balance", function () {
		return SimpleBank.deployed()
			.then(function (instance) {
				sb = instance;
				return sb.getBalance({ from: accounts[0] });
			})
			.then(function (x) {
				assert.equal(0, x, "Wrong initial balance");
			});
	});
	// Test case 2
	it("Test balance after deposit", function () {
		return SimpleBank.deployed()
			.then(function (instance) {
				sb = instance;
				return sb.deposit({
					from: accounts[0],
					value: web3.utils.toWei("10", "ether"),
				});
			})
			.then(function (tx_receipt) {
				return sb.getBalance({ from: accounts[0] });
			})
			.then(function (x) {
				assert.equal(web3.utils.toWei("10", "ether"), x, "Wrong balance");
			})
			.then(function () {
				return sb.getBalance({ from: accounts[1] });
			})
			.then(function (x) {
				assert.equal(0, x, "Wrong balance");
			});
	});
});
