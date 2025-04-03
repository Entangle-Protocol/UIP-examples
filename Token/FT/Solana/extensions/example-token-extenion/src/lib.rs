use alloy_sol_types::{
    sol_data::{Bytes, Uint},
    SolType,
};
use solana_program::{instruction::AccountMeta, pubkey, pubkey::Pubkey, system_program};
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
    let MessageDataRef { payload, .. } = deserialize_message_data(msg_data).unwrap();

    let (_, to, _) = <(Bytes, Bytes, Uint<256>)>::abi_decode_params(payload, true).unwrap();

    let to = (&to as &[u8]).try_into().unwrap();

    let (config_pda, _) =
        Pubkey::find_program_address(&[b"CONFIG"], &example_token::ID.to_bytes().into());
    result.accounts[0] = AccountMeta::new_readonly(config_pda, false);

    let (mint_pda, _) =
        Pubkey::find_program_address(&[b"EXA_MINT"], &example_token::ID.to_bytes().into());
    result.accounts[1] = AccountMeta::new(mint_pda, false);
    result.accounts[2] = AccountMeta::new(find_ata(&to, &mint_pda), false);
    result.accounts[3] = AccountMeta::new_readonly(to, false);
    result.accounts[4] = AccountMeta::new_readonly(TOKEN_PROGRAM_ID, false);
    result.accounts[5] = AccountMeta::new_readonly(ASSOCIATED_TOKEN_PROGRAM_ID, false);
    result.accounts[6] = AccountMeta::new_readonly(system_program::ID, false);

    result.accounts_len = 7;
    result.compute_units = 30_000;
    result.heap_frame = 0;
}

const TOKEN_PROGRAM_ID: Pubkey = pubkey!("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const ASSOCIATED_TOKEN_PROGRAM_ID: Pubkey = pubkey!("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

fn find_ata(wallet_address: &Pubkey, token_mint_address: &Pubkey) -> Pubkey {
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
