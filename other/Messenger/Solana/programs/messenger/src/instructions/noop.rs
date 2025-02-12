use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Noop<'info> {
    message: Account<'info, CrossChainMessage>,
}

/// A dirty fix to make anchor add `CrossChainMessage` to IDL. It does't seem
/// to register it when there are no public instructions that use the account
/// in their context.
pub fn noop(_ctx: Context<Noop>) -> Result<()> {
    Ok(())
}
