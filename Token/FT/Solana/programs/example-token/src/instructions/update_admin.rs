use anchor_lang::prelude::*;

use crate::state::*;

#[derive(Accounts)]
pub struct UpdateAdmin<'info> {
    #[account(mut, has_one = admin)]
    config: Account<'info, ExampleTokenConfig>,
    admin: Signer<'info>,
}

pub fn update_admin(ctx: Context<UpdateAdmin>, new_admin: Pubkey) -> Result<()> {
    let config = &mut ctx.accounts.config;

    config.admin = new_admin;

    Ok(())
}
