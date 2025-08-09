'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useClientAuth } from '@/components/providers/ClientAuthProvider';
import { VibeTag } from '@/components/therapy/VibeTag';
import { 
  Save, 
  User, 
  Mail, 
  Clock, 
  Tag, 
  Wallet,
  Shield,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const AVAILABLE_VIBE_TAGS = [
  'anxiety', 'depression', 'burnout', 'relationships', 'trauma', 'grief',
  'empathetic', 'direct', 'cognitive', 'mindfulness', 'spiritual', 'trauma-informed'
];

const TIMEZONE_OPTIONS = [
  'UTC-12', 'UTC-11', 'UTC-10', 'UTC-9', 'UTC-8', 'UTC-7', 'UTC-6', 
  'UTC-5', 'UTC-4', 'UTC-3', 'UTC-2', 'UTC-1', 'UTC', 'UTC+1', 
  'UTC+2', 'UTC+3', 'UTC+4', 'UTC+5', 'UTC+6', 'UTC+7', 'UTC+8', 
  'UTC+9', 'UTC+10', 'UTC+11', 'UTC+12'
];

interface ClientProfileSettingsProps {
  onClose?: () => void;
}

export function ClientProfileSettings({ onClose }: ClientProfileSettingsProps) {
  const { client_profile, updateClientProfile, isLoading, wallet_address } = useClientAuth();
  const [formData, setFormData] = useState({
    anon_display_name: client_profile?.anon_display_name || '',
    email: client_profile?.email || '',
    timezone: client_profile?.timezone || 'UTC',
    vibe_tags: client_profile?.vibe_tags || [],
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<'success' | 'error' | null>(null);

  if (!client_profile) {
    return (
      <Card className="border-0 glass border-glow">
        <CardContent className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Authentication Required
          </h3>
          <p className="text-muted-foreground">
            Please connect your wallet to access profile settings.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleTagToggle = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      vibe_tags: prev.vibe_tags.includes(tag)
        ? prev.vibe_tags.filter(t => t !== tag)
        : [...prev.vibe_tags, tag]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setUpdateStatus(null);

    try {
      await updateClientProfile({
        anon_display_name: formData.anon_display_name || null,
        email: formData.email || null,
        timezone: formData.timezone,
        vibe_tags: formData.vibe_tags,
      });
      
      setUpdateStatus('success');
      setTimeout(() => setUpdateStatus(null), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setUpdateStatus('error');
      setTimeout(() => setUpdateStatus(null), 3000);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Profile Settings</h2>
          <p className="text-muted-foreground">Manage your anonymous profile and preferences</p>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      {/* Wallet Info (Read-only) */}
      <Card className="border-0 glass border-glow hover:glow-blue transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Wallet Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 glass rounded-lg border border-blue-500/30 glow-blue">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-400">Connected Wallet</p>
                <p className="text-xs text-blue-300 font-mono mt-1">
                  {wallet_address?.slice(0, 8)}...{wallet_address?.slice(-6)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {client_profile.auth_provider} zkLogin
                </Badge>
                <Shield className="w-4 h-4 text-green-400" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Form */}
      <Card className="border-0 glass border-glow hover:glow-purple transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Display Name */}
            <div className="space-y-2">
              <label htmlFor="displayName" className="text-sm font-medium text-foreground">
                Anonymous Display Name
              </label>
              <Input
                id="displayName"
                type="text"
                value={formData.anon_display_name}
                onChange={(e) => setFormData(prev => ({ ...prev, anon_display_name: e.target.value }))}
                placeholder="Enter your anonymous display name"
                className="glass border-glow"
              />
              <p className="text-xs text-muted-foreground">
                This name will be visible to therapists during sessions
              </p>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email (Optional)
              </label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter your email for notifications"
                className="glass border-glow"
              />
              <p className="text-xs text-muted-foreground">
                Used for session reminders and important updates
              </p>
            </div>

            {/* Timezone */}
            <div className="space-y-2">
              <label htmlFor="timezone" className="text-sm font-medium text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Timezone
              </label>
              <select
                id="timezone"
                value={formData.timezone}
                onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                className="w-full px-3 py-2 glass border-glow rounded-md bg-background text-foreground"
              >
                {TIMEZONE_OPTIONS.map(tz => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Helps therapists schedule sessions at convenient times
              </p>
            </div>

            {/* Vibe Tags */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Therapy Preferences & Needs
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {AVAILABLE_VIBE_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    className={`p-2 rounded-lg border transition-all duration-200 text-sm ${
                      formData.vibe_tags.includes(tag)
                        ? 'border-purple-500 bg-purple-500/20 text-purple-300 glow-purple'
                        : 'border-border hover:border-purple-500/50 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Select tags that match your therapy needs or preferred therapist styles
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex items-center gap-4 pt-4">
              <Button
                type="submit"
                disabled={isUpdating}
                className="border-glow hover:glow-purple transition-all duration-200"
              >
                {isUpdating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>

              {updateStatus === 'success' && (
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Profile updated successfully!</span>
                </div>
              )}

              {updateStatus === 'error' && (
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Failed to update profile. Please try again.</span>
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Account Stats */}
      <Card className="border-0 glass border-glow hover:glow-cyan transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-lg">Account Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 glass rounded-lg border border-blue-500/30">
              <div className="text-lg font-bold text-blue-400">{client_profile.total_sessions}</div>
              <div className="text-xs text-blue-300">Sessions</div>
            </div>
            <div className="text-center p-3 glass rounded-lg border border-purple-500/30">
              <div className="text-lg font-bold text-purple-400">{client_profile.total_spent_sui.toFixed(2)}</div>
              <div className="text-xs text-purple-300">SUI Spent</div>
            </div>
            <div className="text-center p-3 glass rounded-lg border border-green-500/30">
              <div className="text-lg font-bold text-green-400">
                {client_profile.is_verified ? 'Yes' : 'No'}
              </div>
              <div className="text-xs text-green-300">Verified</div>
            </div>
            <div className="text-center p-3 glass rounded-lg border border-cyan-500/30">
              <div className="text-lg font-bold text-cyan-400">
                {new Date(client_profile.created_at).toLocaleDateString()}
              </div>
              <div className="text-xs text-cyan-300">Member Since</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}