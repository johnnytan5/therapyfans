#[allow(duplicate_alias, unused_use)]
module sui_therapist_sc::therapist_nft {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::package;
    use sui::event;
    use sui::transfer_policy::{Self, TransferPolicy, TransferPolicyCap};

    /// ======== One-Time-Witness ========
    public struct THERAPIST_NFT has drop {}

    /// Emitted once at publish-time init when we create the default TransferPolicy
    public struct PolicyCreated has copy, drop { id: ID }

    /// ======== Init Function ========
    fun init(otw: THERAPIST_NFT, ctx: &mut TxContext) {
        let publisher = package::claim(otw, ctx);
        // Create and share a zero-rule TransferPolicy for TherapistNFT so kiosk purchases can be confirmed.
        let (policy, cap) = transfer_policy::new<TherapistNFT>(&publisher, ctx);
        event::emit(PolicyCreated { id: object::id(&policy) });
        transfer::public_share_object(policy);
        // Return both the TransferPolicyCap and Publisher to the deployer.
        transfer::public_transfer(cap, tx_context::sender(ctx));
        transfer::public_transfer(publisher, tx_context::sender(ctx));
    }

    /// ======== Struct ========
    /// NFT representing therapist's service offering
    public struct TherapistNFT has key, store {
        id: UID,
        name: vector<u8>,
        specialization: vector<u8>,
        credentials: vector<u8>,
        years_experience: u64,
        bio: vector<u8>,
        session_types: vector<u8>,
        languages: vector<u8>,
        rating: u64,
        total_sessions: u64,
        profile_image_url: vector<u8>,
        certification_url: vector<u8>,
    }

    /// ======== Constants ========
    const THIRTY_MIN_PRICE_MIST: u64 = 5000000000;
    const ONE_HOUR_PRICE_MIST: u64 = 10000000000;
    const THIRTY_MINUTES_MS: u64 = 1800000;
    const ONE_HOUR_MS: u64 = 3600000;

    /// ======== Error Codes ========
    const EInvalidDuration: u64 = 1;
    const EInvalidRating: u64 = 2;

    /// ======== Entry: Mint Therapist Service NFT ========
    public entry fun mint(
        name: vector<u8>,
        specialization: vector<u8>,
        credentials: vector<u8>,
        years_experience: u64,
        bio: vector<u8>,
        session_types: vector<u8>,
        languages: vector<u8>,
        rating: u64,
        total_sessions: u64,
        profile_image_url: vector<u8>,
        certification_url: vector<u8>,
        ctx: &mut TxContext
    ) {
        assert!(rating <= 100, EInvalidRating);

        let nft = TherapistNFT {
            id: object::new(ctx),
            name,
            specialization,
            credentials,
            years_experience,
            bio,
            session_types,
            languages,
            rating,
            total_sessions,
            profile_image_url,
            certification_url,
        };
        
        transfer::transfer(nft, tx_context::sender(ctx));
    }

    /// ======== Public Functions for Rental Integration ========
    public fun get_30min_price(): u64 { THIRTY_MIN_PRICE_MIST }
    public fun get_1hour_price(): u64 { ONE_HOUR_PRICE_MIST }
    public fun get_30min_duration_ms(): u64 { THIRTY_MINUTES_MS }
    public fun get_1hour_duration_ms(): u64 { ONE_HOUR_MS }

    public fun get_price_for_duration(duration_minutes: u64): u64 {
        if (duration_minutes == 30) {
            THIRTY_MIN_PRICE_MIST
        } else if (duration_minutes == 60) {
            ONE_HOUR_PRICE_MIST
        } else {
            abort EInvalidDuration
        }
    }

    public fun get_duration_ms(duration_minutes: u64): u64 {
        if (duration_minutes == 30) {
            THIRTY_MINUTES_MS
        } else if (duration_minutes == 60) {
            ONE_HOUR_MS
        } else {
            abort EInvalidDuration
        }
    }

    /// ======== Getter Functions ========
    public fun name(nft: &TherapistNFT): &vector<u8> { &nft.name }
    public fun specialization(nft: &TherapistNFT): &vector<u8> { &nft.specialization }
    public fun credentials(nft: &TherapistNFT): &vector<u8> { &nft.credentials }
    public fun years_experience(nft: &TherapistNFT): u64 { nft.years_experience }
    public fun bio(nft: &TherapistNFT): &vector<u8> { &nft.bio }
    public fun session_types(nft: &TherapistNFT): &vector<u8> { &nft.session_types }
    public fun languages(nft: &TherapistNFT): &vector<u8> { &nft.languages }
    public fun rating(nft: &TherapistNFT): u64 { nft.rating }
    public fun total_sessions(nft: &TherapistNFT): u64 { nft.total_sessions }
    public fun profile_image_url(nft: &TherapistNFT): &vector<u8> { &nft.profile_image_url }
    public fun certification_url(nft: &TherapistNFT): &vector<u8> { &nft.certification_url }

    /// small helper so other modules can obtain the object id
    public fun get_id(nft: &TherapistNFT): ID { object::id(nft) }

    /// ======== Update Functions (Only NFT owner can call) ========
    public entry fun update_rating(nft: &mut TherapistNFT, new_rating: u64, _ctx: &mut TxContext) {
        assert!(new_rating <= 100, EInvalidRating);
        nft.rating = new_rating;
    }

    public entry fun increment_sessions(nft: &mut TherapistNFT, _ctx: &mut TxContext) {
        nft.total_sessions = nft.total_sessions + 1;
    }

    public entry fun update_bio(nft: &mut TherapistNFT, new_bio: vector<u8>, _ctx: &mut TxContext) {
        nft.bio = new_bio;
    }

    public entry fun update_profile_image(nft: &mut TherapistNFT, new_url: vector<u8>, _ctx: &mut TxContext) {
        nft.profile_image_url = new_url;
    }

    /// ======== For Testing ========
    #[test_only]
    public fun mint_for_testing(
        name: vector<u8>,
        specialization: vector<u8>,
        credentials: vector<u8>,
        years_experience: u64,
        bio: vector<u8>,
        session_types: vector<u8>,
        languages: vector<u8>,
        rating: u64,
        total_sessions: u64,
        profile_image_url: vector<u8>,
        certification_url: vector<u8>,
        ctx: &mut TxContext
    ): TherapistNFT {
        TherapistNFT {
            id: object::new(ctx),
            name,
            specialization,
            credentials,
            years_experience,
            bio,
            session_types,
            languages,
            rating,
            total_sessions,
            profile_image_url,
            certification_url,
        }
    }

    #[test_only]
    public fun id(nft: &TherapistNFT): ID {
        object::id(nft)
    }
}

// Removed deprecated test_utils module and restricted Clock constructor.
