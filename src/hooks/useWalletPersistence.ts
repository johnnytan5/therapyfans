import { useEffect, useCallback } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';

/**
 * Hook to help maintain wallet connection across page navigation
 */
export function useWalletPersistence() {
  const currentAccount = useCurrentAccount();

  // Monitor wallet connection state
  const isConnected = !!currentAccount?.address;
  const walletAddress = currentAccount?.address || null;

  // Persist connection state to prevent logout during navigation
  useEffect(() => {
    if (isConnected && walletAddress) {
      // Store connection state
      sessionStorage.setItem('wallet_connection_active', 'true');
      sessionStorage.setItem('wallet_last_seen', Date.now().toString());
      
      console.log('💾 Wallet connection persisted:', walletAddress.slice(0, 8) + '...');
    } else {
      // Clear connection state
      sessionStorage.removeItem('wallet_connection_active');
      sessionStorage.removeItem('wallet_last_seen');
      
      if (walletAddress === null) {
        console.log('🔌 Wallet disconnected, clearing persistence');
      }
    }
  }, [isConnected, walletAddress]);

  // Check if wallet was recently connected (within last 30 seconds)
  const wasRecentlyConnected = useCallback(() => {
    const wasActive = sessionStorage.getItem('wallet_connection_active');
    const lastSeen = sessionStorage.getItem('wallet_last_seen');
    
    if (!wasActive || !lastSeen) return false;
    
    const timeSinceLastSeen = Date.now() - parseInt(lastSeen);
    return timeSinceLastSeen < 30000; // 30 seconds
  }, []);

  // Clear stale connection data
  useEffect(() => {
    const interval = setInterval(() => {
      const lastSeen = sessionStorage.getItem('wallet_last_seen');
      if (lastSeen) {
        const timeSinceLastSeen = Date.now() - parseInt(lastSeen);
        // Clear after 5 minutes of inactivity
        if (timeSinceLastSeen > 5 * 60 * 1000) {
          sessionStorage.removeItem('wallet_connection_active');
          sessionStorage.removeItem('wallet_last_seen');
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return {
    isConnected,
    walletAddress,
    wasRecentlyConnected,
  };
}