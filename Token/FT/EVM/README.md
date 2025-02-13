<div align="center">

  <h1>Simple Token Bridge</h1>

</div>

ExampleToken is token designed for cross-chain bridging operations. It utilizes Entangle Labs' Universal Interoperability Protocol (UIP) to facilitate seamless token transfers between different blockchain networks.

## Table of Contents
- [Build and Setup](#build-and-setup)
    - [Installation](#installation)
    - [Building the project](#building-the-project)
    - [Deployment](#deployment)
    - [Setup](#setup)
- [Testing](#testing)
    - [Local tests](#local-tests)
    - [Cross-chain token transfer](#cross-chain-token-transfer)
- [License](#license)

## Build and Setup

### Installation

Ensure you have Node.js and npm installed, then install the dependencies:
```bash
npm install
```

### Building the project
To compile the project contracts use:
```bash
npx hardhat compile
```

### Deployment
To deploy ExampleToken on a network:
```bash
npx hardhat run scripts/deployExampleToken.ts --network <network_name>
```

### Setup
Before sending tokens, you need to set the token contract from another chain as an origin. Run the following command:
```bash
npx hardhat setOrigin --chainid <other_chain_id> --networkname <other_network_name> --network <current_network>
```
You need to do this for both networks.

## Testing

### Local tests
To run the test suite:
```bash
npx hardhat test test/ExampleToken.test.ts
```

### Cross-chain token transfer
If you deployed the contract on multiple networks, you can send tokens across chains using:
```bash
npx hardhat sendTokens --tochainid <other_chain_id> --to <receiver_address_on_other_chain> --amount <amount> --destaddress <ExampleToken_address_on_other_chain> --network <current_chain>
```

## License
This project is licensed under the [MIT License](./LICENCE)