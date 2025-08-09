'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useClientAuth } from '@/components/providers/ClientAuthProvider';
import { useCurrentAccount, useCurrentWallet } from '@mysten/dapp-kit';
import { isEnokiWallet } from '@mysten/enoki';
import { 
  User, 
  Wallet,
  CheckCircle,
  AlertCircle,
  Loader2,
  Shield
} from 'lucide-react';

interface CreateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateProfileModal({ isOpen, onClose, onSuccess }: CreateProfileModalProps) {
  const currentAccount = useCurrentAccount();
  const currentWallet = useCurrentWallet();
  const { createClientProfile, isLoading } = useClientAuth();
  
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
  });
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentAccount?.address || !currentWallet) {
      setError('Please connect your wallet first');
      return;
    }

    if (!isEnokiWallet(currentWallet)) {
      setError('Only Enoki zkLogin wallets are supported for profile creation');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // Detect provider from Enoki wallet
      let provider = currentWallet.provider as 'google' | 'facebook' | 'twitch';
      
      if (!provider) {
        // Fallback detection
        const walletName = currentWallet.name?.toLowerCase() || '';
        if (walletName.includes('google')) {
          provider = 'google';
        } else if (walletName.includes('facebook')) {
          provider = 'facebook';
        } else if (walletName.includes('twitch')) {
          provider = 'twitch';
        } else {
          provider = 'google'; // Default
        }
      }

      console.log('🚀 Creating profile with:', {
        wallet: currentAccount.address,
        provider,
        displayName: formData.displayName,
        email: formData.email
      });

      // Generate provider subject
      const providerSubject = `${provider}_${currentAccount.address.slice(-8)}`;

      // Create profile
      const profile = await createClientProfile(
        provider,
        providerSubject,
        formData.email || undefined,
        formData.displayName || undefined
      );

      if (profile) {
        console.log('✅ Profile created successfully:', profile);
        onSuccess?.();
        onClose();
      } else {
        setError('Failed to create profile. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error creating profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to create profile');
    } finally {
      setIsCreating(false);
    }
  };

  const walletProvider = currentWallet && isEnokiWallet(currentWallet) 
    ? currentWallet.provider || 'unknown'
    : 'not-enoki';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 glass border-glow">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-xl">Create Your Anonymous Profile</CardTitle>
          <p className="text-sm text-muted-foreground">
            Set up your therapy profile with complete privacy
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Wallet Info */}
          <div className="p-3 glass rounded-lg border border-blue-500/30 glow-blue">
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <Wallet className="w-4 h-4" />
              <span className="text-sm font-medium">Connected Wallet</span>
            </div>
            <p className="text-xs text-blue-300 font-mono">
              {currentAccount?.address?.slice(0, 8)}...{currentAccount?.address?.slice(-6)}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {walletProvider} zkLogin
              </Badge>
              {isEnokiWallet(currentWallet) ? (
                <div className="flex items-center gap-1 text-green-400">
                  <CheckCircle className="w-3 h-3" />
                  <span className="text-xs">Supported</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-400">
                  <AlertCircle className="w-3 h-3" />
                  <span className="text-xs">Not Supported</span>
                </div>
              )}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleCreateProfile} className="space-y-4">
            {/* Display Name */}
            <div className="space-y-2">
              <label htmlFor="displayName" className="text-sm font-medium">
                Anonymous Display Name (Optional)
              </label>
              <Input
                id="displayName"
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="Leave blank for auto-generated name"
                className="glass border-glow"
              />
              <p className="text-xs text-muted-foreground">
                This will be shown to therapists during sessions
              </p>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email (Optional)
              </label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="For session reminders only"
                className="glass border-glow"
              />
              <p className="text-xs text-muted-foreground">
                Used only for notifications, never shared
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-3 glass rounded-lg border border-red-500/30 glow-red">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}

            {/* Privacy Notice */}
            <div className="p-3 glass rounded-lg border border-purple-500/30 glow-purple">
              <div className="flex items-center gap-2 text-purple-400 mb-2">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">Privacy Guarantee</span>
              </div>
              <ul className="text-xs text-purple-300 space-y-1">
                <li>• Only your wallet address identifies you</li>
                <li>• No personal information is stored</li>
                <li>• Complete anonymity in all sessions</li>
                <li>• Data encrypted and secured</li>
              </ul>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isCreating}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreating || !isEnokiWallet(currentWallet)}
                className="flex-1 border-glow hover:glow-purple"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Profile'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}