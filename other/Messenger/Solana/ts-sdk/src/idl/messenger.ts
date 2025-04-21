/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/messenger.json`.
 */
export type Messenger = {
  "address": "MeskEHG9jyVQGrZsNSYTLzxH9waE6UjrWEsviCQn2E1";
  "metadata": {
    "name": "messenger";
    "version": "0.1.0";
    "spec": "0.1.0";
    "description": "Created with Anchor";
  };
  "docs": [
    "The messenger program module.",
  ];
  "instructions": [
    {
      "name": "execute";
      "docs": [
        "Executes an incoming cross-chain message, saving the received message in",
        "a `CrossChainMessage` account.",
      ];
      "discriminator": [
        101,
        120,
        101,
        99,
        117,
        116,
        101,
        0,
      ];
      "accounts": [
        {
          "name": "uipMsg";
        },
      ];
      "args": [];
    },
    {
      "name": "initialize";
      "docs": [
        "Initializes the messenger with an admin and optionally a list of allowed",
        "senders.",
      ];
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237,
      ];
      "accounts": [
        {
          "name": "messenger";
          "writable": true;
          "pda": {
            "seeds": [
              {
                "kind": "const";
                "value": [
                  77,
                  69,
                  83,
                  83,
                  69,
                  78,
                  71,
                  69,
                  82,
                ];
              },
            ];
          };
        },
        {
          "name": "payer";
          "writable": true;
          "signer": true;
        },
        {
          "name": "systemProgram";
          "address": "11111111111111111111111111111111";
        },
      ];
      "args": [
        {
          "name": "allowedSenders";
          "type": {
            "option": {
              "vec": "bytes";
            };
          };
        },
        {
          "name": "admin";
          "type": "pubkey";
        },
      ];
    },
    {
      "name": "noop";
      "docs": [
        "A dirty fix to make anchor add `CrossChainMessage` to IDL. It does't seem",
        "to register it when there are no public instructions that use the account",
        "in their context.",
      ];
      "discriminator": [
        9,
        178,
        13,
        115,
        129,
        35,
        237,
        102,
      ];
      "accounts": [
        {
          "name": "message";
        },
      ];
      "args": [];
    },
    {
      "name": "registerExtension";
      "docs": [
        "Registers the UIP messenger extension with the specified IPFS CID.",
      ];
      "discriminator": [
        158,
        205,
        4,
        17,
        6,
        106,
        172,
        148,
      ];
      "accounts": [
        {
          "name": "messenger";
        },
        {
          "name": "extension";
          "writable": true;
        },
        {
          "name": "programSigner";
          "pda": {
            "seeds": [
              {
                "kind": "const";
                "value": [
                  85,
                  73,
                  80,
                  95,
                  83,
                  73,
                  71,
                  78,
                  69,
                  82,
                ];
              },
            ];
          };
        },
        {
          "name": "admin";
          "signer": true;
        },
        {
          "name": "payer";
          "writable": true;
          "signer": true;
        },
        {
          "name": "uipProgram";
          "address": "uipby67GWuDDt1jZTWFdXNrsSu83kcxt9r5CLPTKGhX";
        },
        {
          "name": "systemProgram";
          "address": "11111111111111111111111111111111";
        },
      ];
      "args": [
        {
          "name": "ipfsCid";
          "type": {
            "array": [
              "u8",
              36,
            ];
          };
        },
      ];
    },
    {
      "name": "sendMessage";
      "docs": [
        "Sends a cross-chain message to a specified destination, paying the",
        "specified `uip_fee`.",
      ];
      "discriminator": [
        57,
        40,
        34,
        178,
        189,
        10,
        65,
        26,
      ];
      "accounts": [
        {
          "name": "sender";
          "writable": true;
          "signer": true;
        },
        {
          "name": "endpointConfig";
        },
        {
          "name": "utsConnector";
          "writable": true;
        },
        {
          "name": "programSigner";
          "pda": {
            "seeds": [
              {
                "kind": "const";
                "value": [
                  85,
                  73,
                  80,
                  95,
                  83,
                  73,
                  71,
                  78,
                  69,
                  82,
                ];
              },
            ];
          };
        },
        {
          "name": "systemProgram";
          "address": "11111111111111111111111111111111";
        },
        {
          "name": "uipProgram";
          "address": "uipby67GWuDDt1jZTWFdXNrsSu83kcxt9r5CLPTKGhX";
        },
      ];
      "args": [
        {
          "name": "destination";
          "type": {
            "defined": {
              "name": "destination";
            };
          };
        },
        {
          "name": "uipFee";
          "type": "u64";
        },
        {
          "name": "customGasLimit";
          "type": "u128";
        },
        {
          "name": "text";
          "type": "string";
        },
      ];
    },
    {
      "name": "setAllowedSenders";
      "docs": [
        "Set the list of senders whose messages can be received.",
      ];
      "discriminator": [
        246,
        71,
        11,
        140,
        2,
        46,
        69,
        126,
      ];
      "accounts": [
        {
          "name": "messenger";
          "writable": true;
          "pda": {
            "seeds": [
              {
                "kind": "const";
                "value": [
                  77,
                  69,
                  83,
                  83,
                  69,
                  78,
                  71,
                  69,
                  82,
                ];
              },
            ];
          };
        },
        {
          "name": "payer";
          "writable": true;
          "signer": true;
        },
        {
          "name": "admin";
          "signer": true;
          "relations": [
            "messenger",
          ];
        },
        {
          "name": "systemProgram";
          "address": "11111111111111111111111111111111";
        },
      ];
      "args": [
        {
          "name": "allowedSenders";
          "type": {
            "option": {
              "vec": "bytes";
            };
          };
        },
      ];
    },
    {
      "name": "updateAdmin";
      "docs": [
        "Update the messenger admin.",
      ];
      "discriminator": [
        117,
        112,
        100,
        95,
        97,
        100,
        109,
        110,
      ];
      "accounts": [
        {
          "name": "messenger";
          "writable": true;
        },
        {
          "name": "admin";
          "signer": true;
          "relations": [
            "messenger",
          ];
        },
      ];
      "args": [
        {
          "name": "newAdmin";
          "type": "pubkey";
        },
      ];
    },
  ];
  "accounts": [
    {
      "name": "crossChainMessage";
      "discriminator": [
        13,
        175,
        177,
        236,
        30,
        82,
        224,
        162,
      ];
    },
    {
      "name": "messenger";
      "discriminator": [
        205,
        224,
        95,
        59,
        70,
        64,
        188,
        58,
      ];
    },
  ];
  "errors": [
    {
      "code": 6000;
      "name": "invalidSignature";
      "msg": "Provided signature is invalid";
    },
    {
      "code": 6001;
      "name": "senderNotAllowed";
      "msg": "Sender is not allowed";
    },
    {
      "code": 6002;
      "name": "senderSmartContractNotAllowed";
      "msg": "Sender smart contract is not allowed";
    },
    {
      "code": 6003;
      "name": "destinationSmartContractNotAllowed";
      "msg": "Destination smart contract is not allowed";
    },
  ];
  "types": [
    {
      "name": "crossChainMessage";
      "docs": [
        "A received message.",
      ];
      "type": {
        "kind": "struct";
        "fields": [
          {
            "name": "messageId";
            "docs": [
              "Identifier of the message (corresponds to the total number of messages",
              "received before the message).",
            ];
            "type": "u64";
          },
          {
            "name": "messageTimestamp";
            "docs": [
              "Unix timestamp for when the message was received.",
            ];
            "type": "i64";
          },
          {
            "name": "sourceChain";
            "docs": [
              "Identifier for the chain from where the message was sent.",
            ];
            "type": "u128";
          },
          {
            "name": "senderAddr";
            "docs": [
              "Sender wallet address.",
            ];
            "type": "bytes";
          },
          {
            "name": "text";
            "docs": [
              "The text of the message.",
            ];
            "type": "string";
          },
        ];
      };
    },
    {
      "name": "destination";
      "docs": [
        "Different destination chains for sending messages.",
      ];
      "type": {
        "kind": "enum";
        "variants": [
          {
            "name": "solanaMainnet";
          },
          {
            "name": "solanaDevnet";
          },
          {
            "name": "ethereumSepolia";
          },
          {
            "name": "polygonAmoy";
          },
          {
            "name": "mantleSepolia";
          },
          {
            "name": "teib";
          },
          {
            "name": "baseSepolia";
          },
          {
            "name": "sonicBlazeTestnet";
          },
          {
            "name": "avalancheFuji";
          },
          {
            "name": "ethereum";
          },
          {
            "name": "sonic";
          },
          {
            "name": "avalanche";
          },
          {
            "name": "eib";
          },
          {
            "name": "polygon";
          },
          {
            "name": "mantaPacific";
          },
          {
            "name": "abstract";
          },
          {
            "name": "berachain";
          },
          {
            "name": "mantle";
          },
          {
            "name": "bsc";
          },
          {
            "name": "immutable";
          },
        ];
      };
    },
    {
      "name": "messenger";
      "docs": [
        "The base structure for message configuration and statistics.",
      ];
      "type": {
        "kind": "struct";
        "fields": [
          {
            "name": "admin";
            "docs": [
              "Messenger administrator, allowed to update `allowed_senders`.",
            ];
            "type": "pubkey";
          },
          {
            "name": "receivedMessageCount";
            "docs": [
              "Total number of messages received.",
            ];
            "type": "u64";
          },
          {
            "name": "allowedSenders";
            "docs": [
              "The addresses of sender wallets, whose messages can be received.",
              "If `None`, any sender is allowed.",
            ];
            "type": {
              "option": {
                "vec": "bytes";
              };
            };
          },
        ];
      };
    },
  ];
};
