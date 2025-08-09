# 🗄️ Supabase Client Profile Schema

This document outlines the database schema for storing client profiles with Sui zkLogin integration using wallet addresses as primary keys.

## 📋 Table of Contents

- [Overview](#overview)
- [Client Table Schema](#client-table-schema)
- [SQL Migration](#sql-migration)
- [Indexes and Constraints](#indexes-and-constraints)
- [Row Level Security (RLS)](#row-level-security-rls)
- [Usage Examples](#usage-examples)

## Overview

The `clients` table stores user profiles for therapy clients who authenticate using Sui zkLogin. The primary key is the wallet address, ensuring each wallet can only have one profile while maintaining anonymity.

### Key Features:
- **Wallet-based Authentication**: Uses Sui wallet addresses as primary keys
- **zkLogin Integration**: Stores OAuth provider information for zkLogin
- **Anonymous by Design**: No personally identifiable information stored
- **Session Tracking**: Tracks total sessions and spending
- **Flexible Preferences**: JSON arrays for therapy preferences and tags

## Client Table Schema

```sql
CREATE TABLE clients (
  -- Primary identification
  wallet_address TEXT PRIMARY KEY,  -- Sui wallet address (0x...)
  id TEXT UNIQUE NOT NULL,         -- Secondary ID for UI routing (client-xxxxx)
  
  -- Profile information
  anon_display_name TEXT,          -- Anonymous display name
  email TEXT,                      -- Optional email for notifications
  
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

## SQL Migration

### Step 1: Create the Table

```sql
-- Create clients table
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

### Step 2: Create Indexes

```sql
-- Index for secondary ID lookups (used in URL routing)
CREATE INDEX idx_clients_id ON clients(id);

-- Index for auth provider lookups
CREATE INDEX idx_clients_auth_provider ON clients(auth_provider);

-- Index for provider subject (for zkLogin verification)
CREATE INDEX idx_clients_provider_subject ON clients(provider_subject);

-- Index for created_at (for sorting/filtering)
CREATE INDEX idx_clients_created_at ON clients(created_at);

-- Index for last_login (for activity tracking)
CREATE INDEX idx_clients_last_login ON clients(last_login);

-- Partial index for verified clients
CREATE INDEX idx_clients_verified ON clients(wallet_address) WHERE is_verified = true;
```

### Step 3: Create Updated At Trigger

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

## Indexes and Constraints

### Primary Key
- `wallet_address`: Sui wallet address (e.g., "0x1234...abcd")

### Unique Constraints
- `id`: Secondary identifier for URL routing (e.g., "client-1234abcd")

### Check Constraints
- `auth_provider`: Must be one of 'google', 'facebook', 'twitch'

### Foreign Key Relationships
```sql
-- Update sessions table to reference wallet_address
ALTER TABLE sessions 
ADD CONSTRAINT fk_sessions_client_wallet 
FOREIGN KEY (client_wallet_address) REFERENCES clients(wallet_address);

-- Update reviews table to reference wallet_address  
ALTER TABLE reviews 
ADD CONSTRAINT fk_reviews_client_wallet 
FOREIGN KEY (client_wallet_address) REFERENCES clients(wallet_address);
```

## Row Level Security (RLS)

### Enable RLS
```sql
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
```

### RLS Policies

```sql
-- Policy: Users can only view their own profile
CREATE POLICY "Users can view own profile" ON clients
    FOR SELECT USING (wallet_address = current_setting('app.current_wallet')::text);

-- Policy: Users can only update their own profile
CREATE POLICY "Users can update own profile" ON clients
    FOR UPDATE USING (wallet_address = current_setting('app.current_wallet')::text);

-- Policy: Anyone can create a profile (for registration)
CREATE POLICY "Anyone can create profile" ON clients
    FOR INSERT WITH CHECK (true);

-- Policy: Users can delete their own profile
CREATE POLICY "Users can delete own profile" ON clients
    FOR DELETE USING (wallet_address = current_setting('app.current_wallet')::text);
```

### Setting Current Wallet Context
```sql
-- Set the current wallet address for RLS (call this after authentication)
SELECT set_config('app.current_wallet', 'user_wallet_address_here', true);
```

## Usage Examples

### Insert New Client
```sql
INSERT INTO clients (
    wallet_address,
    id,
    anon_display_name,
    email,
    auth_provider,
    provider_subject,
    timezone,
    vibe_tags
) VALUES (
    '0x1234567890abcdef1234567890abcdef12345678',
    'client-12345678',
    'Anonymous_Seeker',
    'user@example.com',
    'google',
    'google_subject_123',
    'UTC-8',
    ARRAY['anxiety', 'burnout', 'empathetic']
);
```

### Query Client by Wallet Address
```sql
SELECT * FROM clients 
WHERE wallet_address = '0x1234567890abcdef1234567890abcdef12345678';
```

### Query Client by Secondary ID
```sql
SELECT * FROM clients 
WHERE id = 'client-12345678';
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

### Increment Session Stats
```sql
UPDATE clients 
SET 
    total_sessions = total_sessions + 1,
    total_spent_sui = total_spent_sui + 5.0,
    updated_at = NOW()
WHERE wallet_address = '0x1234567890abcdef1234567890abcdef12345678';
```

### Update Last Login
```sql
UPDATE clients 
SET 
    last_login = NOW(),
    updated_at = NOW()
WHERE wallet_address = '0x1234567890abcdef1234567890abcdef12345678';
```

## Integration with Sessions Table

Update your sessions table to properly reference clients:

```sql
-- Add wallet_address reference to sessions
ALTER TABLE sessions 
ADD COLUMN client_wallet_address TEXT REFERENCES clients(wallet_address);

-- Update existing sessions (if migrating)
UPDATE sessions 
SET client_wallet_address = clients.wallet_address 
FROM clients 
WHERE sessions.client_id = clients.id;

-- Eventually drop the old client_id column
-- ALTER TABLE sessions DROP COLUMN client_id;
```

## Best Practices

### 1. **Always Use Wallet Address as Primary Reference**
```typescript
// ✅ Good
const client = await ClientService.getClientByWalletAddress(walletAddress);

// ❌ Avoid for primary operations
const client = await ClientService.getClientById(clientId);
```

### 2. **Handle Anonymous Data Properly**
```typescript
// Always check for null values
const displayName = client.anon_display_name || `Anonymous_${Math.random().toString(36).substr(2, 6)}`;
```

### 3. **Use Transactions for Session Updates**
```sql
BEGIN;
-- Update session
INSERT INTO sessions (...) VALUES (...);
-- Update client stats
UPDATE clients SET total_sessions = total_sessions + 1 WHERE wallet_address = $1;
COMMIT;
```

### 4. **Implement Proper Error Handling**
```typescript
try {
  const client = await ClientService.getOrCreateClient(walletAddress, provider, subject);
} catch (error) {
  if (error.code === '23505') { // Unique violation
    // Handle duplicate wallet address
  }
}
```

## Security Considerations

1. **Never store private keys or sensitive data**
2. **Use RLS to ensure users can only access their own data**
3. **Validate wallet addresses before storing**
4. **Implement rate limiting for profile updates**
5. **Log authentication events for security monitoring**

## Migration Checklist

- [ ] Create `clients` table with proper schema
- [ ] Create all necessary indexes
- [ ] Set up RLS policies
- [ ] Create updated_at trigger
- [ ] Update related tables (sessions, reviews) to reference wallet_address
- [ ] Test authentication flow
- [ ] Test profile CRUD operations
- [ ] Verify RLS policies work correctly
- [ ] Update application code to use new schema
- [ ] Test wallet connection and profile creation