use anchor_lang::prelude::*;

use crate::state::*;

#[derive(Accounts)]
pub struct UpdateAdmin<'info> {
    #[account(mut, has_one = admin)]
    messenger: Account<'info, Messenger>,
    admin: Signer<'info>,
}

pub fn update_admin(ctx: Context<UpdateAdmin>, new_admin: Pubkey) -> Result<()> {
    let messenger = &mut ctx.accounts.messenger;

    messenger.admin = new_admin;

    Ok(())
}
