require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.28",
  networks: {
    'rootstock-testnet': {
      url: 'https://public-node.testnet.rsk.co',
      accounts: [process.env.PRIVATE_KEY],
      chainId: 31
    },
  },
  
};
