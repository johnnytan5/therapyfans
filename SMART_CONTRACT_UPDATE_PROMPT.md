# Smart Contract Update Request: Kiosk-Compatible Booking Proof Function

## 🎯 **Issue Description**

The current `booking_proof::mint_booking_proof` function cannot work with TherapistNFTs that are stored in kiosks because it expects `&TherapistNFT` (a direct reference), but kiosk-stored objects cannot be directly referenced in Move smart contracts.

**Current function signature:**
```move
public entry fun mint_booking_proof(
    therapist_nft: &TherapistNFT,  // ❌ Cannot reference kiosk-stored NFT
    start_ts: u64,
    end_ts: u64,
    ctx: &mut TxContext
)
```

**Error encountered in frontend:**
```
InvalidChildObjectArgument { 
  child_id: 0x4fcaca1b02c0d8987f5e2f88bb9d8e8bb68201a0d4d293150c706eece39cf0cb, 
  parent_id: 0x000e3cc026ff9f4152d51d5497c0223c34619b82d7434175684cf40a6bf2dcc1 
}
```

## 🔧 **Required Solution**

Add a new function to `booking_proof.move` that accepts a TherapistNFT object ID instead of a direct reference. This will work with both directly owned and kiosk-stored NFTs.

**New function to add:**
```move
/// Mint a booking proof NFT using TherapistNFT object ID (works with kiosk-stored NFTs)
public entry fun mint_booking_proof_by_id(
    therapist_nft_id: ID,
    start_ts: u64,
    end_ts: u64,
    ctx: &mut TxContext
) {
    // Basic validation
    assert!(end_ts > start_ts, EInvalidRange);
    assert!(start_ts > 0, EInvalidTime);

    let caller: address = tx_context::sender(ctx);

    let nft = BookingProofNFT {
        id: object::new(ctx),
        therapist_id: therapist_nft_id,  // Use the ID directly instead of extracting from reference
        user: caller,
        start_ts,
        end_ts,
    };

    // Transfer the newly minted booking NFT to the caller
    transfer::transfer(nft, caller);
}
```

## 📋 **Implementation Requirements**

1. **Add the new function** to `booking_proof.move` alongside the existing `mint_booking_proof` function
2. **Keep the original function** for backward compatibility
3. **Use the same validation logic** (`EInvalidRange`, `EInvalidTime` error constants)
4. **Use the same `BookingProofNFT` struct** structure
5. **Import `ID` type** if not already imported: `use sui::object::{Self, UID, ID};`

## 🎯 **Key Differences from Original Function**

- **Parameter**: Accept `therapist_nft_id: ID` instead of `therapist_nft: &TherapistNFT`
- **Logic**: Use `therapist_nft_id` directly instead of calling `object::id(therapist_nft)`
- **Compatibility**: Works with both kiosk-stored and directly owned TherapistNFTs

## ✅ **Expected Result**

After this update:
1. **Frontend can call the new function** with TherapistNFT object IDs extracted from kiosks
2. **Booking proof NFTs will mint successfully** for kiosk-stored TherapistNFTs
3. **Original function remains available** for directly owned NFTs (backward compatibility)
4. **No breaking changes** to existing functionality

## 🚀 **Frontend Integration**

Once deployed, the frontend will call the new function like this:
```typescript
tx.moveCall({
  target: `${PACKAGE_ID}::booking_proof::mint_booking_proof_by_id`,
  arguments: [
    tx.pure.id(therapistNftId),  // Object ID extracted from kiosk
    tx.pure.u64(startTs),
    tx.pure.u64(endTs)
  ],
});
```

## 📝 **Additional Notes**

- This solution addresses the production requirement where TherapistNFTs are stored in kiosks for marketplace functionality
- The original test implementation worked because it used directly owned NFTs, but production requires kiosk storage
- This approach maintains the same security model while being compatible with the kiosk storage pattern

Please implement this change and let me know the new package ID after deployment so I can update the frontend configuration.
