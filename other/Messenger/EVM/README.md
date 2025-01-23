<div align="center">
  <h1>Simple Messenger Protocol</h1>
</div>

This is an example of deploying and connecting a custom protocol on EVM-based chains.

## Table of Contents

- [Build and install](#build-and-install)
    - [Compiling project contracts](#building-the-project)
    - [Deployments](#protocol-contracts--deployments)
- [Testing](#testing)
    - [Local tests](#local-testing)
    - [Testnet and mainnet testing](#testnet--mainnet-testing)
- [License](LICENSE)


## Build and Install

### Building the project 

To compile the project contracts use:
```bash
npx hardhat compile
```

### Deployments

To deploy messenger protocol use:
```bash
npx hardhat run scripts/deployMessenger.ts --network [network_name]
```

Deployed contract address you can find in ./addresses/ folder


## Testing

### Local tests

To test the deploying to hardhat network run this command:
```shell
npx hardhat test test/messenger.test.ts
```

### Testnet and mainnet testing

If you deployed contract into some testnet / mainnet, you can send custom message and get the last one using these commands:
```shell
npx hardhat sendMessage --destchainid 80002 --destaddress <address of deployed contract on polygon amoy>  --message "hello" --network ethereum_sepolia
```

```shell
npx hardhat getLastMessage --sender <your sender wallet address> --network polygon_amoy
```


## License 
This project is licensed under the [MIT License](LICENSE) (License was changed from BSL 1.1)