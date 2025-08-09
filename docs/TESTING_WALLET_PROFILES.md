# 🧪 Testing Wallet-Based Profile Creation

## ✅ **Issues Fixed**

1. **Next.js Routing Conflict**: Removed old `[id]` folder, now using `[walletAddress]` only
2. **Hard-coded Links**: Updated all `client/client-1` links to use real wallet addresses
3. **Profile Creation**: Enhanced automatic profile creation from Enoki zkLogin

## 🔧 **How to Test**

### **Step 1: Clear Cache and Restart**
```bash
rm -rf .next
npm run dev
```

### **Step 2: Test Wallet Connection Flow**

1. **Open your app** at `http://localhost:3000`
2. **Click "Connect Wallet"** in the navbar
3. **Choose an OAuth provider** (Google, Facebook, or Twitch)
4. **Complete the OAuth flow** in the popup
5. **Watch the browser console** for these logs:

```
🔥 Auto-creating profile for google zkLogin wallet: 0x1234567890abcdef...
Wallet details: { name: "Enoki Wallet", provider: "google", features: [...] }
✅ Client profile created successfully: { wallet_address: "0x1234...", ... }
🎉 Welcome! Your anonymous profile has been created with wallet: 0x1234...abcd
```

### **Step 3: Verify Profile Creation**

1. **Check Supabase Dashboard**:
   - Go to your Supabase project
   - Navigate to Table Editor → `clients`
   - Look for a new row with the wallet address

2. **Test Profile Page**:
   - Click "View Profile" in the wallet dropdown
   - Should navigate to `/client/0x1234567890abcdef...`
   - Should display the profile with real data from Supabase

3. **Test Navigation**:
   - Click "My Sessions" in navbar
   - Should go to the user's wallet-based profile page
   - No more `client/client-1` links anywhere

### **Step 4: Test Different Scenarios**

#### **New User (First Time)**
- Connect wallet → Profile created automatically
- Redirected to profile page with wallet address URL

#### **Returning User**
- Connect wallet → Existing profile loaded
- `last_login` timestamp updated in database

#### **Profile Not Found**
- Visit `/client/0x999999999999999999999999999999999999999999`
- Should show "Profile Not Found" message
- Should not crash the application

## 🎯 **Expected Results**

### **✅ What Should Work:**

1. **Automatic Profile Creation**:
   ```typescript
   // When user connects Enoki wallet:
   const profile = {
     wallet_address: "0x1234567890abcdef1234567890abcdef12345678",
     anon_display_name: "Anonymous_xyz123",
     auth_provider: "google",
     provider_subject: "google_1234abcd",
     total_sessions: 0,
     total_spent_sui: 0,
     created_at: "2024-01-20T10:30:00Z"
   }
   ```

2. **Dynamic Navigation**:
   - "My Sessions" → `/client/0x1234567890abcdef...` (user's wallet)
   - "View Profile" → `/client/0x1234567890abcdef...` (user's wallet)

3. **Database Integration**:
   - New row in `clients` table with wallet address as primary key
   - No secondary IDs, just wallet addresses

### **🚨 What to Watch For:**

1. **Console Errors**: Any unhandled promise rejections or routing errors
2. **Database Errors**: Failed inserts or constraint violations
3. **Navigation Issues**: Links still pointing to `client/client-1`
4. **Profile Loading**: Infinite loading or failed profile fetches

## 🔍 **Debugging Tips**

### **If Profile Creation Fails:**
```javascript
// Check browser console for:
console.error('💥 Error creating Enoki wallet profile:', error);

// Common causes:
// - Supabase connection issues
// - Missing environment variables
// - Table doesn't exist
// - RLS policies blocking inserts
```

### **If Navigation Fails:**
```javascript
// Check for:
// - Hard-coded client-1 links still present
// - URL encoding issues with wallet addresses
// - Missing wallet_address in context
```

### **If Database Issues:**
```sql
-- Check if table exists:
SELECT * FROM clients LIMIT 1;

-- Check for constraint violations:
SELECT * FROM clients WHERE wallet_address = '0x1234...';

-- Check RLS policies:
SHOW rls_enabled;
```

## 📱 **User Journey**

### **Complete Flow:**
1. User visits homepage
2. Clicks "Connect Wallet"
3. Chooses Google OAuth
4. Completes OAuth flow
5. ✨ **Profile automatically created in Supabase**
6. Wallet dropdown shows user info
7. "My Sessions" links to `/client/0x1234...`
8. Profile page loads with real data
9. User can update preferences
10. All future visits use same wallet-based profile

### **URL Examples:**
```
❌ Old: /client/client-1
✅ New: /client/0x1234567890abcdef1234567890abcdef12345678

❌ Old: Hard-coded IDs
✅ New: Dynamic wallet addresses
```

## 🎉 **Success Indicators**

When everything works correctly:

- ✅ No Next.js routing errors
- ✅ Console shows successful profile creation
- ✅ Supabase has new client record
- ✅ Navigation uses wallet addresses
- ✅ Profile page loads with real data
- ✅ No hard-coded client-1 links anywhere

The system is now **100% wallet-based** for true anonymity! 🔐