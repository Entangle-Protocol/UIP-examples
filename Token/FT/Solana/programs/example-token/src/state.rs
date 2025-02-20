//! Example token account structures.

use anchor_lang::prelude::*;

/// The smart contract configuration.
#[account]
#[derive(Debug)]
pub struct ExampleTokenConfig {
    /// Administrator key that can be used to register the UIP extension.
    pub admin: Pubkey,
}

impl ExampleTokenConfig {
    pub(crate) fn space() -> usize {
        32
    }
}
