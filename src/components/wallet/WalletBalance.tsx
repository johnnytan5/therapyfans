'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

export interface WalletBalanceProps {
  address?: string;
  balance?: string;
  isLoading?: boolean;
  error?: string | null;
}

export default function WalletBalance({ address, balance, isLoading = false, error }: WalletBalanceProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    if (!address) return;
    
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset copied state after 2 seconds
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Wallet Address</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={copyToClipboard}
          className="text-xs h-auto p-1 hover:bg-accent"
        >
          {copied ? (
            <span className="text-green-400">Copied!</span>
          ) : address ? (
            <span className="font-mono">{formatAddress(address)}</span>
          ) : (
            <span className="text-muted-foreground">No Address</span>
          )}
        </Button>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Balance</span>
        <span className="text-sm font-medium">
          {isLoading ? (
            <span className="animate-pulse text-blue-400">Loading...</span>
          ) : error ? (
            <span className="text-red-400 text-xs">Error</span>
          ) : (
            <span className="text-green-400">{`${balance || '0.0000'} SUI`}</span>
          )}
        </span>
      </div>
    </div>
  );
}
