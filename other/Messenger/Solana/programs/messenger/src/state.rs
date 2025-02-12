//! Messenger account structures.

use anchor_lang::prelude::*;

/// The base structure for message configuration and statistics.
#[account]
#[derive(Debug)]
pub struct Messenger {
    /// Messenger administrator, allowed to update `allowed_senders`.
    pub admin: Pubkey,
    /// Total number of messages received.
    pub received_message_count: u64,
    /// The addresses of sender wallets, whose messages can be received.
    /// If `None`, any sender is allowed.
    pub allowed_senders: Option<Vec<Vec<u8>>>,
}

impl Messenger {
    pub(crate) fn space(allowed_senders: Option<&Vec<Vec<u8>>>) -> usize {
        let space_admin = 32;
        let space_received_message_count = 8;
        let space_allowed_senders = 1 + if let Some(allowed_senders) = allowed_senders {
            4 + allowed_senders.iter().map(|x| 4 + x.len()).sum::<usize>()
        } else {
            0
        };
        space_admin + space_received_message_count + space_allowed_senders
    }
}

/// A received message.
#[account]
#[derive(Debug)]
pub struct CrossChainMessage {
    /// Identifier of the message (corresponds to the total number of messages
    /// received before the message).
    pub message_id: u64,
    /// Unix timestamp for when the message was received.
    pub message_timestamp: i64,
    /// Identifier for the chain from where the message was sent.
    pub source_chain: u128,
    /// Sender wallet address.
    pub sender_addr: Vec<u8>,
    /// The text of the message.
    pub text: String,
}

impl CrossChainMessage {
    pub(crate) fn space(sender_addr_len: usize, text_len: usize) -> usize {
        let space_message_id = 8;
        let space_message_timestamp = 8;
        let space_source_chain = 32;
        let space_sender_addr = 4 + sender_addr_len;
        let space_text = 4 + text_len;
        space_message_id
            + space_message_timestamp
            + space_source_chain
            + space_sender_addr
            + space_text
    }
}
