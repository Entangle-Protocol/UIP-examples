use crate::{addresses::*, error::*};
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
    endpoint_config: AccountInfo<'info>,
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
    Avalanche,
    Eib,
    Polygon,
    MantaPacific,
    Abstract,
    Berachain,
    Mantle,
    Bsc,
    Immutable,
    Optimism,
    Base,
    Arbitrum,
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

    match destination {
        Destination::SolanaMainnet
        | Destination::Ethereum
        | Destination::Sonic
        | Destination::Avalanche
        | Destination::Eib
        | Destination::Polygon
        | Destination::MantaPacific
        | Destination::Abstract
        | Destination::Berachain
        | Destination::Mantle
        | Destination::Bsc
        | Destination::Immutable
        | Destination::Optimism
        | Destination::Arbitrum
        | Destination::Base => {
            #[cfg(not(feature = "mainnet"))]
            return err!(MessengerError::DestinationSmartContractNotAllowed);
        }
        Destination::SolanaDevnet
        | Destination::EthereumSepolia
        | Destination::PolygonAmoy
        | Destination::MantleSepolia
        | Destination::Teib
        | Destination::BaseSepolia
        | Destination::SonicBlazeTestnet
        | Destination::AvalancheFuji => {
            #[cfg(feature = "mainnet")]
            return err!(MessengerError::DestinationSmartContractNotAllowed);
        }
    }

    let (dest_chain_id, dest_addr) = match destination {
        Destination::SolanaMainnet => (SOLANA_MAINNET_CHAIN_ID, crate::ID.to_bytes()),
        Destination::SolanaDevnet => (SOLANA_DEVNET_CHAIN_ID, crate::ID.to_bytes()),
        Destination::Ethereum => (ETHEREUM_CHAIN_ID, ETHEREUM_ADDRESS),
        Destination::EthereumSepolia => (ETHEREUM_SEPOLIA_CHAIN_ID, ETHEREUM_SEPOLIA_ADDRESS),
        Destination::Polygon => (POLYGON_CHAIN_ID, POLYGON_ADDRESS),
        Destination::PolygonAmoy => (POLYGON_AMOY_CHAIN_ID, POLYGON_AMOY_ADDRESS),
        Destination::Mantle => (MANTLE_CHAIN_ID, MANTLE_ADDRESS),
        Destination::MantleSepolia => (MANTLE_SEPOLIA_CHAIN_ID, MANTLE_SEPOLIA_ADDRESS),
        Destination::Eib => (EIB_CHAIN_ID, EIB_ADDRESS),
        Destination::Teib => (TEIB_CHAIN_ID, TEIB_ADDRESS),
        Destination::Base => (BASE_CHAIN_ID, BASE_ADDRESS),
        Destination::BaseSepolia => (BASE_SEPOLIA_CHAIN_ID, BASE_SEPOLIA_ADDRESS),
        Destination::Sonic => (SONIC_MAINNET_CHAIN_ID, SONIC_ADDRESS),
        Destination::SonicBlazeTestnet => {
            (SONIC_BLAZE_TESTNET_CHAIN_ID, SONIC_BLAZE_TESTNET_ADDRESS)
        }
        Destination::Avalanche => (AVALANCHE_C_CHAIN_CHAIN_ID, AVALANCHE_C_CHAIN_ADDRESS),
        Destination::AvalancheFuji => (AVALANCHE_FUJI_CHAIN_ID, AVALANCHE_FUJI_ADDRESS),
        Destination::MantaPacific => (MANTA_PACIFIC_CHAIN_ID, MANTA_PACIFIC_ADDRESS),
        Destination::Abstract => (ABSTRACT_CHAIN_ID, ABSTRACT_ADDRESS),
        Destination::Berachain => (BERACHAIN_CHAIN_ID, BERACHAIN_ADDRESS),
        Destination::Bsc => (BSC_CHAIN_ID, BSC_ADDRESS),
        Destination::Immutable => (IMMUTABLE_CHAIN_ID, IMMUTABLE_ADDRESS),
        Destination::Optimism => (OPTIMISM_CHAIN_ID, OPTIMISM_ADDRESS),
        Destination::Arbitrum => (ARBITRUM_ONE_CHAIN_ID, ARBITRUM_ADDRESS),
    };

    UipEndpoint::propose()
        .payer(ctx.accounts.sender.to_account_info())
        .endpoint_config(ctx.accounts.endpoint_config.to_account_info())
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
