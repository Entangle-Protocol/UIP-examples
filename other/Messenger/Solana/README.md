# Messenger UIP protocol on Solana

This is an implementation of the sample Messenger Solana program that uses UIP
for cross-chain communication, as well as the UIP extension needed to receive
messages and scripts to interact with it. It can be used to send text messages,
associated with a sender. It also allows to whitelist allowed sender addresses.

The contract is built using the
[Anchor framework](https://www.anchor-lang.com/).

## Building

To build the program and the TypeScript SDK, run

```sh
anchor build # or anchor build --features mainnet
cp target/idl/messenger.json target/types/messenger.ts ts-sdk/src/idl/
bun run build:sdk
```

## Testing

Before testing, make sure to generate the admin keypair:

```sh
solana-keygen grind --starts-with adm:1 --ignore-case
mv the-resulting-admin-keypair.json keys/admin.json
```

Then run `anchor test`.

## Protocol extension

The repository contains
[the protocol extension](./extensions/messenger-extension) for the Messenger
protocol. It can be compiled as follows:

```sh
cargo build --target wasm32-wasip1 --release -p messenger-extension
wasm-opt -O4 target/wasm32-wasip1/release/messenger_extension.wasm -o target/wasm32-wasip1/release/messenger_extension-optimized.wasm
```

Then it needs to be uploaded to IPFS.

## Scripts

The repository contains scripts for interacting with the deployed contract.

* [Initialization script](./scripts/initialize.ts) that is run after
the contract is deployed to configurate the Messenger and register the
extension. Example:
  ```sh
  anchor run initialize --provider.cluster devnet -- \
    --extension bafkreigepdb2xvspn6p4xekbc57jrhuh7t2gw3izcfgajia24ibikuec5y
  ```
* [SendMessage script](./scripts/sendMessage.ts) that can be used to
send a message to another chain. Example:
  ```sh
  anchor run --provider.cluster devnet send-message -- \
    --times 1 \
    --dst-chain ethereum-sepolia \
    --fee 10000000 \
    --custom-gas-limit 300000 \
    --text "Hi from Solana"
  ```
* [GetMessagesBySender script](./scripts/getMessagesBySender.ts) that
can be used to verify the delivery of a user's messages. Example:
  ```sh
  anchor run --provider.cluster devnet get-messages-by-sender -- 0xb3b029c49ea026bacc0901a071cf8fd0d5bde9af
  ```
