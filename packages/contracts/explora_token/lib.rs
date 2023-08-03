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
    pub struct ExploraToken {
        #[storage_field]
        psp34: psp34::Data,
        signer: [u8; 20],
    }

    impl ExploraToken {
        #[ink(constructor)]
        pub fn new(signer: [u8; 20]) -> Self {
            let mut instance = Self::default();
            instance.signer = signer;
            instance
        }

        #[ink(message)]
        pub fn mint(&mut self, id: u128, token_uri: String, signature: [u8; 65]) -> Result<(), PSP34Error> {
            let encoded_id = scale::Encode::encode(&id);
            let encoded_uri = token_uri.as_bytes();
            let mut message_to_sign = Vec::new();
            message_to_sign.extend_from_slice(&encoded_id);
            message_to_sign.extend_from_slice(&encoded_uri);
			
            if !verify_signature(&signature, &message_to_sign, &self.signer) {
                return Err(PSP34Error::Custom(String::from("invalid signature")))
            }
            psp34::Internal::_mint_to(self, Self::env().caller(), Id::U128(id));
			Ok(())
        }
    }
    fn verify_signature(signature: &[u8; 65], message: &[u8], signer: &[u8; 20]) -> bool {
        let mut bytes_to_sign = &scale::Encode::encode(&message)[..];
        let mut message_hash = <Keccak256 as HashOutput>::Type::default();
        ink::env::hash_bytes::<Keccak256>(&bytes_to_sign[1..], &mut message_hash);
        let mut output = [0; 33];
        ink::env::ecdsa_recover(&signature, &message_hash, &mut output);
        let mut eth_addr = [0; 20];
        ink::env::ecdsa_to_eth_address(&output, &mut eth_addr);
        if &eth_addr == signer {
            true
        } else {
            false
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        #[ink::test]
        fn hash_generation() {
            let id: u128 = 2000;
            let token_uri = String::from("test123");
            let mut encoded_id = scale::Encode::encode(&id);
            encoded_id.reverse();
            let encoded_uri = token_uri.as_bytes();
            let mut message_to_sign = Vec::new();
            message_to_sign.extend_from_slice(&encoded_id);
            message_to_sign.extend_from_slice(&encoded_uri);
            let mut bytes_to_sign = &scale::Encode::encode(&message_to_sign)[..];
            
            let mut message_hash = <Keccak256 as HashOutput>::Type::default();
            ink::env::hash_bytes::<Keccak256>(&bytes_to_sign[1..], &mut message_hash);
            
            println!("message hash: {:?}", message_hash);
        }
        
        #[ink::test]
        fn signature_recover() {
            let hash = [143, 34, 179, 64, 56, 88, 37, 50, 121, 36, 7, 148, 67, 221, 44, 128, 88, 183, 205, 240, 32, 163, 43, 167, 244, 83, 16, 47, 107, 138, 225, 194];
            let signature = [203, 125, 112, 12, 217, 154, 192, 127, 47, 243, 235, 129, 162, 27, 108, 101, 136, 35, 8, 151, 177, 167, 80, 189, 133, 1, 105, 159, 50, 177, 100, 70, 87, 174, 162, 188, 194, 37, 241, 196, 149, 202, 8, 8, 183, 40, 46, 60, 43, 187, 224, 49, 226, 74, 153, 52, 194, 53, 190, 48, 158, 144, 147, 127, 27];
            let mut output = [0; 33];
            ink::env::ecdsa_recover(&signature, &hash, &mut output);
            
            let mut eth_addr = [0; 20];
            ink::env::ecdsa_to_eth_address(&output, &mut eth_addr);
            println!("public key: {:?}", eth_addr);
        }
    }
}