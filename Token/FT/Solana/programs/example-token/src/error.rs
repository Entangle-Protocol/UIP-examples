use anchor_lang::prelude::*;

/// Example token error code.
#[error_code]
pub enum ExampleTokenError {
    /// 6000 0x1770
    #[msg("Sender smart contract is not allowed")]
    SenderSmartContractNotAllowed,
}
