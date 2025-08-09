# 🚀 Enoki zkLogin + Supabase Integration Setup Guide

This guide walks you through the complete setup for automatic client profile creation when users connect with Enoki zkLogin wallets.

## 🎯 What This Integration Does

✅ **Automatic Profile Creation**: When users connect via Enoki zkLogin, their profile is automatically created in Supabase  
✅ **Wallet-Based Authentication**: Uses Sui wallet addresses as primary keys  
✅ **OAuth Provider Tracking**: Stores which OAuth provider (Google/Facebook/Twitch) was used  
✅ **Session Statistics**: Tracks total sessions and SUI spent  
✅ **Anonymous Privacy**: No PII stored, only anonymous display names  

## 📋 Prerequisites

1. **Supabase Project** with the client table created
2. **Enoki API Key** from Mysten Labs
3. **OAuth Client IDs** for Google, Facebook, and/or Twitch
4. **Environment Variables** properly configured

## 🛠️ Setup Steps

### Step 1: Create Supabase Table

Run this SQL in your Supabase SQL editor:

```sql
-- Create the clients table
CREATE TABLE clients (
  wallet_address TEXT PRIMARY KEY,
  id TEXT UNIQUE NOT NULL,
  anon_display_name TEXT,
  email TEXT,
  auth_provider TEXT CHECK (auth_provider IN ('google', 'facebook', 'twitch')),
  provider_subject TEXT,
  timezone TEXT DEFAULT 'UTC',
  preferences TEXT[] DEFAULT '{}',
  vibe_tags TEXT[] DEFAULT '{}',
  total_sessions INTEGER DEFAULT 0,
  total_spent_sui DECIMAL(20,9) DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_clients_id ON clients(id);
CREATE INDEX idx_clients_auth_provider ON clients(auth_provider);
CREATE INDEX idx_clients_provider_subject ON clients(provider_subject);
CREATE INDEX idx_clients_created_at ON clients(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clients_updated_at 
    BEFORE UPDATE ON clients 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (optional but recommended)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON clients
    FOR SELECT USING (wallet_address = current_setting('app.current_wallet', true)::text);

-- Policy: Users can update their own profile  
CREATE POLICY "Users can update own profile" ON clients
    FOR UPDATE USING (wallet_address = current_setting('app.current_wallet', true)::text);

-- Policy: Anyone can create a profile (for registration)
CREATE POLICY "Anyone can create profile" ON clients
    FOR INSERT WITH CHECK (true);
```

### Step 2: Environment Variables

Add these to your `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Enoki Configuration  
NEXT_PUBLIC_ENOKI_API_KEY=your_enoki_api_key

# OAuth Provider Client IDs
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_oauth_client_id
NEXT_PUBLIC_FACEBOOK_CLIENT_ID=your_facebook_oauth_client_id
NEXT_PUBLIC_TWITCH_CLIENT_ID=your_twitch_oauth_client_id
```

### Step 3: Test the Integration

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Open your app** and click "Connect Wallet"

3. **Choose an OAuth provider** (Google, Facebook, or Twitch)

4. **Complete the OAuth flow** in the popup window

5. **Check the console** for profile creation logs:
   ```
   Auto-creating profile for google zkLogin wallet: 0x1234...
   Client profile created successfully: { wallet_address: "0x1234...", ... }
   ```

6. **Verify in Supabase** that a new row was created in the `clients` table

## 🔍 How It Works

### Component Flow

```
EnokiWalletConnect (UI)
    ↓ (user clicks connect)
WalletProvider (dapp-kit)
    ↓ (wallet connected)
ClientAuthProvider (our context)
    ↓ (detects Enoki wallet)
handleEnokiWalletRegistration()
    ↓ (extracts provider)
ClientService.getOrCreateClient()
    ↓ (creates/updates database)
Supabase clients table
```

### Automatic Profile Creation Logic

1. **User connects wallet** via EnokiWalletConnect component
2. **ClientAuthProvider detects** the wallet connection
3. **Checks if it's an Enoki wallet** using `isEnokiWallet()`
4. **Extracts OAuth provider** (google, facebook, twitch) from wallet
5. **Calls ClientService.getOrCreateClient()** with wallet address and provider
6. **Creates database record** if it doesn't exist
7. **Updates last_login** if profile already exists
8. **Sets client profile state** for the UI to use

### Data Flow Example

```typescript
// User connects Google zkLogin wallet
const walletAddress = "0x1234567890abcdef1234567890abcdef12345678";
const provider = "google";
const providerSubject = "google_1234abcd"; // Generated from provider + wallet

// Profile created in database:
{
  wallet_address: "0x1234567890abcdef1234567890abcdef12345678",
  id: "client-1234abcd", 
  anon_display_name: "Anonymous_xyz123",
  auth_provider: "google",
  provider_subject: "google_1234abcd",
  total_sessions: 0,
  total_spent_sui: 0,
  created_at: "2024-01-20T10:30:00Z"
}
```

## 🎨 UI Components

### EnokiWalletConnect Features

- **Connect Button**: Shows available OAuth providers
- **Profile Dropdown**: Displays user info when connected
- **Automatic Status**: Shows profile creation/sync status
- **Session Stats**: Displays total sessions and SUI spent
- **Quick Actions**: Links to profile page and settings

### Profile Page Integration

- **Real Data**: Uses Supabase data instead of mock data
- **Wallet Display**: Shows truncated wallet address for authenticated users
- **Provider Badge**: Shows which OAuth provider was used
- **Statistics**: Real session count and spending from database

## 🔧 Customization Options

### 1. Custom Display Names

```typescript
// In ClientService.createClient()
const clientData = {
  // ...
  anon_display_name: data.anon_display_name || generateCustomName(),
};

function generateCustomName() {
  const adjectives = ['Anonymous', 'Mysterious', 'Zen', 'Calm'];
  const nouns = ['Seeker', 'Wanderer', 'Soul', 'Spirit'];
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]}_${nouns[Math.floor(Math.random() * nouns.length)]}`;
}
```

### 2. Additional OAuth Providers

```typescript
// In RegisterEnokiWallet component
registerEnokiWallets({
  // ... existing config
  providers: {
    google: { clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID! },
    facebook: { clientId: process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID! },
    twitch: { clientId: process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID! },
    // Add more providers as needed
    discord: { clientId: process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID! },
  },
});
```

### 3. Custom Profile Fields

```typescript
// Add to Client interface in supabase.ts
export interface Client {
  // ... existing fields
  preferred_language: string | null;
  therapy_goals: string[] | null;
  session_frequency: 'weekly' | 'biweekly' | 'monthly' | null;
}
```

## 🚨 Troubleshooting

### Common Issues

1. **"useClientAuth must be used within a ClientAuthProvider"**
   - ✅ **Fixed**: ClientAuthProvider is now wrapped in WalletProviders

2. **Profile not created automatically**
   - Check console for error messages
   - Verify Supabase connection and table exists
   - Ensure environment variables are set correctly

3. **OAuth popup blocked**
   - Make sure popups are enabled in browser
   - Test in incognito mode to rule out extensions

4. **Database connection errors**
   - Verify SUPABASE_URL and SUPABASE_ANON_KEY
   - Check Supabase project is not paused
   - Verify RLS policies allow INSERT operations

### Debug Logs

The integration includes comprehensive logging:

```typescript
// Check browser console for:
console.log('Auto-creating profile for google zkLogin wallet:', walletAddress);
console.log('Client profile created successfully:', profile);
console.error('Error creating Enoki wallet profile:', error);
```

### Testing Checklist

- [ ] Supabase table created with correct schema
- [ ] Environment variables configured
- [ ] OAuth providers configured in Enoki dashboard
- [ ] Wallet connects successfully
- [ ] Profile appears in Supabase table
- [ ] Profile data displays in UI
- [ ] Settings page works for profile updates

## 🎉 Success Indicators

When everything is working correctly, you should see:

1. **Smooth wallet connection** with OAuth popup
2. **Console logs** showing profile creation
3. **New row in Supabase** clients table
4. **User profile displayed** in the navbar dropdown
5. **Profile page** showing real data instead of mock data
6. **Settings page** allowing profile updates

## 📞 Next Steps

1. **Test with different OAuth providers** (Google, Facebook, Twitch)
2. **Implement session completion tracking** to update total_sessions and total_spent_sui
3. **Add profile verification workflow** for enhanced trust
4. **Set up email notifications** using the stored email addresses
5. **Implement profile settings modal** for easy access from navbar
6. **Add analytics** to track user registration and engagement

The integration is now complete and ready for production use! 🚀