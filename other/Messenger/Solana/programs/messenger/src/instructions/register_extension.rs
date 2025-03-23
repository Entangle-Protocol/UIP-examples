use crate::state::*;
use anchor_lang::prelude::*;
use uip_solana_sdk::{cpi::RegisterExtensionInput, UipEndpoint};

#[derive(Accounts)]
pub struct RegisterExtension<'info> {
    messenger: Account<'info, Messenger>,
    /// CHECK: checked in CPI
    #[account(mut)]
    extension: AccountInfo<'info>,
    /// CHECK: checked in CPI
    #[account(seeds = [b"uip_signer"], bump)]
    program_signer: AccountInfo<'info>,
    #[account(address = messenger.admin)]
    admin: Signer<'info>,
    #[account(mut)]
    payer: Signer<'info>,
    uip_program: Program<'info, UipEndpoint>,
    system_program: Program<'info, System>,
}

pub fn register_extension(ctx: Context<RegisterExtension>, ipfs_cid: [u8; 36]) -> Result<()> {
    uip_solana_sdk::cpi::register_extension(RegisterExtensionInput {
        extension: ctx.accounts.extension.to_account_info(),
        program_signer: ctx.accounts.program_signer.to_account_info(),
        payer: ctx.accounts.payer.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
        program_signer_bump: ctx.bumps.program_signer,
        program_id: &crate::ID,
        ipfs_cid,
    })?;

    Ok(())
}
