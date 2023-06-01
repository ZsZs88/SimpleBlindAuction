var SimpleBank = artifacts.require("./SimpleBank.sol");
module.exports = function (deployer) {
	deployer.deploy(SimpleBank);
	deployer.deploy(SealedBidAuction());
};
