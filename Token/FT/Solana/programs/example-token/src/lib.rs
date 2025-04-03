//! Example token protocol, utilizing UIP for cross-chain communication.
#![allow(unexpected_cfgs)]

use crate::instructions::*;
use anchor_lang::prelude::*;

mod addresses;
pub mod error;
mod instructions;
pub mod state;
mod utils;

declare_id!("eTokpPEQPZ9Xdt7ZzSoC4pk4bwufdZ6rAEQb3GKchcH");

/// The example token program module.
#[program]
pub mod example_token {
    use super::*;

    /// Initializes the example token bridge contract.
    pub fn initialize(ctx: Context<Initialize>, admin: Pubkey, decimals: u8) -> Result<()> {
        instructions::initialize(ctx, admin, decimals)
    }

    /// Mint tokens.
    pub fn mint(ctx: Context<Mint>, amount: u64) -> Result<()> {
        instructions::mint(ctx, amount)
    }

    /// Registers the UIP example token extension with the specified IPFS CID.
    pub fn register_extension(ctx: Context<RegisterExtension>, ipfs_cid: [u8; 36]) -> Result<()> {
        instructions::register_extension(ctx, ipfs_cid)
    }

    /// Sends tokens to a specified destination, paying the specified `uip_fee`.
    pub fn bridge(
        ctx: Context<Bridge>,
        destination: Destination,
        to: Vec<u8>,
        amount: u64,
        uip_fee: u64,
        custom_gas_limit: u128,
    ) -> Result<()> {
        instructions::bridge(ctx, destination, to, amount, uip_fee, custom_gas_limit)
    }

    /// Executes an incoming cross-chain message.
    #[instruction(discriminator = uip_solana_sdk::EXECUTE_DISCRIMINATOR)]
    pub fn execute<'info>(ctx: Context<'_, '_, 'info, 'info, Execute>) -> Result<()> {
        instructions::execute(ctx)
    }

    /// Update the messenger admin.
    #[instruction(discriminator = b"upd_admn")]
    pub fn update_admin(ctx: Context<UpdateAdmin>, new_admin: Pubkey) -> Result<()> {
        instructions::update_admin(ctx, new_admin)
    }
}
