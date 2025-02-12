use crate::state::*;
use anchor_lang::prelude::*;
use uip_endpoint::program::UipEndpoint;

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
    uip_endpoint::cpi::register_extension(
        CpiContext::new_with_signer(
            ctx.accounts.uip_program.to_account_info(),
            uip_endpoint::cpi::accounts::RegisterExtension {
                extension: ctx.accounts.extension.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                program_signer: ctx.accounts.program_signer.to_account_info(),
                payer: ctx.accounts.payer.to_account_info(),
            },
            &[&[b"uip_signer", &[ctx.bumps.program_signer]]],
        ),
        crate::ID,
        ipfs_cid,
    )
}
