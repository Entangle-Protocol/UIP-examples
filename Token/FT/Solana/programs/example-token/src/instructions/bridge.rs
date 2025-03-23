use crate::{addresses::*, state::*};
use alloy_sol_types::{
    sol_data::{Bytes, Uint},
    SolType,
};
use anchor_lang::prelude::*;
use solana_invoke::invoke;
use spl_token::instruction::burn;
use uip_solana_sdk::{chains::*, Commitment, UipEndpoint};

#[derive(Accounts)]
pub struct Bridge<'info> {
    config: Account<'info, ExampleTokenConfig>,
    #[account(mut)]
    sender: Signer<'info>,
    /// CHECK: checked in CPI
    #[account(mut)]
    token_account: AccountInfo<'info>,
    /// CHECK: it's checked to be the EXA mint
    #[account(mut, seeds = [b"exa_mint"], bump)]
    exa_mint: AccountInfo<'info>,
    /// CHECK: checked in the CPI
    #[account(mut)]
    uts_connector: AccountInfo<'info>,
    /// CHECK: checked in CPI
    #[account(seeds = [b"uip_signer"], bump)]
    program_signer: AccountInfo<'info>,
    /// CHECK: it's checked to be the SPL token program
    #[account(address = spl_token::ID)]
    token_program: AccountInfo<'info>,
    system_program: Program<'info, System>,
    uip_program: Program<'info, UipEndpoint>,
}

/// Different destination chains for sending messages.
#[derive(AnchorSerialize, AnchorDeserialize)]
pub enum Destination {
    SolanaMainnet,
    SolanaDevnet,
    PolygonAmoy,
    MantleSepolia,
    Teib,
}

pub fn bridge(
    ctx: Context<Bridge>,
    destination: Destination,
    to: Vec<u8>,
    amount: u64,
    ccm_fee: u64,
    custom_gas_limit: u128,
) -> Result<()> {
    let sender = &ctx.accounts.sender;
    let token_account = &ctx.accounts.token_account;
    let exa_mint = &ctx.accounts.exa_mint;

    let ix = burn(
        &spl_token::ID,
        token_account.key,
        exa_mint.key,
        sender.key,
        &[],
        amount,
    )?;
    invoke(
        &ix,
        &[
            token_account.to_account_info(),
            exa_mint.to_account_info(),
            sender.to_account_info(),
        ],
    )?;

    let payload = <(Bytes, Bytes, Uint<256>)>::abi_encode_params(&(
        sender.key.to_bytes(),
        to,
        ruint::Uint::<256, 4>::from(amount),
    ));

    let (dest_chain_id, dest_addr) = match destination {
        Destination::SolanaMainnet => (SOLANA_MAINNET_CHAIN_ID, &crate::ID.to_bytes()),
        Destination::SolanaDevnet => (SOLANA_DEVNET_CHAIN_ID, &crate::ID.to_bytes()),
        Destination::PolygonAmoy => (POLYGON_AMOY_CHAIN_ID, &POLYGON_AMOY_ADDRESS),
        Destination::MantleSepolia => (MANTLE_SEPOLIA_CHAIN_ID, &MANTLE_SEPOLIA_ADDRESS),
        Destination::Teib => (TEIB_CHAIN_ID, &TEIB_ADDRESS),
    };

    UipEndpoint::propose()
        .payer(ctx.accounts.sender.to_account_info())
        .uts_connector(ctx.accounts.uts_connector.to_account_info())
        .program_signer(ctx.accounts.program_signer.to_account_info())
        .system_program(ctx.accounts.system_program.to_account_info())
        .program_signer_bump(ctx.bumps.program_signer)
        .sender(&crate::ID)
        .ccm_fee(ccm_fee)
        .dest_chain_id(dest_chain_id)
        .dest_addr(dest_addr)
        .payload(&payload)
        .custom_gas_limit(custom_gas_limit)
        .proposal_commitment(Commitment::Confirmed)
        .call()?;

    Ok(())
}
