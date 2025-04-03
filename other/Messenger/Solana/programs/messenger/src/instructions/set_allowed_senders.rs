use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(allowed_senders: Option<Vec<Vec<u8>>>)]
pub struct SetAllowedSenders<'info> {
    #[account(
        mut,
        realloc = 8 + Messenger::space(allowed_senders.as_ref()),
        realloc::zero = false,
        realloc::payer = payer,
        seeds = [b"MESSENGER"],
        bump,
        has_one = admin,
    )]
    messenger: Account<'info, Messenger>,
    #[account(mut)]
    payer: Signer<'info>,
    admin: Signer<'info>,
    system_program: Program<'info, System>,
}

/// Updates the list of allowed senders on the messenger.
pub fn set_allowed_senders(
    ctx: Context<SetAllowedSenders>,
    allowed_senders: Option<Vec<Vec<u8>>>,
) -> Result<()> {
    let messenger = &mut ctx.accounts.messenger;

    messenger.allowed_senders = allowed_senders;

    Ok(())
}
