# 🔐 Wallet-Only Database Schema

This document outlines the simplified database schema using **only wallet addresses** as user identifiers for maximum anonymity.

## 📋 Overview

The `clients` table uses **wallet addresses as the sole identifier** - no secondary IDs, no usernames, no other tracking mechanisms. This ensures true anonymity where only the wallet address can identify a user.

### Key Principles:
- **Single Identifier**: Only wallet address as primary key
- **Maximum Anonymity**: No secondary identifiers that could link profiles
- **zkLogin Integration**: OAuth provider stored for authentication context only
- **Anonymous Display Names**: Generated randomly, not tied to real identity

## Updated Client Table Schema

```sql
-- Drop the old table if it exists (CAUTION: This will delete all data)
DROP TABLE IF EXISTS clients CASCADE;

-- Create new wallet-only clients table
CREATE TABLE clients (
  -- Primary identification (ONLY identifier)
  wallet_address TEXT PRIMARY KEY,  -- Sui wallet address (0x...)
  
  -- Profile information (all anonymous)
  anon_display_name TEXT,          -- Anonymous display name
  email TEXT,                      -- Optional email for notifications only
  
  -- zkLogin authentication data
  auth_provider TEXT CHECK (auth_provider IN ('google', 'facebook', 'twitch')),
  provider_subject TEXT,           -- OAuth subject ID from provider
  
  -- User preferences
  timezone TEXT DEFAULT 'UTC',
  preferences TEXT[] DEFAULT '{}', -- JSON array of general preferences
  vibe_tags TEXT[] DEFAULT '{}',   -- JSON array of therapy-related tags
  
  -- Session statistics
  total_sessions INTEGER DEFAULT 0,
  total_spent_sui DECIMAL(20,9) DEFAULT 0, -- Total SUI spent on sessions
  
  -- Account status
  is_verified BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Indexes (Wallet-Only)

```sql
-- Index for auth provider lookups (for analytics only)
CREATE INDEX idx_clients_auth_provider ON clients(auth_provider);

-- Index for provider subject (for zkLogin verification)
CREATE INDEX idx_clients_provider_subject ON clients(provider_subject);

-- Index for created_at (for sorting/filtering)
CREATE INDEX idx_clients_created_at ON clients(created_at);

-- Index for last_login (for activity tracking)
CREATE INDEX idx_clients_last_login ON clients(last_login);

-- Partial index for verified clients
CREATE INDEX idx_clients_verified ON clients(wallet_address) WHERE is_verified = true;

-- Remove any indexes on 'id' field since it no longer exists
```

## Updated Triggers

```sql
-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to call the function
CREATE TRIGGER update_clients_updated_at 
    BEFORE UPDATE ON clients 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

## Row Level Security (Wallet-Based)

```sql
-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own profile by wallet address
CREATE POLICY "Users can view own profile by wallet" ON clients
    FOR SELECT USING (wallet_address = current_setting('app.current_wallet', true)::text);

-- Policy: Users can only update their own profile by wallet address
CREATE POLICY "Users can update own profile by wallet" ON clients
    FOR UPDATE USING (wallet_address = current_setting('app.current_wallet', true)::text);

-- Policy: Anyone can create a profile (for registration)
CREATE POLICY "Anyone can create profile" ON clients
    FOR INSERT WITH CHECK (true);

-- Policy: Users can delete their own profile by wallet address
CREATE POLICY "Users can delete own profile by wallet" ON clients
    FOR DELETE USING (wallet_address = current_setting('app.current_wallet', true)::text);
```

## Updated Session References

```sql
-- Update sessions table to reference wallet_address directly
ALTER TABLE sessions 
DROP COLUMN IF EXISTS client_id;

ALTER TABLE sessions 
ADD COLUMN client_wallet_address TEXT REFERENCES clients(wallet_address);

-- Update reviews table similarly
ALTER TABLE reviews 
DROP COLUMN IF EXISTS client_id;

ALTER TABLE reviews 
ADD COLUMN client_wallet_address TEXT REFERENCES clients(wallet_address);
```

## Usage Examples

### Insert New Client (Wallet-Only)
```sql
INSERT INTO clients (
    wallet_address,
    anon_display_name,
    email,
    auth_provider,
    provider_subject,
    timezone,
    vibe_tags
) VALUES (
    '0x1234567890abcdef1234567890abcdef12345678',
    'Anonymous_xyz123',
    'user@example.com',
    'google',
    'google_subject_123',
    'UTC-8',
    ARRAY['anxiety', 'burnout', 'empathetic']
);
```

### Query Client by Wallet Address (Only Way)
```sql
SELECT * FROM clients 
WHERE wallet_address = '0x1234567890abcdef1234567890abcdef12345678';
```

### Update Client Profile
```sql
UPDATE clients 
SET 
    anon_display_name = 'Updated_Name',
    vibe_tags = ARRAY['anxiety', 'mindfulness'],
    updated_at = NOW()
WHERE wallet_address = '0x1234567890abcdef1234567890abcdef12345678';
```

### Create Session with Wallet Reference
```sql
INSERT INTO sessions (
    id,
    client_wallet_address,
    therapist_id,
    scheduled_at,
    duration_minutes,
    status
) VALUES (
    'session_123',
    '0x1234567890abcdef1234567890abcdef12345678',
    'therapist_456',
    '2024-01-25 15:00:00+00',
    60,
    'scheduled'
);
```

## URL Structure

### Old (ID-Based)
```
/client/client-1
/client/client-abc123
```

### New (Wallet-Based)
```
/client/0x1234567890abcdef1234567890abcdef12345678
/client/0xabcdef1234567890abcdef1234567890abcdef12
```

## Application Changes

### ClientService (Wallet-Only Methods)
```typescript
// ONLY method needed for fetching clients
ClientService.getClientByWalletAddress(walletAddress)

// Remove these methods:
// ClientService.getClientById() ❌
// Any ID-based lookups ❌
```

### URL Routing
```typescript
// Old route
/client/[id]/page.tsx

// New route  
/client/[walletAddress]/page.tsx

// Usage
const profile = await ClientService.getClientByWalletAddress(params.walletAddress);
```

### Navigation Links
```typescript
// Old
<Link href={`/client/${client.id}`}>View Profile</Link>

// New
<Link href={`/client/${encodeURIComponent(client.wallet_address)}`}>View Profile</Link>
```

## Security Benefits

### ✅ **Maximum Anonymity**
- No secondary identifiers that could be correlated
- Only the wallet owner can access their profile
- No username/ID enumeration possible

### ✅ **Simplified Architecture**
- Single source of truth (wallet address)
- No ID collision possibilities
- Direct wallet-to-profile mapping

### ✅ **zkLogin Integration**
- Wallet address proves ownership
- OAuth provider stored for context only
- No cross-referencing possible

## Privacy Guarantees

1. **No Profile Discovery**: Can't browse profiles without wallet addresses
2. **No Username Enumeration**: No secondary IDs to guess or iterate
3. **Wallet-Gated Access**: Must own the wallet to see the profile
4. **Anonymous Display Names**: Generated randomly, not user-chosen
5. **Optional Email**: Only for notifications, not identification

## Migration Steps

If migrating from ID-based system:

```sql
-- 1. Backup existing data
CREATE TABLE clients_backup AS SELECT * FROM clients;

-- 2. Drop secondary ID constraints
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_id_key;
ALTER TABLE clients DROP COLUMN IF EXISTS id;

-- 3. Update foreign key references
UPDATE sessions SET client_wallet_address = (
    SELECT wallet_address FROM clients_backup 
    WHERE clients_backup.id = sessions.client_id
);

-- 4. Drop old client_id columns
ALTER TABLE sessions DROP COLUMN client_id;
ALTER TABLE reviews DROP COLUMN client_id;

-- 5. Test the new system thoroughly
```

## Testing Checklist

- [ ] Client profile creation with wallet address only
- [ ] Profile access via `/client/0x...` URLs
- [ ] No access to profiles without wallet address
- [ ] Session creation with wallet address reference
- [ ] Profile updates using wallet address
- [ ] RLS policies working correctly
- [ ] Navigation links using wallet addresses
- [ ] URL encoding/decoding of wallet addresses

This wallet-only approach ensures maximum anonymity while maintaining full functionality for your therapy platform.