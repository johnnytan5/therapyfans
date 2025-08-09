'use client';

import { useState, useEffect, useRef } from 'react';
import { useConnectWallet, useCurrentAccount, useWallets, useDisconnectWallet } from '@mysten/dapp-kit';
import { isEnokiWallet, EnokiWallet, AuthProvider } from '@mysten/enoki';
import { useClientAuth } from '@/components/providers/ClientAuthProvider';
import { CreateProfileModal } from '@/components/client/CreateProfileModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import WalletBalance from './WalletBalance';
import { 
  Wallet,
  ChevronDown,
  LogOut,
  User,
  Settings,
  HelpCircle,
  CheckCircle,
  AlertCircle,
  Plus
} from 'lucide-react';

/**
 * Enhanced Enoki Wallet Connection Component
 * Automatically creates Supabase profiles when users connect via zkLogin
 */
export function EnokiWalletConnect() {
  const currentAccount = useCurrentAccount();
  const { mutate: connect } = useConnectWallet();
  const { mutate: disconnect } = useDisconnectWallet();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'success' | 'error' | null>(null);
  const [showCreateProfileModal, setShowCreateProfileModal] = useState(false);
  
  const { client_profile, isLoading: isLoadingProfile, createClientProfile } = useClientAuth();
  
  // Stabilize profile status to prevent flickering
  const [stableProfileStatus, setStableProfileStatus] = useState<'loading' | 'found' | 'not-found'>('loading');
  const stabilityTimeoutRef = useRef<NodeJS.Timeout>();

  // Debug: Track profile state changes
  console.log('🔄 EnokiWalletConnect render:', {
    currentAccount: !!currentAccount?.address,
    client_profile: !!client_profile,
    isLoadingProfile,
    stableProfileStatus,
    walletAddress: currentAccount?.address?.slice(0, 8) + '...'
  });

  // Stabilize profile status with debouncing
  useEffect(() => {
    if (stabilityTimeoutRef.current) {
      clearTimeout(stabilityTimeoutRef.current);
    }

    stabilityTimeoutRef.current = setTimeout(() => {
      if (isLoadingProfile) {
        setStableProfileStatus('loading');
      } else if (client_profile) {
        setStableProfileStatus('found');
      } else {
        setStableProfileStatus('not-found');
      }
    }, 100); // 100ms debounce

    return () => {
      if (stabilityTimeoutRef.current) {
        clearTimeout(stabilityTimeoutRef.current);
      }
    };
  }, [isLoadingProfile, client_profile]);

  const wallets = useWallets().filter(isEnokiWallet);
  const walletsByProvider = wallets.reduce(
    (map, wallet) => map.set(wallet.provider, wallet),
    new Map<AuthProvider, EnokiWallet>(),
  );

  const googleWallet = walletsByProvider.get('google');
  const facebookWallet = walletsByProvider.get('facebook');
  const twitchWallet = walletsByProvider.get('twitch');

  const handleWalletConnect = async (wallet: EnokiWallet, provider: 'google' | 'facebook' | 'twitch') => {
    setIsConnecting(true);
    setConnectionStatus(null);
    
    try {
      console.log(`Connecting to ${provider} wallet...`);
      
      // Connect the wallet (this will trigger the OAuth flow)
      connect({ wallet });
      
      // The ClientAuthProvider will automatically handle profile creation
      // when it detects the new Enoki wallet connection
      
      setConnectionStatus('success');
      setIsDropdownOpen(false);
      
      setTimeout(() => setConnectionStatus(null), 3000);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setConnectionStatus('error');
      setTimeout(() => setConnectionStatus(null), 3000);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setIsDropdownOpen(false);
  };

  if (currentAccount) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-3 px-4 py-2 rounded-lg border border-border hover:bg-accent transition-all duration-200 group"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {client_profile?.anon_display_name || 'Anonymous User'}
              </span>
              {client_profile?.auth_provider && (
                <Badge variant="secondary" className="text-xs">
                  {client_profile.auth_provider}
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {currentAccount.address.slice(0, 6)}...{currentAccount.address.slice(-4)}
            </span>
          </div>
          
          <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>

        {isDropdownOpen && (
          <>
            <div className="absolute top-full left-0 mt-2 w-80 bg-background border border-border rounded-lg shadow-lg z-50 p-4">
              {/* Profile Section */}
              <div className="space-y-3 pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {client_profile?.anon_display_name || 'Anonymous User'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {currentAccount.address.slice(0, 8)}...{currentAccount.address.slice(-6)}
                    </p>
                  </div>
                </div>

                {/* Profile Status */}
                {stableProfileStatus === 'loading' ? (
                  <div className="flex items-center gap-2 text-blue-400">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400" />
                    <span className="text-xs">Loading profile...</span>
                  </div>
                ) : stableProfileStatus === 'found' ? (
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="w-3 h-3" />
                    <span className="text-xs">Profile synced to database</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-yellow-400">
                      <AlertCircle className="w-3 h-3" />
                      <span className="text-xs">No profile found</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setShowCreateProfileModal(true)}
                      className="w-full text-xs border-glow hover:glow-purple"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Create Profile
                    </Button>
                  </div>
                )}

                {/* Wallet Balance */}
                <WalletBalance />
              </div>

              {/* Profile Stats */}
              {client_profile && (
                <div className="py-3 border-b border-border">
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-2 glass rounded border border-blue-500/30">
                      <div className="text-sm font-bold text-blue-400">
                        {client_profile.total_sessions}
                      </div>
                      <div className="text-xs text-blue-300">Sessions</div>
                    </div>
                    <div className="p-2 glass rounded border border-purple-500/30">
                      <div className="text-sm font-bold text-purple-400">
                        {client_profile.total_spent_sui.toFixed(2)}
                      </div>
                      <div className="text-xs text-purple-300">SUI Spent</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-3 space-y-2">
                <button
                  onClick={() => {
                    if (client_profile?.wallet_address) {
                      window.location.href = `/client/${encodeURIComponent(client_profile.wallet_address)}`;
                    }
                  }}
                  disabled={!client_profile?.wallet_address}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-all duration-200 disabled:opacity-50"
                >
                  <User className="w-4 h-4" />
                  <span>View Profile</span>
                </button>

                <button
                  onClick={() => {
                    // Open profile settings (you can implement this as a modal)
                    console.log('Open profile settings');
                    setIsDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-all duration-200"
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>

                <button
                  onClick={handleDisconnect}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-all duration-200 text-red-400"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Disconnect</span>
                </button>
              </div>
            </div>
            
            {/* Click outside to close */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsDropdownOpen(false)}
            />
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <Button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        variant="outline"
        disabled={isConnecting}
        className="border-glow hover:glow-purple transition-all duration-200"
      >
        {isConnecting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            Connecting...
          </>
        ) : (
          <>
            <Wallet className="w-4 h-4 mr-2" />
            Connect Wallet
          </>
        )}
      </Button>

      {/* Connection Status */}
      {connectionStatus === 'success' && (
        <div className="absolute top-full left-0 mt-2 flex items-center gap-2 text-green-400 text-sm">
          <CheckCircle className="w-4 h-4" />
          <span>Connected successfully!</span>
        </div>
      )}

      {connectionStatus === 'error' && (
        <div className="absolute top-full left-0 mt-2 flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>Connection failed. Please try again.</span>
        </div>
      )}

      {isDropdownOpen && !currentAccount && (
        <>
          <div className="absolute top-full left-0 mt-2 w-72 bg-background border border-border rounded-lg shadow-lg z-50 p-4">
            <div className="space-y-3">
              <div className="text-center pb-3 border-b border-border">
                <h3 className="font-semibold text-foreground">Connect with zkLogin</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Anonymous authentication with automatic profile creation
                </p>
              </div>

              {googleWallet && (
                <button
                  onClick={() => handleWalletConnect(googleWallet, 'google')}
                  disabled={isConnecting}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border hover:bg-accent transition-all duration-200 group disabled:opacity-50"
                >
                  <div className="w-5 h-5 bg-white rounded flex items-center justify-center text-black text-xs font-bold">
                    G
                  </div>
                  <span className="flex-1 text-left">Sign in with Google</span>
                </button>
              )}

              {facebookWallet && (
                <button
                  onClick={() => handleWalletConnect(facebookWallet, 'facebook')}
                  disabled={isConnecting}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border hover:bg-accent transition-all duration-200 group disabled:opacity-50"
                >
                  <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
                    f
                  </div>
                  <span className="flex-1 text-left">Sign in with Facebook</span>
                </button>
              )}

              {twitchWallet && (
                <button
                  onClick={() => handleWalletConnect(twitchWallet, 'twitch')}
                  disabled={isConnecting}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border hover:bg-accent transition-all duration-200 group disabled:opacity-50"
                >
                  <div className="w-5 h-5 bg-purple-600 rounded flex items-center justify-center text-white text-xs font-bold">
                    T
                  </div>
                  <span className="flex-1 text-left">Sign in with Twitch</span>
                </button>
              )}
            </div>

            <div className="text-xs text-muted-foreground pt-3 border-t border-border text-center">
              <div className="flex items-center gap-2 justify-center mb-2">
                <CheckCircle className="w-3 h-3 text-green-400" />
                <span>Automatic profile creation</span>
              </div>
              <p>Your wallet address will be stored securely in our database for session tracking and preferences.</p>
            </div>
          </div>
          
          {/* Click outside to close */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsDropdownOpen(false)}
          />
        </>
      )}
      
      {/* Create Profile Modal */}
      <CreateProfileModal
        isOpen={showCreateProfileModal}
        onClose={() => setShowCreateProfileModal(false)}
        onSuccess={() => {
          setShowCreateProfileModal(false);
          // Refresh the profile data
          window.location.reload();
        }}
      />
    </div>
  );
}