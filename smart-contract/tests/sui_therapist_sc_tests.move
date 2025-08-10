/*
#[test_only]
module sui_therapist_sc::sui_therapist_sc_tests;
// uncomment this line to import the module
// use sui_therapist_sc::sui_therapist_sc;

const ENotImplemented: u64 = 0;

#[test]
fun test_sui_therapist_sc() {
    // pass
}

#[test, expected_failure(abort_code = ::sui_therapist_sc::sui_therapist_sc_tests::ENotImplemented)]
fun test_sui_therapist_sc_fail() {
    abort ENotImplemented
}
*/

#[test_only]
module sui_therapist_sc::sui_therapist_sc_tests {
    use sui::test_scenario;
    use sui_therapist_sc::therapist_nft;
        use sui_therapist_sc::nft_rental;

    // Owner can list successfully
    #[test]
    fun owner_can_list_for_sale() {
        let sender = @0x1;
        let mut sc = test_scenario::begin(sender);
        let ctx = test_scenario::ctx(&mut sc);

        let nft = therapist_nft::mint_for_testing(
            b"Dr. Lee", b"Therapy", b"LCSW", 10, b"bio", b"types", b"en", 95, 0, b"img", b"cert", ctx
        );
        let (mut kiosk, cap) = nft_rental::new_kiosk_for_testing(ctx);
        nft_rental::list_for_sale(&mut kiosk, &cap, nft, 1_000_000, ctx);
    }

    // Non-owner cannot list
    #[test, expected_failure]
    fun non_owner_cannot_list_for_sale() {
        // Mint under sender1
        let sender1 = @0x1;
        let mut sc1 = test_scenario::begin(sender1);
        let ctx1 = test_scenario::ctx(&mut sc1);
        let nft = therapist_nft::mint_for_testing(
            b"Dr. Lee", b"Therapy", b"LCSW", 10, b"bio", b"types", b"en", 95, 0, b"img", b"cert", ctx1
        );

        // Attempt to list under a different signer
        let sender2 = @0x2;
        let mut sc2 = test_scenario::begin(sender2);
        let ctx2 = test_scenario::ctx(&mut sc2);
        let (mut kiosk2, cap2) = nft_rental::new_kiosk_for_testing(ctx2);
        // Should abort inside list_for_sale due to owner check
        nft_rental::list_for_sale(&mut kiosk2, &cap2, nft, 1_000_000, ctx2);
    }
}
