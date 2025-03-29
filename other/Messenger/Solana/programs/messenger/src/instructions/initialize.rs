use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(allowed_senders: Option<Vec<Vec<u8>>>)]
pub struct Initialize<'info> {
    #[account(
        init,
        space = 8 + Messenger::space(allowed_senders.as_ref()),
        payer = payer,
        seeds = [b"MESSENGER"],
        bump
    )]
    messenger: Account<'info, Messenger>,
    #[account(mut)]
    payer: Signer<'info>,
    system_program: Program<'info, System>,
}

pub fn initialize(
    ctx: Context<Initialize>,
    allowed_senders: Option<Vec<Vec<u8>>>,
    admin: Pubkey,
) -> Result<()> {
    let messenger = &mut ctx.accounts.messenger;

    messenger.admin = admin;
    messenger.allowed_senders = allowed_senders;

    Ok(())
}
