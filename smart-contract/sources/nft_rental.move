// // Copyright (c) Mysten Labs, Inc.
module sui_therapist_sc::nft_rental {
    //! Buy/Sell only: Kiosk creation and fixed-price listing for TherapistNFT.
    //! All rental-related features have been removed.

    use sui::event;
    use sui::kiosk::{Kiosk, KioskOwnerCap};
    use sui::coin::Coin;
    use sui::sui::SUI;
    use sui::transfer_policy::TransferPolicy;
    use sui_therapist_sc::therapist_nft::TherapistNFT;

    /// Errors (kept for compatibility; ownership enforced by entry arg semantics)
    #[allow(unused_const)]
    const E_NOT_NFT_OWNER: u64 = 0x1; // Sender is not current owner of NFT

    /// Event emitted when a kiosk is created via this module's canonical entry.
    public struct KioskCreated has copy, drop {
        kiosk: sui::object::ID,
        cap: sui::object::ID,
    }

    /// Event emitted when an NFT is purchased from a kiosk via this module.
    public struct KioskPurchased has copy, drop {
        item: sui::object::ID,
        buyer: address,
    }

    /// A shared object that should be minted by the creator to authorize transfers
    /// of TherapistNFT out of kiosks. This holds the empty TransferPolicy for the type.
        // TransferPolicy<TherapistNFT> is a shared object created once by the package publisher
        // via setup_policy(). It's passed by reference to buy() to confirm transfer requests.

    /// Create and share a new Kiosk and transfer its OwnerCap to the signer.
    /// Single-call, signer-only entry that frontend can call without handling returns.
    public entry fun new_kiosk(ctx: &mut TxContext) {
    let (kiosk, cap) = sui::kiosk::new(ctx);

        // Capture IDs and emit event for deterministic parsing by frontends.
    let kiosk_id = sui::object::id(&kiosk);
    let cap_id = sui::object::id(&cap);
        event::emit(KioskCreated { kiosk: kiosk_id, cap: cap_id });

        // Share kiosk and send OwnerCap back to signer.
    sui::transfer::public_share_object(kiosk);
    sui::transfer::public_transfer(cap, sui::tx_context::sender(ctx));
    }

    /// List an NFT for direct purchase at a fixed price.
    /// Requires that the tx sender is the current owner of the NFT.
    /// Flow: check owner -> place into kiosk -> list at price.
    public entry fun list_for_sale(
        kiosk: &mut Kiosk,
        cap: &KioskOwnerCap,
        nft: TherapistNFT,
        price: u64,
        _ctx: &mut TxContext,
    ) {
    // Get ID before moving into kiosk, then place and list at fixed price.
    let item_id = sui::object::id(&nft);
    sui::kiosk::place(kiosk, cap, nft);
    sui::kiosk::list<TherapistNFT>(kiosk, cap, item_id, price);
    }

    /// Buy a listed TherapistNFT using a payment Coin<SUI>.
    /// Wraps sui::kiosk::purchase and transfers both NFT and any change to the buyer (tx sender).
    public entry fun buy(
        kiosk: &mut Kiosk,
        tp: &TransferPolicy<TherapistNFT>,
        item_id: sui::object::ID,
        payment: Coin<SUI>,
        ctx: &mut TxContext,
    ) {
        let buyer = sui::tx_context::sender(ctx);
        let (nft, req) = sui::kiosk::purchase<TherapistNFT>(kiosk, item_id, payment);
        // Confirm the transfer request via the shared TransferPolicy for this type.
        let (_item, _paid, _from) = sui::transfer_policy::confirm_request<TherapistNFT>(tp, req);

        // Emit purchase event and deliver the NFT to the buyer.
        event::emit(KioskPurchased { item: item_id, buyer });
        sui::transfer::public_transfer(nft, buyer);
    }

    // Note: TransferPolicy<TherapistNFT> is auto-created and shared in therapist_nft::init.

    // Test helper for creating kiosk within unit tests.
    #[test_only]
    public fun new_kiosk_for_testing(ctx: &mut TxContext): (Kiosk, KioskOwnerCap) {
    sui::kiosk::new(ctx)
    }
}

//     // === Private Functions ===

//     fun take_from_bag<T: key + store, Key: store + copy + drop>(
//         kiosk: &mut Kiosk,
//         item: Key,
//     ): Rentable<T> {
//         let ext_storage_mut = kiosk_extension::storage_mut(Rentables {}, kiosk);
//         assert!(bag::contains(ext_storage_mut, item), EObjectNotExist);
//         bag::remove<Key, Rentable<T>>(ext_storage_mut, item)
//     }

//     fun place_in_bag<T: key + store, Key: store + copy + drop>(
//         kiosk: &mut Kiosk,
//         item: Key,
//         rentable: Rentable<T>,
//     ) {
//         let ext_storage_mut = kiosk_extension::storage_mut(Rentables {}, kiosk);
//         bag::add(ext_storage_mut, item, rentable);
//     }

//     // === Test Functions ===
//     #[test_only]
//     public fun test_protected_tp<T>(ctx: &mut TxContext): ProtectedTP<T> {
//         let publisher = sui::package::test_claim(sui::package::test_publish(object::new(ctx), ctx), ctx);
//         let (tp, cap) = transfer_policy::new<T>(&publisher, ctx);
//         transfer::public_share_object(publisher);
//         ProtectedTP<T> {
//             id: object::new(ctx),
//             transfer_policy: tp,
//             policy_cap: cap,
//         }
//     }

//     #[test_only]
//     public fun test_rental_policy<T>(ctx: &mut TxContext, amount_bp: u64): RentalPolicy<T> {
//         RentalPolicy<T> {
//             id: object::new(ctx),
//             balance: balance::zero<SUI>(),
//             amount_bp,
//         }
//     }

//     #[test_only]
//     public fun new_kiosk_for_testing(ctx: &mut TxContext): (Kiosk, KioskOwnerCap) {
//         kiosk::new(ctx)
//     }

//     #[test_only]
//     public fun create_listed(id: ID): Listed {
//         Listed { id }
//     }
// }