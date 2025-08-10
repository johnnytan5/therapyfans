#[allow(duplicate_alias)]
module sui_therapist_sc::booking_proof {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;

    // bring in TherapistNFT type so we can accept &TherapistNFT as arg
    use sui_therapist_sc::therapist_nft::TherapistNFT;

    /// Booking proof NFT — soulbound (no `store` ability -> not publicly transferable)
    public struct BookingProofNFT has key {
        id: UID,
        therapist_id: ID,
        user: address,
        start_ts: u64,
        end_ts: u64,
    }

    /// Errors
    const EInvalidTime: u64 = 1;
    const EInvalidRange: u64 = 2;

    /// Mint a soulbound booking NFT to the caller. Caller pays on-chain as part of tx (off-chain payment handling is possible too).
    /// - `therapist_nft`: pass the therapist NFT object id as an immutable object arg (tx.object(...)).
    /// - `start_ts`, `end_ts`: epoch milliseconds (u64).
    public entry fun mint_booking_proof(
        therapist_nft: &TherapistNFT,
        start_ts: u64,
        end_ts: u64,
        ctx: &mut TxContext
    ) {
        // basic validation
        assert!(end_ts > start_ts, EInvalidRange);
        assert!(start_ts > 0, EInvalidTime);

        let therapist_id: ID = object::id(therapist_nft);
        let caller: address = tx_context::sender(ctx);

        let nft = BookingProofNFT {
            id: object::new(ctx),
            therapist_id,
            user: caller,
            start_ts,
            end_ts,
        };

        // transfer the newly minted booking NFT to the caller (module-level transfer)
        transfer::transfer(nft, caller);
    }

    /// Mint a soulbound booking NFT using TherapistNFT object ID (works with kiosk-stored NFTs)
    /// - `therapist_nft_id`: the object ID of the therapist NFT (works with kiosk-stored NFTs)
    /// - `start_ts`, `end_ts`: epoch milliseconds (u64).
    public entry fun mint_booking_proof_by_id(
        therapist_nft_id: ID,
        start_ts: u64,
        end_ts: u64,
        ctx: &mut TxContext
    ) {
        // basic validation
        assert!(end_ts > start_ts, EInvalidRange);
        assert!(start_ts > 0, EInvalidTime);

        let caller: address = tx_context::sender(ctx);

        let nft = BookingProofNFT {
            id: object::new(ctx),
            therapist_id: therapist_nft_id,
            user: caller,
            start_ts,
            end_ts,
        };

        // transfer the newly minted booking NFT to the caller (module-level transfer)
        transfer::transfer(nft, caller);
    }

    /// read helpers
    public fun therapist_id(nft: &BookingProofNFT): ID { nft.therapist_id }
    public fun user(nft: &BookingProofNFT): address { nft.user }
    public fun start_ts(nft: &BookingProofNFT): u64 { nft.start_ts }
    public fun end_ts(nft: &BookingProofNFT): u64 { nft.end_ts }
}
