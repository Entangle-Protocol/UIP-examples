import { HardhatUserConfig, task } from "hardhat/config";
import '@openzeppelin/hardhat-upgrades';
import "@nomicfoundation/hardhat-toolbox";
import "./tasks/balance"
import "./tasks/getBlock"
import "./tasks/getChainIds"
import "./tasks/getLastMessage"
import "./tasks/getMsg"
import "./tasks/getMsgExecution"
import "./tasks/getMsgHash"
import "./tasks/getMsgStatusByHash"
import "./tasks/getReward"
import "./tasks/getTxData"
import "./tasks/readTxEvent"
import "./tasks/sendMessage"

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
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
            mnemonic: "",
        },
        chainId: 33133
    },
    ethereum_sepolia: {
        url: "https://ethereum-sepolia-rpc.publicnode.com",
        accounts: {
            mnemonic: "",
        },
        chainId: 11155111
    },
    polygon_amoy: {
        url: "https://rpc-amoy.polygon.technology",
        accounts: {
            mnemonic: "",
        },
        chainId: 80002
    },
    mantle_sepolia: {
        url: "https://rpc.sepolia.mantle.xyz",
        accounts: {
            mnemonic: ""
        },
        chainId: 5003
    }
  }
};

export default config;
