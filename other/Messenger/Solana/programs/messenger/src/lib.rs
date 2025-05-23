//! Messenger protocol, utilizing UIP for cross-chain communication.
#![allow(unexpected_cfgs)]

use crate::instructions::*;
use anchor_lang::prelude::*;

mod addresses;
pub mod error;
mod instructions;
pub mod state;

declare_id!("MeskEHG9jyVQGrZsNSYTLzxH9waE6UjrWEsviCQn2E1");

#[cfg(not(feature = "no-entrypoint"))]
solana_security_txt::security_txt! {
    name: "Messenger",
    project_url: "https://github.com/Entangle-Protocol/UIP-examples",
    contacts: "email:lincot@disroot.org,discord:lincot",
    policy: "Please contact us if you have discovered a bug"
}

/// The messenger program module.
#[program]
pub mod messenger {
    use super::*;

    /// Initializes the messenger with an admin and optionally a list of allowed
    /// senders.
    pub fn initialize(
        ctx: Context<Initialize>,
        allowed_senders: Option<Vec<Vec<u8>>>,
        admin: Pubkey,
    ) -> Result<()> {
        instructions::initialize(ctx, allowed_senders, admin)
    }

    /// Registers the UIP messenger extension with the specified IPFS CID.
    pub fn register_extension(ctx: Context<RegisterExtension>, ipfs_cid: [u8; 36]) -> Result<()> {
        instructions::register_extension(ctx, ipfs_cid)
    }

    /// Sends a cross-chain message to a specified destination, paying the
    /// specified `uip_fee`.
    pub fn send_message(
        ctx: Context<SendMessage>,
        destination: Destination,
        uip_fee: u64,
        custom_gas_limit: u128,
        text: String,
    ) -> Result<()> {
        instructions::send_message(ctx, destination, uip_fee, custom_gas_limit, text)
    }

    /// Executes an incoming cross-chain message, saving the received message in
    /// a `CrossChainMessage` account.
    #[instruction(discriminator = uip_solana_sdk::EXECUTE_DISCRIMINATOR)]
    pub fn execute<'info>(ctx: Context<'_, '_, 'info, 'info, Execute>) -> Result<()> {
        instructions::execute(ctx)
    }

    /// Update the messenger admin.
    #[instruction(discriminator = b"upd_admn")]
    pub fn update_admin(ctx: Context<UpdateAdmin>, new_admin: Pubkey) -> Result<()> {
        instructions::update_admin(ctx, new_admin)
    }

    /// Set the list of senders whose messages can be received.
    pub fn set_allowed_senders(
        ctx: Context<SetAllowedSenders>,
        allowed_senders: Option<Vec<Vec<u8>>>,
    ) -> Result<()> {
        instructions::set_allowed_senders(ctx, allowed_senders)
    }

    /// A dirty fix to make anchor add `CrossChainMessage` to IDL. It does't seem
    /// to register it when there are no public instructions that use the account
    /// in their context.
    pub fn noop(ctx: Context<Noop>) -> Result<()> {
        instructions::noop(ctx)
    }
}
