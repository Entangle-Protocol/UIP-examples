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

The repository contains scripts for interacting with the deployed contract.

* [Initialization script](./scripts/initialize.ts) that is run after
the contract is deployed to configurate the Messenger and register the
extension. Example:
  ```sh
  anchor run initialize --provider.cluster devnet -- \
    --extension bafkreibmfdgizgrindzlyq3r4gu4ydl7egzgyoj3qki74dsauvmjm4scta
  ```
* [SendMessage script](./scripts/sendMessage.ts) that can be used to
send a message to another chain. Example:
  ```sh
  anchor run --provider.cluster devnet send-message -- \
    --times 1 \
    --dst-chain ethereum-sepolia \
    --fee 10000000 \
    --custom-gas-limit 300000 \
    --text "Hi from Solana!"
  ```
* [GetMessagesBySender script](./scripts/getMessagesBySender.ts) that
can be used to verify the delivery of a user's messages. Example:
  ```sh
  anchor run --provider.cluster devnet get-messages-by-sender -- 0xb3b029c49ea026bacc0901a071cf8fd0d5bde9af
  ```

## Deploying your own messenger

To deploy your own instance of the messenger, generate the program keypair and
put it in `target/deploy`:

```sh
solana-keygen grind --starts-with mes:1 --num-threads 6 --ignore-case
mv messenger-keypair.json target/deploy/messenger-keypair.json
```

Next, replace the program address in `programs/messenger/src/lib.rs` and
`Anchor.toml` with the public key of the generated keypair.

Then run `anchor build` (for devnet) or `anchor build --mainnet` (for mainnet).
After that, you are ready to deploy your program:

```sh
solana program deploy --url devnet \
  --upgrade-authority ~/.config/solana/id.json \
  --program-id target/deploy/messenger-keypair.json target/deploy/messenger.so
```

Then [the initialization script](#Scripts) can be executed.
