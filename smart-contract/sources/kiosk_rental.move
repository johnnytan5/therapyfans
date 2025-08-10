// module sui_therapist_sc::kiosk_rental {
// 	use sui::kiosk::{Kiosk, KioskOwnerCap};
// 	use sui::tx_context::TxContext;
// 	use sui_therapist_sc::nft_rental; // buy/sell only
// 	use sui_therapist_sc::therapist_nft::TherapistNFT;

// 	/// Create a new kiosk (wrapper). Shares kiosk and returns OwnerCap to signer.
// 	public entry fun new_kiosk(ctx: &mut TxContext) {
// 	let (kiosk, cap) = sui::kiosk::new(ctx);
// 	sui::transfer::public_share_object(kiosk);
// 	sui::transfer::public_transfer(cap, sui::tx_context::sender(ctx));
// 	}

// 	/// For tests: create kiosk and return both.
// 	#[test_only]
// 	public fun new_kiosk_for_testing(ctx: &mut TxContext): (Kiosk, KioskOwnerCap) {
// 	sui::kiosk::new(ctx)
// 	}

// 	/// List an NFT for direct sale at fixed price. Enforces owner-only listing.
// 	public entry fun list_for_sale(
// 		kiosk: &mut Kiosk,
// 		cap: &KioskOwnerCap,
// 		nft: TherapistNFT,
// 		price: u64,
// 		ctx: &mut TxContext
// 	) {
// 		nft_rental::list_for_sale(kiosk, cap, nft, price, ctx);
// 	}
// }