/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/uip_endpoint.json`.
 */
export type UipEndpoint = {
  "address": "pHoEPVJZRCWYaZ2TjHwVWgeee5DnFWGug7vaMbYt4xe",
  "metadata": {
    "name": "uipEndpoint",
    "version": "2.0.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "docs": [
    "The UIP program module."
  ],
  "instructions": [
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
        130,
        221,
        242,
        154,
        13,
        193,
        189,
        29
      ],
      "accounts": [
        {
          "name": "endpointConfig",
          "writable": true
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
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
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
                  101,
                  110,
                  100,
                  112,
                  111,
                  105,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "admin",
          "signer": true
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
          "name": "repeater",
          "type": {
            "array": [
              "u8",
              20
            ]
          }
        },
        {
          "name": "rotator",
          "type": {
            "array": [
              "u8",
              20
            ]
          }
        },
        {
          "name": "targetConsensusRate",
          "type": "u32"
        },
        {
          "name": "totalActiveSigners",
          "type": "u32"
        },
        {
          "name": "messageLifetimeSec",
          "type": "u32"
        },
        {
          "name": "initialSigners",
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
          "name": "initialExecutors",
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
        104,
        102,
        190,
        230,
        104,
        107,
        135,
        171
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
        93,
        253,
        82,
        168,
        118,
        33,
        102,
        90
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "utsVault",
          "writable": true
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
                  117,
                  105,
                  112,
                  95,
                  115,
                  105,
                  103,
                  110,
                  101,
                  114
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
          "name": "ccmFee",
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
        158,
        205,
        4,
        17,
        6,
        106,
        172,
        148
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
                  117,
                  105,
                  112,
                  95,
                  115,
                  105,
                  103,
                  110,
                  101,
                  114
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
      "name": "replenish",
      "docs": [
        "Instruct the executors to resend the message in case it failed, paying an",
        "extra amount of lamports specified in `amount`. The `fee` is used to",
        "transfer the system message to EIB."
      ],
      "discriminator": [
        209,
        195,
        75,
        71,
        204,
        170,
        131,
        55
      ],
      "accounts": [
        {
          "name": "proposer",
          "writable": true,
          "signer": true
        },
        {
          "name": "endpointConfig",
          "writable": true
        },
        {
          "name": "utsVault",
          "writable": true
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
        223,
        178,
        20,
        217,
        127,
        238,
        74,
        207
      ],
      "accounts": [
        {
          "name": "proposer",
          "writable": true,
          "signer": true
        },
        {
          "name": "endpointConfig"
        },
        {
          "name": "utsVault",
          "writable": true
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
        186,
        152,
        52,
        68,
        241,
        170,
        59,
        135
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
        17,
        186,
        90,
        212,
        31,
        13,
        0,
        71
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
                  105,
                  109,
                  112,
                  111,
                  115,
                  115,
                  105,
                  98,
                  108,
                  101,
                  95,
                  109,
                  101,
                  115,
                  115,
                  97,
                  103,
                  101
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
        132,
        72,
        97,
        160,
        53,
        175,
        209,
        49
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
                  105,
                  109,
                  112,
                  111,
                  115,
                  115,
                  105,
                  98,
                  108,
                  101,
                  95,
                  109,
                  101,
                  115,
                  115,
                  97,
                  103,
                  101
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
        168,
        231,
        17,
        124,
        180,
        115,
        22,
        125
      ],
      "accounts": [
        {
          "name": "endpointConfig"
        },
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
    }
  ],
  "accounts": [
    {
      "name": "endpointConfig",
      "discriminator": [
        171,
        84,
        2,
        168,
        152,
        151,
        133,
        235
      ]
    },
    {
      "name": "extension",
      "discriminator": [
        141,
        183,
        126,
        42,
        23,
        237,
        11,
        5
      ]
    },
    {
      "name": "message",
      "discriminator": [
        110,
        151,
        23,
        110,
        198,
        6,
        125,
        181
      ]
    }
  ],
  "events": [
    {
      "name": "consensusReached",
      "discriminator": [
        240,
        211,
        75,
        133,
        165,
        96,
        113,
        26
      ]
    },
    {
      "name": "extensionRegistered",
      "discriminator": [
        219,
        157,
        97,
        76,
        11,
        64,
        68,
        1
      ]
    },
    {
      "name": "messageExecuted",
      "discriminator": [
        214,
        203,
        124,
        241,
        94,
        227,
        41,
        59
      ]
    },
    {
      "name": "messageExecutionStarted",
      "discriminator": [
        29,
        226,
        165,
        23,
        26,
        122,
        90,
        25
      ]
    },
    {
      "name": "messageProposed",
      "discriminator": [
        76,
        212,
        2,
        231,
        8,
        229,
        92,
        222
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
            "name": "finalized"
          },
          {
            "name": "confirmed"
          }
        ]
      }
    },
    {
      "name": "consensusReached",
      "docs": [
        "Emitted when consensus is reached on an incoming."
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
              "Administrator address."
            ],
            "type": "pubkey"
          },
          {
            "name": "repeater",
            "docs": [
              "Repeater contract address."
            ],
            "type": {
              "array": [
                "u8",
                20
              ]
            }
          },
          {
            "name": "rotator",
            "docs": [
              "Rotator contract address."
            ],
            "type": {
              "array": [
                "u8",
                20
              ]
            }
          },
          {
            "name": "targetConsensusRate",
            "docs": [
              "Transmitter consensus rate required for execution."
            ],
            "type": "u32"
          },
          {
            "name": "totalActiveSigners",
            "docs": [
              "Total number of currently active signers, used for consensus calculation."
            ],
            "type": "u32"
          },
          {
            "name": "messageLifetimeSec",
            "docs": [
              "The period after which a message that wasn't executed can be closed to",
              "reclaim lamports (in seconds)."
            ],
            "type": "u32"
          },
          {
            "name": "signers",
            "docs": [
              "Signer addresses (allowed to sign a message)."
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
            "name": "executors",
            "docs": [
              "Executor addresses (allowed to execute a message)."
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
            "name": "loadedAt",
            "docs": [
              "Timestamp when the message was loaded."
            ],
            "type": "i64"
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
              "List of signers that signed the message."
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
            "name": "ccmFee",
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
            "name": "ccmFee",
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
    }
  ],
  "constants": [
    {
      "name": "consensusRateDenom",
      "type": "u64",
      "value": "10000"
    }
  ]
};
