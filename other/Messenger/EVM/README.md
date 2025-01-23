<div align="center">
    <a href="https://entangle.fi/">
        <img src="https://docs.entangle.fi/~gitbook/image?url=https%3A%2F%2F4040807501-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252F5AajewgFWO9EkufRORqL%252Fuploads%252FDfRGGJJASR0PFitX6rbx%252FTwitter%2520%281%29.png%3Falt%3Dmedia%26token%3D09e49fe6-1b92-4bed-82e6-730ba785afaf&width=1248&dpr=2&quality=100&sign=5fbbb9f4&sv=1" alt="Entangle" style="width:100%;"/>
  </a>


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
- [License](#license)



## Build and Install

### Building the project 

To compile the project contracts use:
```bash
npx hardhat compile
```




### protocol-contracts--deployments

To deploy messenger protocol use:
```bash
npx hardhat run scripts/deployMessenger.ts --network [network_name]
```

Deployed contract address you can find in ./addresses/ folder





## Testing

### local-testing

To test the deploying to hardhat network run this command:
```shell
npx hardhat test test/messenger.test.ts
```




### testnet--mainnet-testing

If you deployed contract into some testnet / mainnet, you can send custom message and get the last one using these commands:
```shell
npx hardhat sendMessage --destchainid 80002 --destaddress <address of deployed contract on polygon amoy>  --message "hello" --network ethereum_sepolia
```

```shell
npx hardhat getLastMessage --sender <your sender wallet address> --network polygon_amoy
```




## License 
This project is licensed under the [MIT License](LICENSE) (License was changed from BSL 1.1)