# 🚀 Smart Contract Integration Guide

This guide documents how your TherapyFans project is configured to interact with your deployed smart contracts using package ID: `0x4257be6ae1a26a4bc491ca2d4db672678c3c50bee810efa8e6c34cf3cfa135c3`

## 📦 Package Configuration

### ✅ Centralized Configuration

All smart contract interactions now use centralized configuration from `src/lib/suiConfig.ts`:

```typescript
// Your deployed package ID
export const PACKAGE_ID = "0x4257be6ae1a26a4bc491ca2d4db672678c3c50bee810efa8e6c34cf3cfa135c3";

// Network configuration
export const NETWORK = "testnet"; // or "mainnet"

// Smart contract function targets
export const CONTRACT_FUNCTIONS = {
  mintTherapistNft: `${PACKAGE_ID}::therapist_nft::mint`,
  newKiosk: `${PACKAGE_ID}::nft_rental::new_kiosk`,
  listForSale: `${PACKAGE_ID}::nft_rental::list_for_sale`,
  buy: `${PACKAGE_ID}::nft_rental::buy`,
  // ... more functions
};

// Type definitions
export const SUI_TYPES = {
  therapistNft: `${PACKAGE_ID}::therapist_nft::TherapistNFT`,
  transferPolicy: `0x2::transfer_policy::TransferPolicy<${PACKAGE_ID}::therapist_nft::TherapistNFT>`,
};
```

## 🔧 Updated Files

### 1. **Core Configuration**
- ✅ `src/lib/suiConfig.ts` - Centralized smart contract configuration
- ✅ `src/lib/therapistWalletService.ts` - Updated to use correct package ID

### 2. **Test Pages**
- ✅ `src/app/sc-test/page.tsx` - Smart contract testing interface
- ✅ `src/app/therapist-test/page.tsx` - Therapist NFT minting
- ✅ `src/app/test-client-side/page.tsx` - Client-side testing

### 3. **Integration Files**
- ✅ `src/app/marketplace/[walletAddress]/page.tsx` - Marketplace integration
- ✅ `src/types/index.ts` - TypeScript type definitions

## 🎯 Key Functions Available

### 1. **Therapist NFT Operations**
```typescript
import { CONTRACT_FUNCTIONS } from '@/lib/suiConfig';

// Mint new TherapistNFT
tx.moveCall({
  target: CONTRACT_FUNCTIONS.mintTherapistNft,
  arguments: [
    tx.pure.string(name),
    tx.pure.string(specialization),
    // ... other fields
  ],
});
```

### 2. **Kiosk Operations**
```typescript
// Create new kiosk
tx.moveCall({
  target: CONTRACT_FUNCTIONS.newKiosk,
  arguments: [],
});

// List NFT for sale
tx.moveCall({
  target: CONTRACT_FUNCTIONS.listForSale,
  arguments: [kioskRef, capRef, nftRef, price],
});

// Buy NFT from kiosk
tx.moveCall({
  target: CONTRACT_FUNCTIONS.buy,
  arguments: [kioskRef, policyRef, itemId, payment],
});
```

### 3. **Wallet Service Integration**
```typescript
import { getTherapistIdFromWallet } from '@/lib/therapistWalletService';

// Get therapist ID from wallet's TherapistNFT
const therapistId = await getTherapistIdFromWallet(walletAddress);
console.log('Therapist ID for soulbound NFT:', therapistId);
```

## 🌐 Environment Variables

Create a `.env.local` file with:

```bash
# Sui Network Configuration
NEXT_PUBLIC_SUI_NETWORK=testnet

# Your deployed smart contract package ID
NEXT_PUBLIC_PACKAGE_ID=0x4257be6ae1a26a4bc491ca2d4db672678c3c50bee810efa8e6c34cf3cfa135c3

# Optional: Transfer Policy ID (auto-detected if not specified)
# NEXT_PUBLIC_TRANSFER_POLICY_ID=0x...

# Enoki and OAuth configuration
NEXT_PUBLIC_ENOKI_API_KEY=your_enoki_api_key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_FACEBOOK_CLIENT_ID=your_facebook_client_id
NEXT_PUBLIC_TWITCH_CLIENT_ID=your_twitch_client_id

# Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🧪 Testing Your Integration

### 1. **Test Smart Contract Functions**
Navigate to `/sc-test` in your app to test:
- ✅ Kiosk creation
- ✅ NFT minting
- ✅ NFT listing for sale
- ✅ NFT purchasing

### 2. **Test Therapist Wallet Service**
Navigate to `/marketplace/[walletAddress]` to test:
- ✅ Therapist wallet verification
- ✅ TherapistNFT ID retrieval
- ✅ Soulbound NFT preparation

### 3. **Test Therapist NFT Minting**
Navigate to `/therapist-test` to test:
- ✅ Mint TherapistNFT with your package
- ✅ Fetch owned TherapistNFTs
- ✅ View NFT details

## 🔍 Verification Steps

1. **Check Package ID is Correct**: Look for logs showing your package ID in browser console
2. **Test NFT Minting**: Try minting a TherapistNFT on the `/therapist-test` page
3. **Test Kiosk Creation**: Create a kiosk on the `/sc-test` page  
4. **Test Wallet Service**: Use the marketplace page to verify therapist wallet functionality

## 🚨 Troubleshooting

### Common Issues:

1. **"Object not found" errors**: Ensure you're on the correct network (testnet vs mainnet)
2. **"Type mismatch" errors**: Verify your package ID is correctly configured
3. **"TransferPolicy not found"**: The TransferPolicy is created automatically when your package is published

### Debug Steps:

1. Check browser console for configuration logs
2. Verify wallet is connected and has SUI balance
3. Confirm you're using the correct network
4. Ensure smart contracts are deployed on the same network

## 📋 Summary

Your project is now fully configured to use your deployed smart contracts:

- ✅ **Package ID**: `0x4257be6ae1a26a4bc491ca2d4db672678c3c50bee810efa8e6c34cf3cfa135c3`
- ✅ **Network**: Testnet (configurable)
- ✅ **All function calls updated** to use your contracts
- ✅ **Type checking** ensures correct contract interactions
- ✅ **Centralized configuration** makes future updates easy
- ✅ **Wallet service integration** supports soulbound NFT minting

The integration is production-ready and all smart contract interactions will use your deployed package!
