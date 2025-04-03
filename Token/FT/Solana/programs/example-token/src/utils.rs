use anchor_lang::prelude::*;

pub fn find_ata(wallet_address: &Pubkey, token_mint_address: &Pubkey) -> Pubkey {
    const ASSOCIATED_TOKEN_PROGRAM_ID: Pubkey =
        pubkey!("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
    const TOKEN_PROGRAM_ID: Pubkey = pubkey!("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

    Pubkey::find_program_address(
        &[
            &wallet_address.to_bytes(),
            &TOKEN_PROGRAM_ID.to_bytes(),
            &token_mint_address.to_bytes(),
        ],
        &ASSOCIATED_TOKEN_PROGRAM_ID,
    )
    .0
}
