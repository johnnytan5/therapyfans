# 🔧 Google OAuth Setup Fix

## 🐛 Problem: redirect_uri_mismatch

You're encountering this error:
```
Error 400: redirect_uri_mismatch
Request details: redirect_uri=http://localhost:3000/sc-test
```

This happens because your Google OAuth client is not configured to allow redirects to your development URLs.

## ✅ Solution: Configure Google Cloud Console

### Step 1: Access Google Cloud Console

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Select your project** (or create one if needed)
3. **Navigate to APIs & Services > Credentials**

### Step 2: Configure OAuth Client

1. **Find your OAuth 2.0 Client ID** (the one used in `NEXT_PUBLIC_GOOGLE_CLIENT_ID`)
2. **Click on the client ID** to edit it
3. **In the "Authorized redirect URIs" section**, add these URLs:

```
http://localhost:3000
http://localhost:3000/
http://localhost:3000/sc-test
http://localhost:3000/therapist-test
http://localhost:3000/marketplace
http://localhost:3000/client
http://localhost:3000/matchmaking
http://localhost:3000/my-sessions
http://localhost:3000/onramp
http://localhost:3000/purchase
http://localhost:3000/session
http://localhost:3000/therapist
http://localhost:3000/therapist-onboarding
http://localhost:3000/test-client-side
```

### Step 3: Add Development Domains

For broader coverage, also add these patterns:
```
http://localhost:3000/*
http://127.0.0.1:3000
http://127.0.0.1:3000/*
```

### Step 4: Save Changes

1. **Click "Save"** to update the OAuth client
2. **Wait 5-10 minutes** for changes to propagate

## 🔍 Understanding Enoki OAuth Flow

### How Enoki Handles Redirects

Enoki wallets use a specific OAuth flow:
1. **User clicks "Connect with Google"**
2. **Enoki opens OAuth popup** with redirect_uri parameter
3. **Google authenticates user** and redirects back to your app
4. **Enoki processes the callback** and creates the wallet

### Required Redirect URIs

For your TherapyFans app, you need redirects for:
- **Base app**: `http://localhost:3000`
- **All pages where users can connect**: Each route where EnokiWalletConnect component is used

## 🚨 Common Issues & Solutions

### Issue 1: Still Getting redirect_uri_mismatch

**Solutions:**
1. **Clear browser cache** and try again
2. **Wait 10 minutes** for Google changes to propagate
3. **Check the exact URL** in the error message and add it to allowed URIs
4. **Verify you're editing the correct OAuth client**

### Issue 2: Working in some pages but not others

**Solution:** Add specific redirect URIs for each page:
```
http://localhost:3000/[specific-page]
```

### Issue 3: Need to support different ports

**Add these if you run on different ports:**
```
http://localhost:3001
http://localhost:3001/*
http://localhost:8080
http://localhost:8080/*
```

## 🎯 Production Setup

### For Production Deployment

When deploying to production, add your production URLs:
```
https://yourdomain.com
https://yourdomain.com/*
https://www.yourdomain.com
https://www.yourdomain.com/*
```

### Environment-Specific OAuth Clients

**Recommended approach:**
1. **Development OAuth Client**: `localhost` URLs only
2. **Production OAuth Client**: Production domain URLs only
3. **Use different `GOOGLE_CLIENT_ID`** for each environment

### Security Best Practices

1. **Separate OAuth clients** for development vs production
2. **Restrict JavaScript origins** to your specific domains
3. **Use HTTPS in production** (required by Google)
4. **Monitor OAuth usage** in Google Cloud Console

## 🧪 Testing the Fix

### Step 1: Verify Configuration
1. **Go to `/sc-test`** in your app
2. **Click "Connect with Google"**
3. **Should open OAuth popup** without redirect_uri_mismatch error

### Step 2: Test All Pages
Test wallet connection on all pages with EnokiWalletConnect:
- ✅ `/sc-test`
- ✅ `/therapist-test`
- ✅ `/marketplace/[id]`
- ✅ Any other pages with wallet connection

### Step 3: Check Console Logs
Look for successful Enoki registration:
```
🔥 Auto-creating profile for google zkLogin wallet: 0x1234...
✅ Client profile created successfully
```

## 📋 Quick Checklist

- [ ] Added `http://localhost:3000` to Google OAuth redirect URIs
- [ ] Added `http://localhost:3000/*` for wildcard coverage
- [ ] Added specific page URLs like `/sc-test`
- [ ] Saved changes in Google Cloud Console
- [ ] Waited 5-10 minutes for propagation
- [ ] Cleared browser cache
- [ ] Tested wallet connection
- [ ] Verified OAuth flow completes successfully

## 🔧 Alternative: Temporary Local Testing

If you can't immediately access Google Cloud Console, you can test with a different approach:

1. **Use a different OAuth provider** (Facebook or Twitch) temporarily
2. **Or test the smart contract functions** without wallet connection first
3. **Then fix Google OAuth** when you have access to the console

## 💡 Environment Variables Check

Make sure your `.env.local` has the correct Google Client ID:
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_actual_google_client_id_here
```

The client ID should match the one configured in Google Cloud Console.

---

After following these steps, your Google OAuth integration should work properly across all pages in your TherapyFans application!
