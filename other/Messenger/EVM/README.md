<div align="center">
  <a href="https://entangle.fi/">
    <img src="https://docs.entangle.fi/~gitbook/image?url=https%3A%2F%2F4040807501-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252F5AajewgFWO9EkufRORqL%252Fuploads%252FDfRGGJJASR0PFitX6rbx%252FTwitter%2520%281%29.png%3Falt%3Dmedia%26token%3D09e49fe6-1b92-4bed-82e6-730ba785afaf&width=1248&dpr=2&quality=100&sign=5fbbb9f4&sv=1" alt="Entangle" style="width:100%;"/>
  </a>

  <h1>Simple Messenger Protocol</h1>

  <p>
    <strong>This is an example of deploying and connecting a custom protocol on EVM-based chains.</strong>
  </p>

  <p>
    <a href="https://docs.entangle.fi/universal-interoperability-protocol/developer-guide/solidity/deploying-your-evm-protocol"><img alt="Docs" src="https://img.shields.io/badge/Readthedocs-%23000000.svg?style=for-the-badge&logo=readthedocs&logoColor=white)"/></a>
  </p>
</div>


## Table of Contents

- [Build and install](#build-and-install)
    - [Compiling project contracts](#building-the-project)
    - [Deployments](#deployments)
- [Testing](#testing)
    - [Local tests](#local-testing)
    - [Estimating fees](#estimating-fees)
    - [Testnet and mainnet testing](#testnet-and-mainnet-testing)
- [License](#license)



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




### Estimating Fees  

The `@entangle-labs/uip-sdk` NPM package provides functionality for estimating the minimum required `msg.value` that should be sent with a message when proposing it. Proper fee estimation is crucial to ensure that all types of messages are successfully processed from the source to the destination chain. If the estimated fee is too low, the message may enter an **UNDERESTIMATED** state and fail to proceed.  

#### How Fee Estimation Works  

By leveraging our **UDFOracle**, we continuously update the current market prices of native coins across connected blockchains. This allows us to accurately calculate the execution cost of a message on the destination chain based on the:  

- Defined gas limit for a specific protocol  
- Native gas prices of the involved blockchains  
- UIP protocol fees  

Once the execution cost on the destination chain is determined, it is converted into the required value on the source chain. The result is the **minimum recommended `msg.value`** that should be provided when proposing a message to ensure successful execution on the destination chain.  

---

#### Integration with this example repository

The @entangle-labs/uip-sdk package is also integrated into this example repository to provide functionality of fees estimation while sending messages. You can try estimation with a "estimateFee" task. Additionally, it is integrated into the message-sending process with "sendMessage" task, eliminating the need for manual fee estimation when using our example repository.

--- 

#### Manual Fee Estimation via Hardhat

To estimate the fee manually, run the following command:

```bash
npx hardhat estimateFee --srcchainid <source_chain_id> --destchainid <destination_chain_id> --gaslimit <custom_gas_limit>
```

#### Expected Output
```
Cross-chain Fee Estimate:
- Network: Chain 5003 → Chain 33133
- Estimated native value (ETH): 0.000000000000003362
- Estimated native value (Gwei): 0.000003362
- Estimated native value (Wei): 3362
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
This project is licensed under the [MIT License](./LICENCE)