// Example usage of getTherapistIdFromWallet function
// This file demonstrates how to use the function in your application

import { getTherapistIdFromWallet, verifyTherapistWallet, getTherapistNFTDetails } from './therapistWalletService';

/**
 * Example 1: Basic usage - Get therapist ID for soulbound NFT minting
 */
export async function basicUsageExample() {
  try {
    const therapistWalletAddress = '0xTherapistWalletAddress';
    
    // Get the therapist ID from their wallet's TherapistNFT
    const therapistId = await getTherapistIdFromWallet(therapistWalletAddress);
    console.log('Therapist ID:', therapistId);
    
    // Store for soulbound NFT minting reference
    const therapistIdForSoulbound = therapistId;
    console.log('Ready for soulbound minting:', therapistIdForSoulbound);
    
    return therapistId;
  } catch (error) {
    console.error('Error getting therapist ID:', error);
    throw error;
  }
}

/**
 * Example 2: Verify therapist setup before proceeding
 */
export async function verificationExample() {
  try {
    const therapistWalletAddress = '0xTherapistWalletAddress';
    
    // First verify the wallet has proper therapist setup
    const isValid = await verifyTherapistWallet(therapistWalletAddress);
    
    if (isValid) {
      console.log('✅ Therapist wallet is properly set up');
      // Proceed with getting the ID
      const therapistId = await getTherapistIdFromWallet(therapistWalletAddress);
      return { valid: true, therapistId };
    } else {
      console.log('❌ Therapist wallet is not properly set up');
      return { valid: false, therapistId: null };
    }
  } catch (error) {
    console.error('Error verifying therapist:', error);
    return { valid: false, therapistId: null };
  }
}

/**
 * Example 3: Get both ID and NFT details
 */
export async function detailedExample() {
  try {
    const therapistWalletAddress = '0xTherapistWalletAddress';
    
    // Get both the ID and detailed NFT information
    const { therapistId, nftDetails } = await getTherapistNFTDetails(therapistWalletAddress);
    
    console.log('Therapist ID:', therapistId);
    console.log('NFT Details:', {
      name: nftDetails.name,
      specialization: nftDetails.specialization,
      rating: nftDetails.rating,
      totalSessions: nftDetails.total_sessions,
      // ... other fields
    });
    
    return { therapistId, nftDetails };
  } catch (error) {
    console.error('Error getting therapist details:', error);
    throw error;
  }
}

/**
 * Example 4: Integration in a React component
 */
export function ReactComponentExample() {
  /*
  import { useState, useEffect } from 'react';
  import { getTherapistIdFromWallet } from '@/lib/therapistWalletService';
  
  export function TherapistProfile({ walletAddress }: { walletAddress: string }) {
    const [therapistId, setTherapistId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
      async function fetchTherapistId() {
        try {
          setLoading(true);
          const id = await getTherapistIdFromWallet(walletAddress);
          setTherapistId(id);
          
          // Store for soulbound NFT minting
          const therapistIdForSoulbound = id;
          console.log('Therapist ID ready for soulbound minting:', therapistIdForSoulbound);
          
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
          setLoading(false);
        }
      }
      
      if (walletAddress) {
        fetchTherapistId();
      }
    }, [walletAddress]);
    
    if (loading) return <div>Loading therapist ID...</div>;
    if (error) return <div>Error: {error}</div>;
    
    return (
      <div>
        <p>Therapist ID: {therapistId}</p>
        <p>Ready for soulbound NFT minting</p>
      </div>
    );
  }
  */
}

/**
 * Example 5: Error handling patterns
 */
export async function errorHandlingExample() {
  const therapistWalletAddress = '0xSomeAddress';
  
  try {
    const therapistId = await getTherapistIdFromWallet(therapistWalletAddress);
    return { success: true, therapistId };
  } catch (error) {
    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes('No KioskOwnerCap found')) {
        console.log('Therapist doesn\'t have a kiosk set up');
        return { success: false, error: 'NO_KIOSK' };
      } else if (error.message.includes('No TherapistNFT found')) {
        console.log('Therapist hasn\'t minted their NFT yet');
        return { success: false, error: 'NO_NFT' };
      } else if (error.message.includes('Invalid wallet address')) {
        console.log('Invalid wallet address format');
        return { success: false, error: 'INVALID_WALLET' };
      } else {
        console.log('Network or other error:', error.message);
        return { success: false, error: 'NETWORK_ERROR' };
      }
    }
    return { success: false, error: 'UNKNOWN_ERROR' };
  }
}
