use crate::state::*;
use anchor_lang::{
    prelude::*,
    system_program::{create_account, CreateAccount},
};
use solana_invoke::invoke;
use spl_token::{instruction::initialize_mint2, solana_program::program_pack::Pack};

#[derive(Accounts)]
#[instruction(admin: Pubkey)]
pub struct Initialize<'info> {
    #[account(
        init,
        space = 8 + ExampleTokenConfig::space(),
        payer = payer,
        seeds = [b"CONFIG"],
        bump
    )]
    config: Account<'info, ExampleTokenConfig>,
    /// CHECK: it's derived from the EXA mint seeds
    #[account(mut, seeds = [b"EXA_MINT"], bump)]
    exa_mint: AccountInfo<'info>,
    #[account(mut)]
    payer: Signer<'info>,
    /// CHECK: it's checked to be the SPL token program
    #[account(address = spl_token::ID)]
    token_program: AccountInfo<'info>,
    system_program: Program<'info, System>,
}

pub fn initialize(ctx: Context<Initialize>, admin: Pubkey, decimals: u8) -> Result<()> {
    let config = &mut ctx.accounts.config;
    let exa_mint = &ctx.accounts.exa_mint;
    let payer = &ctx.accounts.payer;
    let system_program = &ctx.accounts.system_program;
    let rent = Rent::get()?;

    config.admin = admin;

    let space = spl_token::state::Mint::LEN;
    let mint_seeds: &[&[&[u8]]] = &[&[b"EXA_MINT", &[ctx.bumps.exa_mint]]];
    let ctx2 = CpiContext::new_with_signer(
        system_program.to_account_info(),
        CreateAccount {
            from: payer.to_account_info(),
            to: exa_mint.to_account_info(),
        },
        mint_seeds,
    );
    create_account(
        ctx2,
        rent.minimum_balance(space),
        space as u64,
        &spl_token::ID,
    )?;

    let ix = initialize_mint2(&spl_token::ID, exa_mint.key, &config.key(), None, decimals)?;
    invoke(&ix, &[exa_mint.to_account_info()])?;

    Ok(())
}
