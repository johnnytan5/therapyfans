/**
 * Centralized Sui Network and Smart Contract Configuration
 * This file contains all the constants needed for interacting with your deployed smart contracts
 */

// Your deployed package ID
export const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID;
// Network configuration
export const NETWORK = process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet";

// Smart contract module paths
export const SMART_CONTRACT_MODULES = {
  therapistNft: `${PACKAGE_ID}::therapist_nft`,
  nftRental: `${PACKAGE_ID}::nft_rental`,
} as const;

// Smart contract function targets
export const CONTRACT_FUNCTIONS = {
  // TherapistNFT functions
  mintTherapistNft: `${SMART_CONTRACT_MODULES.therapistNft}::mint`,
  updateRating: `${SMART_CONTRACT_MODULES.therapistNft}::update_rating`,
  incrementSessions: `${SMART_CONTRACT_MODULES.therapistNft}::increment_sessions`,
  updateBio: `${SMART_CONTRACT_MODULES.therapistNft}::update_bio`,
  updateProfileImage: `${SMART_CONTRACT_MODULES.therapistNft}::update_profile_image`,
  
  // NFT Rental/Kiosk functions
  newKiosk: `${SMART_CONTRACT_MODULES.nftRental}::new_kiosk`,
  listForSale: `${SMART_CONTRACT_MODULES.nftRental}::list_for_sale`,
  buy: `${SMART_CONTRACT_MODULES.nftRental}::buy`,
  
  // Booking Proof functions
  mintBookingProof: `${PACKAGE_ID}::booking_proof::mint_booking_proof`,
  mintBookingProofById: `${PACKAGE_ID}::booking_proof::mint_booking_proof_by_id`,
} as const;

// Type definitions for on-chain objects
export const SUI_TYPES = {
  therapistNft: `${PACKAGE_ID}::therapist_nft::TherapistNFT`,
  kioskOwnerCap: `::kiosk::KioskOwnerCap`,
  transferPolicy: `0x2::transfer_policy::TransferPolicy<${PACKAGE_ID}::therapist_nft::TherapistNFT>`,
} as const;

// Network URLs and explorer
export const NETWORK_CONFIG = {
  testnet: {
    rpcUrl: "https://fullnode.testnet.sui.io:443",
    explorerUrl: "https://suiscan.xyz/testnet",
    faucetUrl: "https://faucet.testnet.sui.io/",
  },
  mainnet: {
    rpcUrl: "https://fullnode.mainnet.sui.io:443", 
    explorerUrl: "https://suiscan.xyz/mainnet",
    faucetUrl: null,
  },
} as const;

// Get current network configuration
export const getCurrentNetworkConfig = () => {
  return NETWORK_CONFIG[NETWORK as keyof typeof NETWORK_CONFIG] || NETWORK_CONFIG.testnet;
};

// Validation helpers
export function isValidPackageId(packageId: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(packageId);
}

export function isValidObjectId(objectId: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(objectId);
}

// Price constants (in MIST)
export const PRICING = {
  thirtyMinuteSession: 5_000_000_000, // 5 SUI
  oneHourSession: 10_000_000_000,     // 10 SUI
} as const;

// Validate package ID on import
if (!isValidPackageId(PACKAGE_ID)) {
  console.warn(`⚠️ Invalid package ID format: ${PACKAGE_ID}`);
}

console.log(`🔧 Sui Configuration loaded:`, {
  packageId: PACKAGE_ID,
  network: NETWORK,
  explorerUrl: getCurrentNetworkConfig().explorerUrl,
});

export default {
  PACKAGE_ID,
  NETWORK,
  SMART_CONTRACT_MODULES,
  CONTRACT_FUNCTIONS,
  SUI_TYPES,
  NETWORK_CONFIG,
  getCurrentNetworkConfig,
  isValidPackageId,
  isValidObjectId,
  PRICING,
};
