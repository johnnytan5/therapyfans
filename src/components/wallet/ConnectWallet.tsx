'use client';

import { useState, useEffect } from 'react';
import { useConnectWallet, useCurrentAccount, useWallets, useDisconnectWallet, useSuiClient } from '@mysten/dapp-kit';
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
import { cn } from '@/lib/utils';

export function ConnectWallet() {
  const currentAccount = useCurrentAccount();
  const { mutate: connect } = useConnectWallet();
  const { mutate: disconnect } = useDisconnectWallet();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [balance, setBalance] = useState('0.00');
  const suiClient = useSuiClient();

  useEffect(() => {
    async function getBalance() {
      if (currentAccount) {
        try {
          const { totalBalance } = await suiClient.getBalance({
            owner: currentAccount.address,
          });
          setBalance(totalBalance);
        } catch (error) {
          console.error('Failed to fetch balance:', error);
          setBalance('0.00');
        }
      }
    }
    
    getBalance();
  }, [currentAccount, suiClient]);

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
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 border-glow hover:glow-blue transition-all duration-200"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <User className="w-4 h-4" />
          <span className="hidden sm:inline text-sm">
            {currentAccount.address.slice(0, 6)}...{currentAccount.address.slice(-4)}
          </span>
          <ChevronDown className="w-3 h-3" />
        </Button>

        {isDropdownOpen && (
          <>
            <div className="absolute right-0 mt-2 w-64 glass rounded-lg shadow-lg border border-border p-2 space-y-1">
              <div className="p-2">
                <WalletBalance 
                  address={currentAccount.address}
                  balance={balance}
                />
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
            <div className="text-sm font-medium mb-3">Sign in with your preferred method:</div>
            
            <div className="space-y-2">
              {googleWallet && (
                <button
                  onClick={() => {
                    connect({ wallet: googleWallet });
                    setIsDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border hover:bg-accent transition-all duration-200 group"
                >
                  <div className="w-5 h-5 bg-red-500 rounded flex items-center justify-center text-white text-xs font-bold">
                    G
                  </div>
                  <span className="flex-1 text-left">Sign in with Google</span>
                </button>
              )}

              {facebookWallet && (
                <button
                  onClick={() => {
                    connect({ wallet: facebookWallet });
                    setIsDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border hover:bg-accent transition-all duration-200 group"
                >
                  <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
                    f
                  </div>
                  <span className="flex-1 text-left">Sign in with Facebook</span>
                </button>
              )}

              {twitchWallet && (
                <button
                  onClick={() => {
                    connect({ wallet: twitchWallet });
                    setIsDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border hover:bg-accent transition-all duration-200 group"
                >
                  <div className="w-5 h-5 bg-purple-600 rounded flex items-center justify-center text-white text-xs font-bold">
                    T
                  </div>
                  <span className="flex-1 text-left">Sign in with Twitch</span>
                </button>
              )}
            </div>

            <div className="text-xs text-muted-foreground pt-2 border-t border-border">
              Secure authentication powered by Enoki zkLogin
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