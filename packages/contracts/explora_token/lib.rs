#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[openbrush::implementation(PSP34)]
#[openbrush::contract]
pub mod explora_token {
    use openbrush::traits::Storage;
    use secp256k1::{RecoveryId, Message, Signature, PublicKey, Secp256k1};    

    #[ink(storage)]
    #[derive(Default, Storage)]
    pub struct Contract {
        #[storage_field]
        psp34: psp34::Data,
    }

    #[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    pub struct Id {
        value: u64,
    }

    impl Contract {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self::default()
        }

        #[ink(message)]
        pub fn mint(&mut self, id: Id, token_uri: String, signature: Vec<u8>) -> Result<(), PSP34Error> {
            let caller = Self::env().caller();
            let encoded_id = scale::Encode::encode(&id);
            let encoded_uri = token_uri.as_bytes();
    
            // Combine the ID and URI data to generate the message to be signed
            let mut message_to_sign = Vec::new();
            message_to_sign.extend_from_slice(&encoded_id);
            message_to_sign.extend_from_slice(&encoded_uri);
    
            // Verify the signature using the provided public key
            let public_key = self.psp34.public_keys.get(&caller).ok_or(PSP34Error::InvalidCaller)?;
            if !verify_signature(&signature, &message_to_sign, &public_key) {
                return Err(PSP34Error::InvalidSignature);
            }
    
            // Mint the token if the signature is valid
            psp34::Internal::_mint_to(self, caller, id)?;
    
            Ok(())
        }
    }
    
    fn verify_signature(signature: &[u8], message: &[u8], public_key: &[u8]) -> bool {
        let secp = Secp256k1::verification_only();
        let message = Message::parse_slice(message).expect("Invalid message");
        let signature = Signature::parse_slice(signature).expect("Invalid signature");
        let public_key = PublicKey::parse_slice(public_key).expect("Invalid public key");

        let recovery_id = RecoveryId::parse(signature[64]).expect("Invalid recovery ID");
        let message_hash = secp256k1::Message::from_slice(&message);
        if let Ok(message_hash) = message_hash {
            if let Ok(recovered_public_key) = secp.recover(&message_hash, &signature, &recovery_id) {
                return recovered_public_key.serialize_uncompressed() == public_key.serialize_uncompressed();
            }
        }
        false
    }
}
