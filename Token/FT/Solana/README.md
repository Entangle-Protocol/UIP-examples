# Example fungible token UIP protocol on Solana

This is an implementation of the sample FT Solana program that uses UIP for
cross-chain communication, as well as the UIP extension needed to receive
messages and scripts to interact with it. It can be used to send tokens to
another blockchain.

The contract is built using the
[Anchor framework](https://www.anchor-lang.com/).

## Testing

Before testing, make sure to generate the admin keypair:

```sh
solana-keygen grind --starts-with adm:1 --ignore-case
mv the-resulting-admin-keypair.json keys/admin.json
```

Then run `anchor test`.

## Protocol extension

The repository contains
[the protocol extension](./extensions/example-token-extension) for the sample
token protocol. It can be compiled as follows:

```sh
cargo build --target wasm32-wasip1 --release -p example-token-extension
wasm-opt -O4 target/wasm32-wasip1/release/example_token_extension.wasm -o target/wasm32-wasip1/release/example_token_extension-optimized.wasm
```

Then it needs to be uploaded to IPFS.

## Scripts

The repository contains scripts to interact with the deployed contract.

* [Initialization script](./scripts/initialize.ts) that is run after the
contract is deployed to configurate the contract and register the extension.
Example:
  ```sh
  anchor run initialize --provider.cluster devnet -- bafkreigdetzvn34sw7phgg74j5smwn2tnmrm46lwsreozxmuevhjwxxp5q 9
  ```
* [Mint script](./scripts/mint.ts) that can be used to mint tokens. Example:
  ```sh
  anchor run --provider.cluster devnet mint -- your-address 100000000000
  ```
* [Bridge script](./scripts/bridge.ts) that can be used to send tokens to
another chain. Example:
  ```sh
  anchor run --provider.cluster devnet bridge -- 1 ethereum-sepolia 100 100000 dest-address 1000000000
  ```
