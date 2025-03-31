import { HardhatUserConfig, task } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import '@openzeppelin/hardhat-upgrades';
import "./tasks/sendTokens";
import "./tasks/setOrigin";
import "./tasks/estimateFee";
import "./tasks/getBalance";
import "./tasks/getMsgData";
import "./tasks/getMsgExecutionStatus";
import "./tasks/getMsgStatusByHash";
import "./tasks/getProposal";
import "./tasks/getReward"

import dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
        {
            version: "0.8.28",
            settings: {
                optimizer: {
                    enabled: true,
                    runs: 200,
                },
                viaIR: true,
            },
        },
        {
          version: "0.8.24",
          settings: {
              optimizer: {
                  enabled: true,
                  runs: 200,
              },
              viaIR: true,
          },
      },
    ],
  },

  networks: {
    hardhat: {
        // @ts-ignore
        urlParsed: "http://localhost:8545",
        chainId: 31337
    },
    localhost: {
        // @ts-ignore
        urlParsed: "http://localhost:8545",
        chainId: 31337
    },
    teib: {
        url: "https://evm-testnet.entangle.fi",
        accounts: {
            mnemonic: process.env.MNEMONIC || "",
        },
        chainId: 33133
    },
    ethereum_sepolia: {
        url: "https://ethereum-sepolia-rpc.publicnode.com",
        accounts: {
            mnemonic: process.env.MNEMONIC || "",
        },
        chainId: 11155111
    },
    polygon_amoy: {
        url: `https://polygon-amoy.infura.io/v3/${process.env.INFURA_KEY}` || "",
        accounts: {
            mnemonic: process.env.MNEMONIC || "",
        },
        chainId: 80002
    },
    mantle_sepolia: {
        url: "https://rpc.sepolia.mantle.xyz",
        accounts: {
            mnemonic: process.env.MNEMONIC || "",
        },
        chainId: 5003
    },
    base_sepolia: {
        url: "https://base-sepolia.drpc.org",
        accounts: {
            mnemonic: process.env.MNEMONIC || "",
        },
        chainId: 84532
    },
    sonic_blaze: {
        url: process.env.SONIC_BLAZE || "",
        accounts: {
            mnemonic: process.env.NEW_MNEMONIC || "",
        },
        chainId: 57054
    },
    avalanche_fuji: {
        url: process.env.AVALANCHE_FUJI || "",
        accounts: {
            mnemonic: process.env.NEW_MNEMONIC || "",
        },
        chainId: 43113
    },
    ethereum_mainnet: {
        url: process.env.ETHEREUM_MAINNET || "",
        accounts: {
            mnemonic: process.env.NEW_MNEMONIC || "",
        },
        chainId: 1
    },
    sonic_mainnet: {
        url: process.env.SONIC_MAINNET || "",
        accounts: {
            mnemonic: process.env.NEW_MNEMONIC || "",
        },
        chainId: 146
    }
  }
};

export default config;
