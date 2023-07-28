#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[openbrush::implementation(PSP34)]
#[openbrush::contract]
pub mod explora_token {
    use ink::prelude::string::String;
    use openbrush::traits::Storage;
    use ink::env::hash::HashOutput;
    use ink::env::hash::Keccak256;

    #[ink(storage)]
    #[derive(Default, Storage)]
    pub struct Contract {
        #[storage_field]
        psp34: psp34::Data,
    }

    impl Contract {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self::default()
        }

        #[ink(message)]
        pub fn mint(&mut self, id: Id, token_uri: String, signature: [u8; 65]) -> Result<(), PSP34Error> {
            let encoded_id = scale::Encode::encode(&id);
            let encoded_uri = token_uri.as_bytes();
            let mut message_to_sign = Vec::new();
            message_to_sign.extend_from_slice(&encoded_id);
            message_to_sign.extend_from_slice(&encoded_uri);
			
            if !verify_signature(&signature, &message_to_sign) {
                return Err(PSP34Error::Custom(String::from("invalid signature")))
            }
            psp34::Internal::_mint_to(self, Self::env().caller(), id);
			Ok(())
        }
    }
    fn verify_signature(signature: &[u8; 65], message: &[u8]) -> bool {
        let mut message_hash = <Keccak256 as HashOutput>::Type::default();
        ink::env::hash_encoded::<Keccak256, _>(&message, &mut message_hash);
        let mut output = [0; 33];
        ink::env::ecdsa_recover(signature, &message_hash, &mut output);
        true
    }
}