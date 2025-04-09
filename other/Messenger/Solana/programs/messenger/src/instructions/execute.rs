use crate::{addresses::*, error::*, state::*};
use alloy_sol_types::{sol_data, SolType};
use anchor_lang::prelude::*;
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
        msg_hash,
        ..
    } = parse_uip_message(&ctx.accounts.uip_msg, &uip_msg_data, &crate::ID)?;

    #[cfg(not(feature = "mainnet"))]
    let allowed_origins = [
        (&SOLANA_DEVNET_CHAIN_ID, &crate::ID.to_bytes()[..]),
        (&ETHEREUM_SEPOLIA_CHAIN_ID, &ETHEREUM_SEPOLIA_ADDRESS),
        (&POLYGON_AMOY_CHAIN_ID, &POLYGON_AMOY_ADDRESS),
        (&MANTLE_SEPOLIA_CHAIN_ID, &MANTLE_SEPOLIA_ADDRESS),
        (&TEIB_CHAIN_ID, &TEIB_ADDRESS),
        (&SONIC_BLAZE_TESTNET_CHAIN_ID, &SONIC_BLAZE_TESTNET_ADDRESS),
        (&AVALANCHE_FUJI_CHAIN_ID, &AVALANCHE_FUJI_ADDRESS),
    ];
    #[cfg(feature = "mainnet")]
    let allowed_origins = [
        (&SOLANA_MAINNET_CHAIN_ID, &crate::ID.to_bytes()[..]),
        (&ETHEREUM_CHAIN_ID, &ETHEREUM_ADDRESS),
        (&SONIC_MAINNET_CHAIN_ID, &SONIC_ADDRESS),
        (&AVALANCHE_C_CHAIN_CHAIN_ID, &AVALANCHE_C_CHAIN_ADDRESS),
        (&EIB_CHAIN_ID, &EIB_ADDRESS),
        (&POLYGON_CHAIN_ID, &POLYGON_ADDRESS),
        (&MANTA_PACIFIC_CHAIN_ID, &MANTA_PACIFIC_ADDRESS),
        (&ABSTRACT_CHAIN_ID, &ABSTRACT_ADDRESS),
    ];

    require!(
        allowed_origins.contains(&(&src_chain_id, sender_addr)),
        MessengerError::SenderSmartContractNotAllowed
    );

    msg!("CCM instruction: ReceiveMessage");

    let (text, sender) = decode_message(payload)?;

    let ix_data = ReceiveMessageIxData {
        msg_hash: *msg_hash,
        text_len: text.len() as _,
        sender_len: sender.len() as _,
    };
    let input = ReceiveMessageInput {
        text,
        sender,
        src_chain_id,
    };

    route_instruction(
        &crate::ID,
        receive_message,
        ctx.remaining_accounts,
        ix_data,
        input,
    )?;

    Ok(())
}

#[derive(Accounts)]
#[instruction(ix_data: ReceiveMessageIxData)]
struct ReceiveMessage<'info> {
    #[account(mut)]
    payer: Signer<'info>,
    #[account(mut)]
    messenger: Account<'info, Messenger>,
    #[account(
        init,
        space = 8 + CrossChainMessage::space(ix_data.sender_len as _, ix_data.text_len as _),
        payer = payer,
        seeds = [
            &b"MESSAGE"[..],
            &ix_data.msg_hash,
        ],
        bump,
    )]
    message: Account<'info, CrossChainMessage>,
    system_program: Program<'info, System>,
}

/// Data passed for use in the anchor `instruction` attribute.
#[derive(AnchorSerialize, AnchorDeserialize)]
struct ReceiveMessageIxData {
    msg_hash: [u8; 32],
    text_len: u64,
    sender_len: u64,
}

/// Input data for the `receive_message` function.
struct ReceiveMessageInput {
    text: String,
    sender: Vec<u8>,
    src_chain_id: u128,
}

fn receive_message(ctx: Context<ReceiveMessage>, message: ReceiveMessageInput) -> Result<()> {
    let messenger = &mut ctx.accounts.messenger;
    let message_account = &mut ctx.accounts.message;

    if let Some(allowed_senders) = &messenger.allowed_senders {
        require!(
            allowed_senders.contains(&message.sender),
            MessengerError::SenderNotAllowed
        );
    }

    message_account.message_id = messenger.received_message_count;
    message_account.message_timestamp = Clock::get()?.unix_timestamp;
    message_account.source_chain = message.src_chain_id;
    message_account.sender_addr = message.sender;
    message_account.text = message.text;

    messenger.received_message_count += 1;

    Ok(())
}

fn decode_message(payload: &[u8]) -> Result<(String, Vec<u8>)> {
    /// Manual first step of message ABI decoding to save RAM. Equivalent to
    /// `let (text_bytes, sender) = <(Bytes, Bytes)>::abi_decode_params(payload, true)
    ///      .map_err(|_| ProgramError::InvalidInstructionData)?;`
    fn decode_message_step1(payload: &[u8]) -> (&[u8], &[u8]) {
        let text_bytes_len = u64::from_be_bytes(payload[88..96].try_into().unwrap());
        let text_end = 96 + text_bytes_len as usize;
        let text_bytes = &payload[96..text_end];
        let sender_len =
            u64::from_be_bytes(payload[text_end + 24..text_end + 32].try_into().unwrap());
        let sender = &payload[text_end + 32..text_end + 32 + sender_len as usize];
        (text_bytes, sender)
    }

    let (text_bytes, sender) = decode_message_step1(payload);
    let text = sol_data::String::abi_decode(text_bytes, true)
        .map_err(|_| ProgramError::InvalidInstructionData)?;
    let sender = Vec::from(sender);

    Ok((text, sender))
}
