# Messenger sample program

This is a sample Solana dApp, utilizing UIP to send signed text accross
blockchains.

It's built using the [Anchor framework](https://www.anchor-lang.com/).

## Using the program via scripts

This repository contains two scripts to work with the on-chain program:
`send-message` and `get-messages-by-sender`.

You can send a message by specifying the gas price you need to pay in lamports,
the destination chain and the text. For example:

```sh
anchor run send-message --provider.cluster devnet -- 10000 polygon-amoy "Hello, world!"
```

To be delivered, the message must be processed by the UIP transmitters. Then you
can retrieve the messages received on the Solana instance by sender:

```sh
anchor run get-messages-by-sender --provider.cluster devnet -- 0x0bf2d34be3b960aeEB238741D6Ab6FF9D9726A9e
```

```
11/29/2024 4:36:01 PM | 0x0a7bbcaa4aad54a44046ab7caf4b5d623a513e24 (chain id 80002): Hello, world!
```
