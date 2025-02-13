# Messenger UIP protocol on Solana

This is an implementation of the sample Messenger Solana program that uses UIP
for cross-chain communication, as well as the UIP extension needed to receive
messages and scripts to interact with it. It can be used to send text messages,
associated with a sender. It also allows to whitelist allowed sender addresses.

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
[the protocol extension](./extensions/messenger-extension) for the Messenger
protocol. It can be compiled as follows:

```sh
cargo build --target wasm32-wasip1 --release -p messenger-extension
wasm-opt -O4 target/wasm32-wasip1/release/messenger_extension.wasm -o target/wasm32-wasip1/release/messenger_extension-optimized.wasm
```

Then it needs to be uploaded to IPFS.

## Scripts

The repository contains scripts to interact with the deployed contract.

* [Initialization script](./scripts/initialize.ts) that is run after
the contract is deployed to configurate the Messenger and register the
extension. Example:
  ```sh
  anchor run initialize-messenger --provider.cluster localnet -- bafkreifntpfa6vrjdmbxfiiaevox34ier4cdql72b5sghkkm6ovan7gzsa
  ```
* [SendMessage script](./scripts/sendMessage.ts) that can be used to
send a message to another chain. Example:
  ```sh
  anchor run --provider.cluster devnet send-message -- 1 ethereum-sepolia 100 100000 "Hi from Solana!"
  ```
* [GetMessagesBySender script](./scripts/getMessagesBySender.ts) that
can be used to verify the delivery of a user's messages. Example:
  ```sh
  anchor run --provider.cluster devnet get-messages-by-sender -- 0xb3b029c49ea026bacc0901a071cf8fd0d5bde9af
  ```
