'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo, useRef } from 'react';
import { useCurrentAccount, useCurrentWallet } from '@mysten/dapp-kit';
import { isEnokiWallet } from '@mysten/enoki';
import { ClientService } from '@/lib/clientService';
import { ClientProfile, WalletAuthContext } from '@/types';

const ClientAuthContext = createContext<WalletAuthContext | null>(null);

interface ClientAuthProviderProps {
  children: ReactNode;
}

/**
 * Client Authentication Provider
 * Manages client profile state based on wallet connection and zkLogin authentication
 */
export function ClientAuthProvider({ children }: ClientAuthProviderProps) {
  const currentAccount = useCurrentAccount();
  const currentWallet = useCurrentWallet();
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authProvider, setAuthProvider] = useState<'google' | 'facebook' | 'twitch' | null>(null);
  const lastWalletRef = useRef<string | null>(null);

  // Persist wallet connection state
  useEffect(() => {
    if (currentAccount?.address) {
      localStorage.setItem('devmatch_wallet_connected', 'true');
      localStorage.setItem('devmatch_wallet_address', currentAccount.address);
    } else {
      localStorage.removeItem('devmatch_wallet_connected');
      localStorage.removeItem('devmatch_wallet_address');
    }
  }, [currentAccount?.address]);

  // Check for persisted connection on mount
  useEffect(() => {
    const wasConnected = localStorage.getItem('devmatch_wallet_connected');
    const persistedAddress = localStorage.getItem('devmatch_wallet_address');
    
    if (wasConnected && persistedAddress && !currentAccount?.address) {
      console.log('🔄 Detected previous wallet connection, attempting to restore...');
      // The wallet SDK should handle reconnection automatically
    }
  }, [currentAccount?.address]);

  const handleWalletConnection = useCallback(async (walletAddress: string) => {
    setIsLoading(true);
    try {
      // Try to get existing client profile
      let profile = await ClientService.getClientByWalletAddress(walletAddress);
      
      if (profile) {
        // Update last login for existing client
        await ClientService.updateLastLogin(walletAddress);
        setClientProfile(profile);
        setAuthProvider(profile.auth_provider);
      } else {
        // Check if this is an Enoki wallet with zkLogin authentication
        if (currentWallet?.currentWallet && isEnokiWallet(currentWallet.currentWallet)) {
          // Try to automatically create profile for Enoki wallet
          await handleEnokiWalletRegistration(walletAddress, currentWallet.currentWallet);
        } else {
          // Regular wallet - no profile
          setClientProfile(null);
          setAuthProvider(null);
        }
      }
    } catch (error) {
      console.error('Error handling wallet connection:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentWallet]);

  const handleEnokiWalletRegistration = useCallback(async (walletAddress: string, wallet: any) => {
    try {
      // Extract provider from Enoki wallet
      let provider = wallet.provider as 'google' | 'facebook' | 'twitch';
      
      if (!provider) {
        console.warn('No provider found in Enoki wallet, trying to detect from wallet name');
        // Fallback: try to detect provider from wallet name or features
        const walletName = wallet.name?.toLowerCase() || '';
        if (walletName.includes('google')) {
          provider = 'google';
        } else if (walletName.includes('facebook')) {
          provider = 'facebook';
        } else if (walletName.includes('twitch')) {
          provider = 'twitch';
        } else {
          console.warn('Could not determine OAuth provider, defaulting to google');
          provider = 'google';
        }
      }

      // Generate a provider subject (in a real app, this would come from the OAuth token)
      // For now, we'll use a combination of provider and wallet address
      const providerSubject = `${provider}_${walletAddress.slice(-8)}`;

      console.log(`🔥 Auto-creating profile for ${provider} zkLogin wallet:`, walletAddress);
      console.log('Wallet details:', { name: wallet.name, provider: wallet.provider, features: wallet.features });

      // Create the client profile automatically
      const profile = await ClientService.getOrCreateClient(
        walletAddress,
        provider,
        providerSubject,
        undefined // No email initially
      );

      if (profile) {
        setClientProfile(profile);
        setAuthProvider(provider);
        console.log('✅ Client profile created successfully:', profile);
        
        // Show success message to user
        console.log(`🎉 Welcome! Your anonymous profile has been created with wallet: ${walletAddress.slice(0, 8)}...${walletAddress.slice(-4)}`);
      } else {
        console.error('❌ Failed to create client profile');
      }
    } catch (error) {
      console.error('💥 Error creating Enoki wallet profile:', error);
      // Don't throw - just log and continue without profile
    }
  }, []);

  /**
   * Create client profile after successful zkLogin authentication
   * This should be called from the wallet connection component after zkLogin
   */
  const createClientProfile = useCallback(async (
    provider: 'google' | 'facebook' | 'twitch',
    providerSubject: string,
    email?: string,
    displayName?: string
  ) => {
    if (!currentAccount?.address) {
      throw new Error('No wallet connected');
    }

    setIsLoading(true);
    try {
      const profile = await ClientService.getOrCreateClient(
        currentAccount.address,
        provider,
        providerSubject,
        email
      );

      if (profile && displayName && displayName !== profile.anon_display_name) {
        // Update display name if provided
        const updatedProfile = await ClientService.updateClient(
          currentAccount.address,
          { anon_display_name: displayName }
        );
        setClientProfile(updatedProfile || profile);
      } else {
        setClientProfile(profile);
      }

      setAuthProvider(provider);
      return profile;
    } catch (error) {
      console.error('Error creating client profile:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [currentAccount?.address]);

  /**
   * Update client profile
   */
  const updateClientProfile = useCallback(async (updates: {
    anon_display_name?: string;
    email?: string;
    timezone?: string;
    preferences?: string[];
    vibe_tags?: string[];
  }) => {
    if (!currentAccount?.address || !clientProfile) {
      throw new Error('No authenticated client');
    }

    setIsLoading(true);
    try {
      const updatedProfile = await ClientService.updateClient(
        currentAccount.address,
        updates
      );
      
      if (updatedProfile) {
        setClientProfile(updatedProfile);
      }
      
      return updatedProfile;
    } catch (error) {
      console.error('Error updating client profile:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [currentAccount?.address, clientProfile]);

  /**
   * Refresh client profile from database
   */
  const refreshClientProfile = useCallback(async () => {
    if (!currentAccount?.address) return;

    setIsLoading(true);
    try {
      const profile = await ClientService.getClientByWalletAddress(currentAccount.address);
      setClientProfile(profile);
    } catch (error) {
      console.error('Error refreshing client profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentAccount?.address]);

  // Effect to handle wallet connection changes
  useEffect(() => {
    // Add a small delay to prevent premature disconnection during route changes
    const connectionTimeout = setTimeout(() => {
      if (!currentAccount?.address) {
        // Wallet disconnected
        if (lastWalletRef.current) {
          console.log('🔌 Wallet disconnected, clearing profile');
          setClientProfile(null);
          setAuthProvider(null);
          lastWalletRef.current = null;
        }
        return;
      }

      // Only trigger if wallet address actually changed
      if (lastWalletRef.current !== currentAccount.address) {
        console.log('🔌 Wallet connected/changed:', currentAccount.address);
        lastWalletRef.current = currentAccount.address;
        // Wallet connected - fetch or create client profile
        handleWalletConnection(currentAccount.address);
      }
    }, 100); // 100ms delay to prevent race conditions during navigation

    return () => clearTimeout(connectionTimeout);
  }, [currentAccount?.address, handleWalletConnection]);

  const contextValue = useMemo(() => ({
    isConnected: !!currentAccount?.address,
    wallet_address: currentAccount?.address || null,
    auth_provider: authProvider,
    client_profile: clientProfile,
    isLoading,
    createClientProfile,
    updateClientProfile,
    refreshClientProfile,
  }), [
    currentAccount?.address,
    authProvider,
    clientProfile,
    isLoading,
    createClientProfile,
    updateClientProfile,
    refreshClientProfile
  ]);

  return (
    <ClientAuthContext.Provider value={contextValue}>
      {children}
    </ClientAuthContext.Provider>
  );
}

/**
 * Hook to use client authentication context
 */
export function useClientAuth() {
  const context = useContext(ClientAuthContext);
  if (!context) {
    throw new Error('useClientAuth must be used within a ClientAuthProvider');
  }
  return context;
}

/**
 * Hook to get current authenticated client profile
 */
export function useClientProfile() {
  const { client_profile, isLoading, wallet_address } = useClientAuth();
  return {
    client: client_profile,
    isLoading,
    isAuthenticated: !!client_profile && !!wallet_address,
    wallet_address,
  };
}