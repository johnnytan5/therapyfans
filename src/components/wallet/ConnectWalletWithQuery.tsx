'use client';

import { useState } from 'react';
import { useConnectWallet, useCurrentAccount, useWallets, useDisconnectWallet, useSuiClientQuery } from '@mysten/dapp-kit';
import { isEnokiWallet, EnokiWallet, AuthProvider } from '@mysten/enoki';
import WalletBalance from './WalletBalance';
import { type EnokiWallet as EnokiWalletType } from '@mysten/enoki';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet,
  ChevronDown,
  LogOut,
  User,
  Settings,
  HelpCircle
} from 'lucide-react';
import { cn, mistToSui } from '@/lib/utils';

/**
 * Alternative implementation using useSuiClientQuery hook
 * This provides better caching and React Query integration
 */
export function ConnectWalletWithQuery() {
  const currentAccount = useCurrentAccount();
  const { mutate: connect } = useConnectWallet();
  const { mutate: disconnect } = useDisconnectWallet();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Using useSuiClientQuery for better caching and error handling
  const { data: balanceData, isLoading: isLoadingBalance, error: balanceError, refetch } = useSuiClientQuery(
    'getBalance',
    {
      owner: currentAccount?.address || '',
    },
    {
      enabled: !!currentAccount?.address,
      refetchInterval: 10000, // Refetch every 10 seconds
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    }
  );

  // Convert MIST to SUI
  const balance = balanceData ? mistToSui(balanceData.totalBalance).toFixed(4) : '0.0000';
  const balanceErrorMessage = balanceError ? 'Failed to fetch balance' : null;

  const wallets = useWallets().filter(isEnokiWallet);
  const walletsByProvider = wallets.reduce(
    (map, wallet) => map.set(wallet.provider, wallet),
    new Map<AuthProvider, EnokiWalletType>(),
  );

  const googleWallet = walletsByProvider.get('google');
  const facebookWallet = walletsByProvider.get('facebook');
  const twitchWallet = walletsByProvider.get('twitch');

  // If wallet is connected, show user dropdown
  if (currentAccount) {
    return (
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "flex items-center gap-2 border-green-500/30 hover:border-green-500/50 hover:glow-green transition-all duration-200",
            isDropdownOpen && "border-green-500/50 glow-green"
          )}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="font-medium">
            {currentAccount.address.slice(0, 6)}...{currentAccount.address.slice(-4)}
          </span>
          <Badge variant="secondary" className="text-xs">
            {balance} SUI
          </Badge>
          <ChevronDown className="w-3 h-3" />
        </Button>

        {isDropdownOpen && (
          <>
            <div className="absolute right-0 mt-2 w-64 glass rounded-lg shadow-lg border border-border p-2 space-y-1">
              <div className="p-2">
                <WalletBalance 
                  address={currentAccount.address}
                  balance={balance}
                  isLoading={isLoadingBalance}
                  error={balanceErrorMessage}
                />
                
                {/* Manual refresh button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2 text-xs"
                  onClick={() => refetch()}
                  disabled={isLoadingBalance}
                >
                  {isLoadingBalance ? 'Refreshing...' : 'Refresh Balance'}
                </Button>
              </div>
              
              <button className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors w-full text-left">
                <User className="w-4 h-4" />
                <span>My Profile</span>
              </button>
              
              <button className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors w-full text-left">
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
              
              <button className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors w-full text-left">
                <HelpCircle className="w-4 h-4" />
                <span>Help & Support</span>
              </button>
              
              <hr className="border-border my-2" />
              
              <button 
                onClick={() => {
                  disconnect();
                  setIsDropdownOpen(false);
                }}
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors text-red-400 w-full text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Disconnect</span>
              </button>
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

  // If wallet is not connected, show connect options
  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-2 border-purple-500/30 hover:border-purple-500/50 hover:glow-purple transition-all duration-200"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <Wallet className="w-4 h-4" />
        <span>Connect Wallet</span>
        <ChevronDown className="w-3 h-3" />
      </Button>

      {isDropdownOpen && (
        <>
          <div className="absolute right-0 mt-2 w-64 glass rounded-lg shadow-lg border border-border p-4 space-y-3">
            <div className="text-sm font-medium text-foreground mb-3">
              Connect with Social Login
            </div>
            
            {googleWallet && (
              <Button
                variant="outline"
                className="w-full justify-start gap-3 hover:bg-accent"
                onClick={() => {
                  connect({ wallet: googleWallet });
                  setIsDropdownOpen(false);
                }}
              >
                <div className="w-5 h-5 bg-red-500 rounded flex items-center justify-center text-white text-xs font-bold">
                  G
                </div>
                <span>Continue with Google</span>
              </Button>
            )}

            {facebookWallet && (
              <Button
                variant="outline"
                className="w-full justify-start gap-3 hover:bg-accent"
                onClick={() => {
                  connect({ wallet: facebookWallet });
                  setIsDropdownOpen(false);
                }}
              >
                <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
                  f
                </div>
                <span>Continue with Facebook</span>
              </Button>
            )}

            {twitchWallet && (
              <Button
                variant="outline"
                className="w-full justify-start gap-3 hover:bg-accent"
                onClick={() => {
                  connect({ wallet: twitchWallet });
                  setIsDropdownOpen(false);
                }}
              >
                <div className="w-5 h-5 bg-purple-600 rounded flex items-center justify-center text-white text-xs font-bold">
                  T
                </div>
                <span>Continue with Twitch</span>
              </Button>
            )}
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