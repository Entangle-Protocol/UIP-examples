use borsh::BorshDeserialize;
use solana_sdk::{instruction::AccountMeta, pubkey::Pubkey, system_program};
use uip_endpoint::{chains::*, state::MessageData};

#[cfg(not(feature = "devnet"))]
pub(crate) const SOLANA_CHAIN_ID: u128 = SOLANA_MAINNET_CHAIN_ID;
#[cfg(feature = "devnet")]
pub(crate) const SOLANA_CHAIN_ID: u128 = SOLANA_DEVNET_CHAIN_ID;

#[repr(C)]
pub struct InstructionInfo {
    pub compute_units: u32,
    pub accounts_len: u32,
    pub accounts: [AccountMeta; 32],
}

/// Populates `result` with compute units and account metadata based on the
/// provided serialized message data.
///
/// # Safety
///
/// The caller must ensure that `msg_data_ptr` points to a valid array of
/// `msg_data_len` initialized bytes.
#[no_mangle]
pub unsafe extern "C" fn get_instruction_info(
    msg_data_ptr: *const u8,
    msg_data_len: usize,
    result: &mut InstructionInfo,
) {
    let mut msg_data = core::slice::from_raw_parts(msg_data_ptr, msg_data_len);
    let msg_data = MessageData::deserialize(&mut msg_data).unwrap();

    let (messenger_pda, _) =
        Pubkey::find_program_address(&[b"messenger"], &messenger::ID.to_bytes().into());
    result.accounts[0] = AccountMeta::new(messenger_pda, false);
    let (message_pda, _) = Pubkey::find_program_address(
        &[b"message", &msg_data.msg_hash_with_message(SOLANA_CHAIN_ID)],
        &messenger::ID.to_bytes().into(),
    );
    result.accounts[1] = AccountMeta::new(message_pda, false);
    result.accounts[2] = AccountMeta::new_readonly(system_program::ID, false);
    result.accounts_len = 3;
    result.compute_units = 0;
}
