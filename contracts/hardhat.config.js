require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.28",
  networks: {
    'rootstock-testnet': {
      url: 'https://public-node.testnet.rsk.co'
    },
  },
  etherscan: {
    apiKey: {
      'rootstock-testnet': 'empty'
    },
    customChains: [
      {
        network: "rootstock-testnet",
        chainId: 31,
        urls: {
          apiURL: "https://rootstock-testnet.blockscout.com/api",
          browserURL: "https://rootstock-testnet.blockscout.com"
        }
      }
    ]
  },
  sourcify: {
    enabled: true
  }
};
