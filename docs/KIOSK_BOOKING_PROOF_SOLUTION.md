# 🏪 Kiosk-Stored NFT Booking Proof Solution

## 🎯 **Problem Confirmed**

Now that we understand the production flow, the issue is clear:

- **TherapistNFTs are stored in kiosks** (correct production pattern)
- **Smart contract expects `&TherapistNFT`** (direct reference)
- **Kiosk-stored objects cannot be directly referenced** in smart contracts

## 🔧 **Solution Options**

### **Option 1: Modify Smart Contract (Recommended)**

Update `booking_proof.move` to work with kiosk-stored NFTs:

```move
// Current (problematic with kiosks)
public entry fun mint_booking_proof(
    therapist_nft: &TherapistNFT,  // ❌ Cannot reference kiosk-stored NFT
    start_ts: u64,
    end_ts: u64,
    ctx: &mut TxContext
)

// Proposed (works with kiosks)
public entry fun mint_booking_proof_by_id(
    therapist_nft_id: ID,          // ✅ Accept object ID instead
    start_ts: u64,
    end_ts: u64,
    ctx: &mut TxContext
) {
    // Validate that the ID corresponds to a valid TherapistNFT
    // This can be done by checking object existence and type
    let therapist_id = therapist_nft_id;
    // ... rest of the logic
}
```

### **Option 2: Kiosk Integration Pattern**

Create a more sophisticated booking system that works with kiosks:

```move
public entry fun mint_booking_proof_with_kiosk(
    kiosk: &mut Kiosk,
    kiosk_cap: &KioskOwnerCap,
    therapist_nft_id: ID,
    start_ts: u64,
    end_ts: u64,
    ctx: &mut TxContext
) {
    // Temporarily borrow the NFT from kiosk
    let nft_ref = kiosk::borrow<TherapistNFT>(kiosk, kiosk_cap, therapist_nft_id);
    let therapist_id = object::id(nft_ref);
    
    // Create booking proof
    let booking_proof = BookingProofNFT {
        id: object::new(ctx),
        therapist_id,
        user: tx_context::sender(ctx),
        start_ts,
        end_ts,
    };
    
    transfer::transfer(booking_proof, tx_context::sender(ctx));
}
```

### **Option 3: Temporary NFT Extraction (Complex)**

Temporarily take NFT out of kiosk, mint booking proof, put it back:

```typescript
// 1. Take NFT from kiosk
tx.moveCall({
  target: `${PACKAGE_ID}::kiosk::take`,
  arguments: [kiosk, kioskCap, therapistNftId]
});

// 2. Mint booking proof with direct NFT reference
tx.moveCall({
  target: `${PACKAGE_ID}::booking_proof::mint_booking_proof`,
  arguments: [tx.object(therapistNftId), startTs, endTs]
});

// 3. Put NFT back in kiosk
tx.moveCall({
  target: `${PACKAGE_ID}::kiosk::place`,
  arguments: [kiosk, kioskCap, therapistNft]
});
```

## 🚀 **Recommended Implementation**

### **Short-term (Immediate Fix)**

Modify the smart contract to accept object IDs:

```move
// Add this new function to booking_proof.move
public entry fun mint_booking_proof_by_id(
    therapist_nft_id: ID,
    start_ts: u64,
    end_ts: u64,
    ctx: &mut TxContext
) {
    let caller: address = tx_context::sender(ctx);
    
    let nft = BookingProofNFT {
        id: object::new(ctx),
        therapist_id: therapist_nft_id,  // Use the ID directly
        user: caller,
        start_ts,
        end_ts,
    };

    transfer::transfer(nft, caller);
}
```

### **Frontend Update**

```typescript
// Update the frontend to use the new function
tx.moveCall({
  target: `${PACKAGE_ID}::booking_proof::mint_booking_proof_by_id`,
  arguments: [
    tx.pure.id(actualTherapistNftId), // Pass as ID, not object reference
    tx.pure.u64(BigInt(startTs)),
    tx.pure.u64(BigInt(endTs))
  ],
});
```

### **Long-term (Robust Solution)**

Implement proper kiosk integration that:
1. **Validates NFT ownership** through kiosk
2. **Checks NFT authenticity** and type
3. **Maintains kiosk listing** while creating booking proof
4. **Integrates with marketplace flow** seamlessly

## 🎯 **Next Steps**

### **1. Smart Contract Update**
- Add `mint_booking_proof_by_id` function to `booking_proof.move`
- Deploy updated contract
- Update `PACKAGE_ID` in frontend config

### **2. Frontend Integration**
- Update `CONTRACT_FUNCTIONS` to include new function
- Modify transaction to use ID instead of object reference
- Test with kiosk-stored TherapistNFTs

### **3. Validation Enhancement**
- Add NFT existence and type validation
- Ensure booking proof references valid TherapistNFTs
- Implement proper error handling

## 🔧 **Implementation Priority**

**High Priority:**
1. ✅ Smart contract modification (new function)
2. ✅ Frontend update to use new function
3. ✅ Basic testing with kiosk-stored NFTs

**Medium Priority:**
1. NFT validation and authentication
2. Enhanced error handling
3. Integration testing

**Low Priority:**
1. Advanced kiosk integration patterns
2. Performance optimizations
3. Additional security measures

This approach will resolve the `InvalidChildObjectArgument` error and make the booking proof system compatible with the production kiosk storage pattern! 🎉
