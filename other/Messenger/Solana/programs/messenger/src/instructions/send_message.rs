use crate::addresses::*;
use alloy_sol_types::{
    sol_data::{self, Bytes},
    SolType,
};
use anchor_lang::prelude::*;
use uip_solana_sdk::{chains::*, Commitment, UipEndpoint};

#[derive(Accounts)]
pub struct SendMessage<'info> {
    #[account(mut)]
    sender: Signer<'info>,
    /// CHECK: checked in the CPI
    #[account(mut)]
    uts_connector: AccountInfo<'info>,
    /// CHECK: checked in CPI
    #[account(seeds = [b"UIP_SIGNER"], bump)]
    program_signer: AccountInfo<'info>,
    system_program: Program<'info, System>,
    uip_program: Program<'info, UipEndpoint>,
}

/// Different destination chains for sending messages.
#[derive(AnchorSerialize, AnchorDeserialize)]
pub enum Destination {
    SolanaMainnet,
    SolanaDevnet,
    EthereumSepolia,
    PolygonAmoy,
    MantleSepolia,
    Teib,
    BaseSepolia,
    SonicBlazeTestnet,
    AvalancheFuji,
    Ethereum,
    Sonic,
}

pub fn send_message(
    ctx: Context<SendMessage>,
    destination: Destination,
    uip_fee: u64,
    custom_gas_limit: u128,
    text: String,
) -> Result<()> {
    let text = sol_data::String::abi_encode(&text);
    let payload = <(Bytes, Bytes)>::abi_encode_params(&(text, ctx.accounts.sender.key()));

    let (dest_chain_id, dest_addr) = match destination {
        Destination::SolanaMainnet => (SOLANA_MAINNET_CHAIN_ID, crate::ID.to_bytes()),
        Destination::SolanaDevnet => (SOLANA_DEVNET_CHAIN_ID, crate::ID.to_bytes()),
        Destination::Ethereum => (ETHEREUM_CHAIN_ID, ETHEREUM_ADDRESS),
        Destination::EthereumSepolia => (ETHEREUM_SEPOLIA_CHAIN_ID, ETHEREUM_SEPOLIA_ADDRESS),
        Destination::PolygonAmoy => (POLYGON_AMOY_CHAIN_ID, POLYGON_AMOY_ADDRESS),
        Destination::MantleSepolia => (MANTLE_SEPOLIA_CHAIN_ID, MANTLE_SEPOLIA_ADDRESS),
        Destination::Teib => (TEIB_CHAIN_ID, TEIB_ADDRESS),
        Destination::BaseSepolia => (BASE_SEPOLIA_CHAIN_ID, BASE_SEPOLIA_ADDRESS),
        Destination::Sonic => (SONIC_MAINNET_CHAIN_ID, SONIC_ADDRESS),
        Destination::SonicBlazeTestnet => {
            (SONIC_BLAZE_TESTNET_CHAIN_ID, SONIC_BLAZE_TESTNET_ADDRESS)
        }
        Destination::AvalancheFuji => (AVALANCHE_FUJI_CHAIN_ID, AVALANCHE_FUJI_ADDRESS),
    };

    UipEndpoint::propose()
        .payer(ctx.accounts.sender.to_account_info())
        .uts_connector(ctx.accounts.uts_connector.to_account_info())
        .program_signer(ctx.accounts.program_signer.to_account_info())
        .system_program(ctx.accounts.system_program.to_account_info())
        .program_signer_bump(ctx.bumps.program_signer)
        .sender(&crate::ID)
        .total_fee(uip_fee)
        .dest_chain_id(dest_chain_id)
        .dest_addr(&dest_addr)
        .payload(&payload)
        .custom_gas_limit(custom_gas_limit)
        .proposal_commitment(Commitment::Confirmed)
        .call()?;

    Ok(())
}
