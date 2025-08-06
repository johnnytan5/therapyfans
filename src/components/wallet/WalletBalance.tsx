'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

export interface WalletBalanceProps {
  address?: string;
  balance?: string;
}

export default function WalletBalance({ address, balance }: WalletBalanceProps) {
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
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Wallet Address</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className="text-sm"
          >
            {copied ? 'Copied!' : address ? formatAddress(address) : 'No Address'}
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Balance</span>
          <span className="font-medium text-green-400">
            {balance || '0.00'} SUI
          </span>
        </div>
      </div>
    </Card>
  );
}
