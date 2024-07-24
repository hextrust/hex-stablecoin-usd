import * as dotenv from 'dotenv';
import "@nomicfoundation/hardhat-toolbox";
import '@openzeppelin/hardhat-upgrades';
import { HardhatUserConfig } from 'hardhat/types';
import "@nomiclabs/hardhat-truffle5";
import 'hardhat-exposed';
import 'solidity-coverage'

dotenv.config()

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.23",
    settings: {
      optimizer: {
        enabled: true,
        runs: 2000,
        details: {
          yul: true,
        }
      },
    },
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  },
  etherscan: {
    apiKey: {
      goerli: process.env.ETHERSCAN_API_KEY || '',
      sepolia: process.env.ETHERSCAN_API_KEY || '',
      mainnet: process.env.ETHERSCAN_API_KEY || '',
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 80000
  }
};

export default config;
