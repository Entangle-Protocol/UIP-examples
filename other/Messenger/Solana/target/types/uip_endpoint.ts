/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/uip_endpoint.json`.
 */
export type UipEndpoint = {
  "address": "uipby67GWuDDt1jZTWFdXNrsSu83kcxt9r5CLPTKGhX",
  "metadata": {
    "name": "uipEndpoint",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Universal Interoperability Protocol Solana endpoint"
  },
  "docs": [
    "The UIP program module."
  ],
  "instructions": [
    {
      "name": "deregisterSuperTransmitter",
      "docs": [
        "Deregister a super transmitter."
      ],
      "discriminator": [
        100,
        114,
        103,
        95,
        115,
        117,
        112,
        114
      ],
      "accounts": [
        {
          "name": "endpointConfig",
          "writable": true
        },
        {
          "name": "admin",
          "signer": true,
          "relations": [
            "endpointConfig"
          ]
        }
      ],
      "args": [
        {
          "name": "superSigner",
          "type": {
            "array": [
              "u8",
              20
            ]
          }
        }
      ]
    },
    {
      "name": "execute",
      "docs": [
        "The third and final stage of message processing: a CPI to the destination",
        "program (or endpoint configuration). This function ensures that the",
        "`executor` does not spend more than the specified `spending_limit`",
        "in lamports during the execution.",
        "",
        "Note: It only checks native SOL expenditures. Spending of other tokens",
        "(e.g., wrapped SOL) is not tracked, so the executor must not possess any",
        "of those."
      ],
      "discriminator": [
        101,
        120,
        101,
        99,
        117,
        116,
        101,
        0
      ],
      "accounts": [
        {
          "name": "endpointConfig",
          "docs": [
            "Should only be mutable during configuration to make the config colder."
          ]
        },
        {
          "name": "message",
          "writable": true
        },
        {
          "name": "executor",
          "writable": true,
          "signer": true
        },
        {
          "name": "dstProgram"
        }
      ],
      "args": [
        {
          "name": "spendingLimit",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initialize",
      "docs": [
        "Initialize the endpoint configuration."
      ],
      "discriminator": [
        105,
        110,
        105,
        116,
        105,
        97,
        108,
        122
      ],
      "accounts": [
        {
          "name": "endpointConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  69,
                  78,
                  68,
                  80,
                  79,
                  73,
                  78,
                  84,
                  95,
                  67,
                  79,
                  78,
                  70,
                  73,
                  71
                ]
              }
            ]
          }
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "admin",
          "type": "pubkey"
        },
        {
          "name": "targetConsensusRate",
          "type": "u64"
        },
        {
          "name": "targetSuperConsensusRate",
          "type": "u64"
        },
        {
          "name": "allowedSigners",
          "type": {
            "vec": {
              "array": [
                "u8",
                20
              ]
            }
          }
        },
        {
          "name": "allowedSuperSigners",
          "type": {
            "vec": {
              "array": [
                "u8",
                20
              ]
            }
          }
        },
        {
          "name": "allowedExecutors",
          "type": {
            "vec": "pubkey"
          }
        }
      ]
    },
    {
      "name": "loadMessage",
      "docs": [
        "The first stage of the message processing. It creates the account of the",
        "message with the provided `msg_data`.",
        "",
        "Note: if `msg_data` does not fit in a single transaction, it can be called",
        "using the chunk loader program."
      ],
      "discriminator": [
        108,
        111,
        97,
        100,
        95,
        109,
        115,
        103
      ],
      "accounts": [
        {
          "name": "message",
          "writable": true
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "msgData",
          "type": {
            "defined": {
              "name": "messageData"
            }
          }
        }
      ]
    },
    {
      "name": "propose",
      "docs": [
        "Propose a message for execution on another chain."
      ],
      "discriminator": [
        112,
        114,
        111,
        112,
        111,
        115,
        101,
        0
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "utsConnector",
          "writable": true,
          "address": "vAukQz25gyuAHbdzEQS9GxMVZipVFu18MUoayKpETJz"
        },
        {
          "name": "programSigner",
          "docs": [
            "Source program signer."
          ],
          "signer": true,
          "optional": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
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
                  82
                ]
              }
            ],
            "program": {
              "kind": "arg",
              "path": "sender"
            }
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "sender",
          "type": "pubkey"
        },
        {
          "name": "totalFee",
          "type": "u64"
        },
        {
          "name": "destChainId",
          "type": "u128"
        },
        {
          "name": "transmitterParams",
          "type": {
            "defined": {
              "name": "transmitterParams"
            }
          }
        },
        {
          "name": "selectorSlot",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "destAddr",
          "type": "bytes"
        },
        {
          "name": "payload",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "registerExtension",
      "docs": [
        "Register a protocol extension IPFS CID."
      ],
      "discriminator": [
        114,
        101,
        103,
        95,
        101,
        120,
        116,
        110
      ],
      "accounts": [
        {
          "name": "extension",
          "writable": true
        },
        {
          "name": "programSigner",
          "signer": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
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
                  82
                ]
              }
            ],
            "program": {
              "kind": "arg",
              "path": "program"
            }
          }
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "program",
          "type": "pubkey"
        },
        {
          "name": "ipfsCid",
          "type": {
            "array": [
              "u8",
              36
            ]
          }
        }
      ]
    },
    {
      "name": "registerSuperTransmitter",
      "docs": [
        "Register a super transmitter."
      ],
      "discriminator": [
        114,
        101,
        103,
        95,
        115,
        117,
        112,
        114
      ],
      "accounts": [
        {
          "name": "endpointConfig",
          "writable": true
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "admin",
          "signer": true,
          "relations": [
            "endpointConfig"
          ]
        }
      ],
      "args": [
        {
          "name": "superSigner",
          "type": {
            "array": [
              "u8",
              20
            ]
          }
        }
      ]
    },
    {
      "name": "replenish",
      "docs": [
        "Instruct the executors to resend the message in case it failed, paying an",
        "extra amount of lamports specified in `amount`. The `fee` is used to",
        "transfer the system message to EIB."
      ],
      "discriminator": [
        114,
        101,
        115,
        108,
        101,
        110,
        115,
        104
      ],
      "accounts": [
        {
          "name": "proposer",
          "writable": true,
          "signer": true
        },
        {
          "name": "utsConnector",
          "writable": true,
          "address": "vAukQz25gyuAHbdzEQS9GxMVZipVFu18MUoayKpETJz"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "msgHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "fee",
          "type": "u64"
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "resend",
      "docs": [
        "Instruct the executors to resend the message in case it failed. The `fee`",
        "is used to transfer the system message to EIB."
      ],
      "discriminator": [
        114,
        101,
        115,
        101,
        110,
        100,
        0,
        0
      ],
      "accounts": [
        {
          "name": "proposer",
          "writable": true,
          "signer": true
        },
        {
          "name": "utsConnector",
          "writable": true,
          "address": "vAukQz25gyuAHbdzEQS9GxMVZipVFu18MUoayKpETJz"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "msgHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "fee",
          "type": "u64"
        }
      ]
    },
    {
      "name": "signMessage",
      "docs": [
        "The second stage of message processing: collecting and verifying signatures",
        "from executors.",
        "",
        "This function checks if enough valid signatures have been gathered to reach",
        "consensus on the message. If consensus is reached, the message status is",
        "updated accordingly."
      ],
      "discriminator": [
        115,
        105,
        103,
        110,
        95,
        109,
        115,
        103
      ],
      "accounts": [
        {
          "name": "message",
          "writable": true
        },
        {
          "name": "endpointConfig"
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "signatures",
          "type": {
            "vec": {
              "defined": {
                "name": "signatureEcdsa"
              }
            }
          }
        },
        {
          "name": "superSignatures",
          "type": {
            "vec": {
              "defined": {
                "name": "signatureEcdsa"
              }
            }
          }
        }
      ],
      "returns": "bool"
    },
    {
      "name": "simulateExecute",
      "docs": [
        "Simulate an execute operation to evaluate its cost. Cannot be executed",
        "on-chain and only works for `msg_data` that fits in 1 tx."
      ],
      "discriminator": [
        115,
        105,
        109,
        95,
        101,
        120,
        101,
        99
      ],
      "accounts": [
        {
          "name": "message",
          "writable": true,
          "signer": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  73,
                  77,
                  80,
                  79,
                  83,
                  83,
                  73,
                  66,
                  76,
                  69,
                  95,
                  77,
                  69,
                  83,
                  83,
                  65,
                  71,
                  69
                ]
              }
            ]
          }
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "dstProgram"
        }
      ],
      "args": [
        {
          "name": "msgData",
          "type": {
            "defined": {
              "name": "messageData"
            }
          }
        }
      ],
      "returns": "i128"
    },
    {
      "name": "simulateExecuteLite",
      "docs": [
        "Same as [`simulate_execute`], but takes only the strictly necessary msg_data",
        "fields, filling the rest with the default values."
      ],
      "discriminator": [
        115,
        105,
        109,
        95,
        101,
        120,
        95,
        108
      ],
      "accounts": [
        {
          "name": "message",
          "writable": true,
          "signer": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  73,
                  77,
                  80,
                  79,
                  83,
                  83,
                  73,
                  66,
                  76,
                  69,
                  95,
                  77,
                  69,
                  83,
                  83,
                  65,
                  71,
                  69
                ]
              }
            ]
          }
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "dstProgram"
        }
      ],
      "args": [
        {
          "name": "payload",
          "type": "bytes"
        },
        {
          "name": "srcChainId",
          "type": "u128"
        },
        {
          "name": "senderAddr",
          "type": "bytes"
        }
      ],
      "returns": "i128"
    },
    {
      "name": "unloadMessage",
      "docs": [
        "Unload a message to reclaim most of the lamports spent on storing it.",
        "This instruction can only be invoked if the message has been executed",
        "or if the message lifetime has been passed since loading it."
      ],
      "discriminator": [
        117,
        110,
        108,
        111,
        97,
        100,
        95,
        109
      ],
      "accounts": [
        {
          "name": "message",
          "writable": true
        },
        {
          "name": "payer",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "updateTargetSuperConsensusRate",
      "docs": [
        "Update target super consensus rate."
      ],
      "discriminator": [
        117,
        112,
        100,
        95,
        115,
        99,
        110,
        115
      ],
      "accounts": [
        {
          "name": "endpointConfig",
          "writable": true
        },
        {
          "name": "admin",
          "signer": true,
          "relations": [
            "endpointConfig"
          ]
        }
      ],
      "args": [
        {
          "name": "targetSuperConsensusRate",
          "type": "u64"
        }
      ]
    },
    {
      "name": "updateUtsConfig",
      "docs": [
        "Update the UTS config account. Must be called whenever `UTS_CONNECTOR`",
        "address changes."
      ],
      "discriminator": [
        117,
        112,
        100,
        95,
        117,
        116,
        115,
        99
      ],
      "accounts": [
        {
          "name": "utsConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  85,
                  84,
                  83,
                  95,
                  67,
                  79,
                  78,
                  70,
                  73,
                  71
                ]
              }
            ]
          }
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "endpointConfig",
      "discriminator": [
        99,
        111,
        110,
        102,
        105,
        103,
        0,
        0
      ]
    },
    {
      "name": "extension",
      "discriminator": [
        101,
        120,
        116,
        101,
        110,
        115,
        105,
        111
      ]
    },
    {
      "name": "message",
      "discriminator": [
        109,
        101,
        115,
        115,
        97,
        103,
        101,
        0
      ]
    },
    {
      "name": "utsConfig",
      "discriminator": [
        117,
        116,
        115,
        95,
        99,
        111,
        110,
        102
      ]
    }
  ],
  "events": [
    {
      "name": "extensionRegistered",
      "discriminator": [
        101,
        120,
        116,
        110,
        95,
        114,
        101,
        103
      ]
    },
    {
      "name": "messageExecuted",
      "discriminator": [
        101,
        120,
        101,
        99,
        117,
        116,
        101,
        100
      ]
    },
    {
      "name": "messageExecutionStarted",
      "discriminator": [
        101,
        120,
        101,
        99,
        95,
        115,
        116,
        97
      ]
    },
    {
      "name": "messageProposed",
      "discriminator": [
        112,
        114,
        111,
        112,
        111,
        115,
        101,
        100
      ]
    }
  ],
  "errors": [
    {
      "code": 397184000,
      "name": "spendingLimitExceeded",
      "msg": "Spending limit exceeded during execution"
    },
    {
      "code": 397184001,
      "name": "executorBalanceTooLow",
      "msg": "Executor balance is lower than the spending limit"
    },
    {
      "code": 397184002,
      "name": "messageAlreadyUnloaded",
      "msg": "The message is already unloaded"
    },
    {
      "code": 397184003,
      "name": "messagePayerMismatch",
      "msg": "The provided message rent receiver doesn't match message payer"
    },
    {
      "code": 397184004,
      "name": "invalidConsensusTargetRate",
      "msg": "The target consensus rate cannot exceed consensus rate denom"
    },
    {
      "code": 397184005,
      "name": "selectorError",
      "msg": "Invalid selector value"
    },
    {
      "code": 397184006,
      "name": "invalidSignature",
      "msg": "Invalid signature"
    },
    {
      "code": 397184007,
      "name": "msgStateInvalid",
      "msg": "The state of the message is invalid for the operation"
    },
    {
      "code": 397184008,
      "name": "executorIsNotAllowed",
      "msg": "The address is not allowed to be an executor"
    },
    {
      "code": 397184009,
      "name": "messageLifetimeNotOver",
      "msg": "Message lifetime is not over, cannot be closed yet"
    },
    {
      "code": 397184010,
      "name": "invalidExecutor",
      "msg": "The message executor is not allowed"
    },
    {
      "code": 397184011,
      "name": "invalidConfigurationSource",
      "msg": "The message source is invalid for configuration"
    },
    {
      "code": 397184012,
      "name": "messageNotLoaded",
      "msg": "The message is not loaded"
    },
    {
      "code": 397184013,
      "name": "duplicateTransmitter",
      "msg": "A transmitter address is duplicated"
    },
    {
      "code": 397184014,
      "name": "transmitterNotFound",
      "msg": "Transmitter address is not found"
    },
    {
      "code": 397184015,
      "name": "feeTooLow",
      "msg": "Fee is too low"
    },
    {
      "code": 397184016,
      "name": "endpointPaused",
      "msg": "Endpoint is paused"
    }
  ],
  "types": [
    {
      "name": "commitment",
      "docs": [
        "Commitment option, corresponds to EVM `blockFinalizationOption`."
      ],
      "repr": {
        "kind": "rust"
      },
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "confirmed"
          },
          {
            "name": "finalized"
          }
        ]
      }
    },
    {
      "name": "endpointConfig",
      "docs": [
        "The configuration account for the protocol."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "docs": [
              "Administrator public key."
            ],
            "type": "pubkey"
          },
          {
            "name": "targetConsensusRate",
            "docs": [
              "Transmitter consensus rate required for execution."
            ],
            "type": "u64"
          },
          {
            "name": "targetSuperConsensusRate",
            "docs": [
              "Transmitter consensus rate required for execution."
            ],
            "type": "u64"
          },
          {
            "name": "allowedSigners",
            "docs": [
              "Executor addreses that are allowed to sign a message."
            ],
            "type": {
              "vec": {
                "array": [
                  "u8",
                  20
                ]
              }
            }
          },
          {
            "name": "allowedSuperSigners",
            "docs": [
              "Supertransmitter addreses that are allowed to sign a message."
            ],
            "type": {
              "vec": {
                "array": [
                  "u8",
                  20
                ]
              }
            }
          },
          {
            "name": "allowedExecutors",
            "docs": [
              "Addresses that are allowed to execute a message."
            ],
            "type": {
              "vec": "pubkey"
            }
          }
        ]
      }
    },
    {
      "name": "extension",
      "docs": [
        "A protocol extension info."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "program",
            "docs": [
              "Address of the extension protocol."
            ],
            "type": "pubkey"
          },
          {
            "name": "version",
            "docs": [
              "Extension version, incremented each time a new version is published."
            ],
            "type": "u32"
          },
          {
            "name": "ipfsCid",
            "docs": [
              "IPFS content identifier v1 of the uploaded extension WASM file."
            ],
            "type": {
              "array": [
                "u8",
                36
              ]
            }
          }
        ]
      }
    },
    {
      "name": "extensionRegistered",
      "docs": [
        "Emitted when a protocol extension is registered."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "extension",
            "docs": [
              "The extension details."
            ],
            "type": {
              "defined": {
                "name": "extension"
              }
            }
          }
        ]
      }
    },
    {
      "name": "message",
      "docs": [
        "A cross-chain message."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "status",
            "docs": [
              "Current status of the message."
            ],
            "type": {
              "defined": {
                "name": "messageStatus"
              }
            }
          },
          {
            "name": "info",
            "docs": [
              "Detailed message info, can be set `None` after execution to reclaim lamports."
            ],
            "type": {
              "option": {
                "defined": {
                  "name": "messageInfo"
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "messageData",
      "docs": [
        "The core message data that affects the message hash."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "initialProposal",
            "docs": [
              "Proposal details."
            ],
            "type": {
              "defined": {
                "name": "proposal"
              }
            }
          },
          {
            "name": "srcChainData",
            "docs": [
              "Data from the source chain."
            ],
            "type": {
              "defined": {
                "name": "srcChainData"
              }
            }
          }
        ]
      }
    },
    {
      "name": "messageExecuted",
      "docs": [
        "Emitted after a message has been executed."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "msgHash",
            "docs": [
              "Hash of the message."
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "spent",
            "docs": [
              "Amount spent during execution."
            ],
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "messageExecutionStarted",
      "docs": [
        "Emitted when execution of a message begins."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "msgHash",
            "docs": [
              "Hash of the message."
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          }
        ]
      }
    },
    {
      "name": "messageInfo",
      "docs": [
        "Detailed information for a cross-chain message."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "payer",
            "docs": [
              "Payer of the message account (for fund return on unloading)."
            ],
            "type": "pubkey"
          },
          {
            "name": "loadedAt",
            "docs": [
              "Timestamp when the message was loaded."
            ],
            "type": "i64"
          },
          {
            "name": "hash",
            "docs": [
              "Precomputed message hash."
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "msgData",
            "docs": [
              "The data of the message."
            ],
            "type": {
              "defined": {
                "name": "messageData"
              }
            }
          },
          {
            "name": "signers",
            "docs": [
              "List of executors that signed the message."
            ],
            "type": {
              "vec": {
                "array": [
                  "u8",
                  20
                ]
              }
            }
          },
          {
            "name": "superSigners",
            "docs": [
              "List of supertransmitters that signed the message."
            ],
            "type": {
              "vec": {
                "array": [
                  "u8",
                  20
                ]
              }
            }
          }
        ]
      }
    },
    {
      "name": "messageProposed",
      "docs": [
        "Emitted when a new message is proposed for cross-chain execution."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "destChainId",
            "docs": [
              "Destination chain identifier."
            ],
            "type": "u128"
          },
          {
            "name": "totalFee",
            "docs": [
              "Fee for cross-chain communication."
            ],
            "type": "u64"
          },
          {
            "name": "sender",
            "docs": [
              "Sender program address."
            ],
            "type": "pubkey"
          },
          {
            "name": "selectorSlot",
            "docs": [
              "Target function selector slot."
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "destAddr",
            "docs": [
              "Destination address."
            ],
            "type": "bytes"
          },
          {
            "name": "payload",
            "docs": [
              "Message payload."
            ],
            "type": "bytes"
          },
          {
            "name": "reserved",
            "docs": [
              "Reserved for future use."
            ],
            "type": "bytes"
          },
          {
            "name": "transmitterParams",
            "docs": [
              "Parameters for the message transmitter."
            ],
            "type": {
              "defined": {
                "name": "transmitterParams"
              }
            }
          },
          {
            "name": "timestamp",
            "docs": [
              "Unix timestamp when the message was proposed."
            ],
            "type": "i64"
          },
          {
            "name": "payer",
            "docs": [
              "Payer's (proposer's) address."
            ],
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "messageStatus",
      "docs": [
        "Enumerates the statuses of an incoming cross-chain message. This is not the",
        "same as the message status stored on EIB and only reflects the stages during",
        "execution on Solana."
      ],
      "repr": {
        "kind": "rust"
      },
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "init"
          },
          {
            "name": "signed"
          },
          {
            "name": "executed"
          }
        ]
      }
    },
    {
      "name": "proposal",
      "docs": [
        "Message proposal details."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "totalFee",
            "docs": [
              "The fee initially paid for message delivery."
            ],
            "type": "u128"
          },
          {
            "name": "selectorSlot",
            "docs": [
              "The encoded target function selector."
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "senderAddr",
            "docs": [
              "Sender contract address."
            ],
            "type": "bytes"
          },
          {
            "name": "destAddr",
            "docs": [
              "Destination contract address. On Solana, it's always a public key."
            ],
            "type": "pubkey"
          },
          {
            "name": "payload",
            "docs": [
              "The message payload."
            ],
            "type": "bytes"
          },
          {
            "name": "reserved",
            "docs": [
              "Reserved field for future use."
            ],
            "type": "bytes"
          },
          {
            "name": "transmitterParams",
            "docs": [
              "Additional transmitter parameters."
            ],
            "type": "bytes"
          }
        ]
      }
    },
    {
      "name": "signatureEcdsa",
      "docs": [
        "EVM-compatible ECDSA signature."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "v",
            "docs": [
              "Recovery id."
            ],
            "type": "u8"
          },
          {
            "name": "r",
            "docs": [
              "The first 32 bytes of the signature."
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "s",
            "docs": [
              "The second 32 bytes of the signature."
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          }
        ]
      }
    },
    {
      "name": "srcChainData",
      "docs": [
        "Source chain details for a message."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "srcChainId",
            "docs": [
              "Source chain identifier."
            ],
            "type": "u128"
          },
          {
            "name": "srcBlockNumber",
            "docs": [
              "Proposal transaction block number."
            ],
            "type": "u128"
          },
          {
            "name": "srcOpTxId",
            "docs": [
              "Proposal transaction ID."
            ],
            "type": {
              "array": [
                {
                  "array": [
                    "u8",
                    32
                  ]
                },
                2
              ]
            }
          }
        ]
      }
    },
    {
      "name": "transmitterParams",
      "docs": [
        "Parameters for transmitting a message."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposalCommitment",
            "docs": [
              "Indicates if finalization is required before proposal processing."
            ],
            "type": {
              "defined": {
                "name": "commitment"
              }
            }
          },
          {
            "name": "customGasLimit",
            "docs": [
              "EVM execution gas limit."
            ],
            "type": "u128"
          }
        ]
      }
    },
    {
      "name": "utsConfig",
      "docs": [
        "An account to store the UTS connector address. It's meant for protocols to",
        "fetch in case it changes."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "utsConnector",
            "type": "pubkey"
          }
        ]
      }
    }
  ],
  "constants": [
    {
      "name": "consensusRateDenom",
      "type": "u64",
      "value": "10000"
    },
    {
      "name": "minFee",
      "type": "u64",
      "value": "30"
    }
  ]
};
