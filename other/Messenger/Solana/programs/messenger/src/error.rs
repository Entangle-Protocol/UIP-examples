//! Messenger error codes.

use anchor_lang::prelude::*;

/// Messenger error code.
#[error_code]
pub enum MessengerError {
    /// 6000 0x1770
    #[msg("Provided signature is invalid")]
    InvalidSignature,

    /// 6001 0x1771
    #[msg("Sender is not allowed")]
    SenderNotAllowed,

    /// 6002 0x1772
    #[msg("Sender smart contract is not allowed")]
    SenderSmartContractNotAllowed,

    /// 6003 0x1773
    #[msg("Destination smart contract is not allowed")]
    DestinationSmartContractNotAllowed,
}
