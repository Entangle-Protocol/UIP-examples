use crate::{addresses::*, error::*, state::*, utils::find_ata};
use alloy_sol_types::{
    sol_data::{Bytes, Uint},
    SolType,
};
use anchor_lang::prelude::*;
use solana_invoke::{invoke, invoke_signed};
use spl_associated_token_account::instruction::create_associated_token_account;
use spl_token::instruction::mint_to;
use uip_solana_sdk::{chains::*, parse_uip_message, route_instruction, MessageDataRef};

#[derive(Accounts)]
pub struct Execute<'info> {
    /// CHECK: It's checked in `parse_uip_message`.
    uip_msg: AccountInfo<'info>,
}

pub fn execute<'info>(ctx: Context<'_, '_, 'info, 'info, Execute>) -> Result<()> {
    let uip_msg_data = ctx.accounts.uip_msg.try_borrow_data()?;
    let MessageDataRef {
        payload,
        sender_addr,
        src_chain_id,
        ..
    } = parse_uip_message(&ctx.accounts.uip_msg, &uip_msg_data, &crate::ID)?;

    let allowed_origins = [
        (&SOLANA_DEVNET_CHAIN_ID, &crate::ID.to_bytes()[..]),
        (&SOLANA_MAINNET_CHAIN_ID, &crate::ID.to_bytes()[..]),
        (&POLYGON_AMOY_CHAIN_ID, &POLYGON_AMOY_ADDRESS),
        (&MANTLE_SEPOLIA_CHAIN_ID, &MANTLE_SEPOLIA_ADDRESS),
        (&TEIB_CHAIN_ID, &TEIB_ADDRESS),
    ];
    require!(
        allowed_origins.contains(&(&src_chain_id, sender_addr)),
        ExampleTokenError::SenderSmartContractNotAllowed
    );

    msg!("CCM instruction: ReceiveMessage");

    let (from, to, amount) = <(Bytes, Bytes, Uint<256>)>::abi_decode_params(payload, true)
        .map_err(|_| ProgramError::InvalidInstructionData)?;

    let amount = amount
        .try_into()
        .map_err(|_| ProgramError::InvalidInstructionData)?;
    let to: Pubkey = (&to as &[u8])
        .try_into()
        .map_err(|_| ProgramError::InvalidInstructionData)?;

    route_instruction(
        &crate::ID,
        bridge_mint,
        ctx.remaining_accounts,
        (),
        BridgeMintInput { to, amount },
    )?;

    msg!(
        "{} received {} tokens from {}",
        to,
        amount,
        hex::encode(from)
    );

    Ok(())
}

#[derive(Accounts)]
struct BridgeMint<'info> {
    #[account(mut)]
    payer: Signer<'info>,
    #[account(seeds = [b"CONFIG"], bump)]
    config: Account<'info, ExampleTokenConfig>,
    /// CHECK: it's checked to be the EXA mint
    #[account(mut, seeds = [b"EXA_MINT"], bump)]
    exa_mint: AccountInfo<'info>,
    /// CHECK: it's checked to be the `to` ATA
    #[account(mut)]
    token_account: AccountInfo<'info>,
    /// CHECK: it's checked in CPI
    to: AccountInfo<'info>,
    /// CHECK: it's checked to be the SPL token program
    #[account(address = spl_token::ID)]
    token_program: AccountInfo<'info>,
    /// CHECK: it's checked to be the SPL associated token program
    #[account(address = spl_associated_token_account::ID)]
    associated_token_program: AccountInfo<'info>,
    system_program: Program<'info, System>,
}

struct BridgeMintInput {
    to: Pubkey,
    amount: u64,
}

fn bridge_mint(ctx: Context<BridgeMint>, input: BridgeMintInput) -> Result<()> {
    let payer = &ctx.accounts.payer;
    let config = &ctx.accounts.config;
    let exa_mint = &ctx.accounts.exa_mint;
    let token_account = &ctx.accounts.token_account;
    let to = &ctx.accounts.to;

    require!(
        token_account.key() == find_ata(&input.to, exa_mint.key),
        ErrorCode::ConstraintAddress
    );

    if token_account.data_is_empty() {
        let ix = create_associated_token_account(payer.key, to.key, exa_mint.key, &spl_token::ID);
        invoke(
            &ix,
            &[
                payer.to_account_info(),
                token_account.to_account_info(),
                to.to_account_info(),
                exa_mint.to_account_info(),
            ],
        )?;
    }

    let ix = mint_to(
        &spl_token::ID,
        exa_mint.key,
        token_account.key,
        &config.key(),
        &[],
        input.amount,
    )?;
    invoke_signed(
        &ix,
        &[
            exa_mint.to_account_info(),
            token_account.to_account_info(),
            config.to_account_info(),
        ],
        &[&[b"CONFIG", &[ctx.bumps.config]]],
    )?;

    Ok(())
}
