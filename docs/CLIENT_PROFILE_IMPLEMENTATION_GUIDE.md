# 🚀 Client Profile Implementation Guide

This guide documents the complete implementation of wallet-based client profiles for your therapy platform using Sui zkLogin with Enoki.

## 📋 What Was Added

### 1. **Enhanced Database Schema** (`src/lib/supabase.ts`)
- Updated `Client` interface to use `wallet_address` as primary key
- Added zkLogin authentication fields (`auth_provider`, `provider_subject`)
- Added profile management fields (timezone, preferences, vibe_tags)
- Added session tracking (total_sessions, total_spent_sui)
- Added verification and activity tracking

### 2. **Client Service Layer** (`src/lib/clientService.ts`)
- Complete CRUD operations for client profiles
- `getOrCreateClient()` - Main function for wallet authentication
- `updateClient()` - Profile updates
- `incrementSessionStats()` - Session completion tracking
- Proper error handling and wallet address validation

### 3. **Type Definitions** (`src/types/index.ts`)
- `ClientProfile` interface matching database schema
- `WalletAuthContext` for authentication state management
- Proper typing for all client-related operations

### 4. **Authentication Provider** (`src/components/providers/ClientAuthProvider.tsx`)
- React context for managing client authentication state
- Automatic profile creation/retrieval on wallet connection
- Profile update methods
- `useClientAuth()` and `useClientProfile()` hooks

### 5. **Enhanced Profile Page** (`src/app/client/[id]/page.tsx`)
- Integration with Supabase-based client profiles
- Wallet address display for authenticated users
- Real session statistics from database
- Support for both authenticated and mock profiles
- Enhanced privacy indicators

### 6. **Profile Settings Component** (`src/components/client/ClientProfileSettings.tsx`)
- Complete profile management interface
- Wallet information display
- Editable profile fields (display name, email, timezone)
- Interactive vibe tag selection
- Account statistics dashboard

### 7. **Database Schema Documentation** (`docs/SUPABASE_CLIENT_SCHEMA.md`)
- Complete SQL migration scripts
- Row Level Security (RLS) policies
- Indexes and constraints
- Usage examples and best practices

## 🔧 Integration Steps

### Step 1: Database Setup
```sql
-- Run the migration from SUPABASE_CLIENT_SCHEMA.md
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
```

### Step 2: Wrap Your App with Providers
```tsx
// In your app/layout.tsx or main provider file
import { ClientAuthProvider } from '@/components/providers/ClientAuthProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WalletProviders>
          <ClientAuthProvider>
            {children}
          </ClientAuthProvider>
        </WalletProviders>
      </body>
    </html>
  );
}
```

### Step 3: Update Wallet Connection Component
```tsx
// In your wallet connection component
import { useClientAuth } from '@/components/providers/ClientAuthProvider';

export function ConnectWalletWithProfile() {
  const { createClientProfile } = useClientAuth();
  const currentAccount = useCurrentAccount();

  const handleZkLogin = async (provider: 'google' | 'facebook' | 'twitch') => {
    // After successful zkLogin authentication
    try {
      const profile = await createClientProfile(
        provider,
        providerSubject, // From zkLogin response
        email, // Optional, from OAuth
        displayName // Optional, from OAuth
      );
      console.log('Client profile created:', profile);
    } catch (error) {
      console.error('Failed to create profile:', error);
    }
  };
}
```

### Step 4: Use Client Profile in Components
```tsx
// In any component
import { useClientProfile } from '@/components/providers/ClientAuthProvider';

export function MyComponent() {
  const { client, isAuthenticated, wallet_address } = useClientProfile();

  if (!isAuthenticated) {
    return <div>Please connect your wallet</div>;
  }

  return (
    <div>
      <h1>Welcome, {client?.anon_display_name}!</h1>
      <p>Wallet: {wallet_address}</p>
      <p>Sessions: {client?.total_sessions}</p>
    </div>
  );
}
```

## 🎯 Key Features Implemented

### ✅ **Wallet-Based Authentication**
- Sui wallet addresses as primary keys
- zkLogin integration with Google, Facebook, Twitch
- Automatic profile creation on first login

### ✅ **Anonymous Privacy Protection**
- No personally identifiable information stored
- Optional email for notifications only
- Anonymous display names
- zkLogin privacy guarantees

### ✅ **Profile Management**
- Editable display names and preferences
- Timezone settings for session scheduling
- Therapy preference tags (anxiety, burnout, etc.)
- Email notifications (optional)

### ✅ **Session Tracking**
- Total completed sessions counter
- Total SUI spent tracking
- Session history integration
- Progress statistics

### ✅ **Security & Verification**
- Row Level Security (RLS) policies
- Account verification status
- Last login tracking
- Secure credential storage

## 🔗 API Reference

### ClientService Methods
```typescript
// Get or create client profile (main authentication method)
ClientService.getOrCreateClient(wallet_address, auth_provider, provider_subject, email?)

// Get existing client by wallet address
ClientService.getClientByWalletAddress(wallet_address)

// Get client by secondary ID (for URL routing)
ClientService.getClientById(id)

// Update client profile
ClientService.updateClient(wallet_address, updates)

// Update session statistics after completion
ClientService.incrementSessionStats(wallet_address, session_cost_sui)
```

### React Hooks
```typescript
// Authentication context
const { isConnected, wallet_address, client_profile, createClientProfile } = useClientAuth();

// Simplified client profile access
const { client, isAuthenticated, wallet_address } = useClientProfile();
```

## 📱 User Flow

### New User Registration
1. User connects wallet with Enoki zkLogin
2. `ClientAuthProvider` detects new wallet address
3. User completes OAuth flow (Google/Facebook/Twitch)
4. `createClientProfile()` creates database record
5. User is redirected to profile page

### Returning User Login
1. User connects wallet
2. `ClientAuthProvider` finds existing profile
3. Updates `last_login` timestamp
4. User sees their existing profile and data

### Profile Management
1. User navigates to profile settings
2. `ClientProfileSettings` component loads current data
3. User updates preferences, display name, etc.
4. Changes saved to database via `updateClient()`

## 🚨 Important Notes

### Environment Variables Required
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_ENOKI_API_KEY=your_enoki_api_key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_FACEBOOK_CLIENT_ID=your_facebook_client_id
NEXT_PUBLIC_TWITCH_CLIENT_ID=your_twitch_client_id
```

### Migration Considerations
- Existing mock users will need to be migrated or handled as fallbacks
- Session records should be updated to reference `wallet_address`
- Consider gradual rollout to avoid disrupting existing users

### Security Best Practices
- Never store private keys or wallet seeds
- Use RLS policies to restrict data access
- Validate wallet addresses before database operations
- Implement rate limiting on profile updates
- Monitor for suspicious authentication patterns

## 🎉 Next Steps

1. **Set up Supabase database** with the provided schema
2. **Configure environment variables** for all OAuth providers
3. **Test wallet connection flow** with profile creation
4. **Update session completion logic** to call `incrementSessionStats()`
5. **Add profile settings link** to navigation
6. **Test RLS policies** to ensure data security
7. **Consider adding profile verification** workflow

## 📞 Support

The implementation includes comprehensive error handling and logging. Check browser console and server logs for debugging information. All components are designed to gracefully handle missing data and connection issues.

For additional customization, refer to the individual component files and the database schema documentation.