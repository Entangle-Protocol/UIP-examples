use crate::state::*;
use anchor_lang::prelude::*;
use uip_solana_sdk::UipEndpoint;

#[derive(Accounts)]
pub struct RegisterExtension<'info> {
    config: Account<'info, ExampleTokenConfig>,
    /// CHECK: checked in CPI
    #[account(mut)]
    extension: AccountInfo<'info>,
    /// CHECK: checked in CPI
    #[account(seeds = [b"UIP_SIGNER"], bump)]
    program_signer: AccountInfo<'info>,
    #[account(address = config.admin)]
    admin: Signer<'info>,
    #[account(mut)]
    payer: Signer<'info>,
    uip_program: Program<'info, UipEndpoint>,
    system_program: Program<'info, System>,
}

pub fn register_extension(ctx: Context<RegisterExtension>, ipfs_cid: [u8; 36]) -> Result<()> {
    UipEndpoint::register_extension()
        .extension(ctx.accounts.extension.to_account_info())
        .program_signer(ctx.accounts.program_signer.to_account_info())
        .payer(ctx.accounts.payer.to_account_info())
        .system_program(ctx.accounts.system_program.to_account_info())
        .program_signer_bump(ctx.bumps.program_signer)
        .program_id(&crate::ID)
        .ipfs_cid(ipfs_cid)
        .call()?;

    Ok(())
}
