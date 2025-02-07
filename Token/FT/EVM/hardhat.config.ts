import { HardhatUserConfig, task } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import '@openzeppelin/hardhat-upgrades';
import "./tasks/sendTokens";
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
    }
  }
};

export default config;
