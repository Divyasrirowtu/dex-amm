require("@nomicfoundation/hardhat-toolbox");
require("hardhat-coverage"); // Add this line

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  },
  networks: { hardhat: { chainId: 31337 } }
};
