use solana_program::{instruction::AccountMeta, pubkey::Pubkey, system_program};
use uip_solana_sdk::{deserialize_message_data, MessageDataRef};

#[repr(C)]
pub struct InstructionInfo {
    pub compute_units: u32,
    pub heap_frame: u32,
    pub accounts_len: u32,
    pub accounts: [AccountMeta; 32],
}

/// The interface version supported by the extension.
#[no_mangle]
pub extern "C" fn get_api_version() -> u32 {
    0
}

/// Populates `result` with the required compute units, heap frame and account
/// metadata based on the provided serialized message data.
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
    let msg_data = core::slice::from_raw_parts(msg_data_ptr, msg_data_len);
    let MessageDataRef { msg_hash, .. } = deserialize_message_data(msg_data).unwrap();

    let (messenger_pda, _) =
        Pubkey::find_program_address(&[b"MESSENGER"], &messenger::ID.to_bytes().into());
    result.accounts[0] = AccountMeta::new(messenger_pda, false);
    let (message_pda, _) =
        Pubkey::find_program_address(&[b"MESSAGE", msg_hash], &messenger::ID.to_bytes().into());
    result.accounts[1] = AccountMeta::new(message_pda, false);
    result.accounts[2] = AccountMeta::new_readonly(system_program::ID, false);
    result.accounts_len = 3;
    result.compute_units = 30_000;
    result.heap_frame = 0;
}
