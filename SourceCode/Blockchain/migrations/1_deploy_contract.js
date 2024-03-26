const SBEToken = artifacts.require("SBEToken");

module.exports = function (deployer) {
  deployer.deploy(SBEToken);
};
