use crate::state::*;
use anchor_lang::prelude::*;
use solana_invoke::invoke_signed;
use spl_token::instruction::mint_to;

#[derive(Accounts)]
pub struct Mint<'info> {
    #[account(seeds = [b"CONFIG"], bump)]
    config: Account<'info, ExampleTokenConfig>,
    #[account(address = config.admin)]
    admin: Signer<'info>,
    /// CHECK: it's derived from the EXA mint seeds
    #[account(mut, seeds = [b"EXA_MINT"], bump)]
    exa_mint: AccountInfo<'info>,
    /// CHECK: checked in CPI
    #[account(mut)]
    destination_ata: AccountInfo<'info>,
    /// CHECK: it's checked to be the SPL token program
    #[account(address = spl_token::ID)]
    token_program: AccountInfo<'info>,
}

pub fn mint(ctx: Context<Mint>, amount: u64) -> Result<()> {
    let config = &mut ctx.accounts.config;
    let exa_mint = &ctx.accounts.exa_mint;
    let destination_ata = &ctx.accounts.destination_ata;

    let ix = mint_to(
        &spl_token::ID,
        exa_mint.key,
        destination_ata.key,
        &config.key(),
        &[],
        amount,
    )?;
    invoke_signed(
        &ix,
        &[
            exa_mint.to_account_info(),
            destination_ata.to_account_info(),
            config.to_account_info(),
        ],
        &[&[b"CONFIG", &[ctx.bumps.config]]],
    )?;

    Ok(())
}
