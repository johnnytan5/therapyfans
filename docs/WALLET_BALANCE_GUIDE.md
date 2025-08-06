# 🪙 Sui Wallet Balance Fetching Guide for zkLogin

This guide explains how to properly fetch wallet balances for zkLogin implementations using the official Sui documentation patterns.

## 📋 Table of Contents

- [Overview](#overview)
- [Current Implementation (Recommended)](#current-implementation-recommended)
- [Alternative Implementation with useSuiClientQuery](#alternative-implementation-with-ussuiclientquery)
- [Key Concepts](#key-concepts)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

Sui wallet balances are returned in **MIST** units, where:

- **1 SUI = 1,000,000,000 MIST**
- Raw balance needs conversion to display properly

## Current Implementation (Recommended)

Our current implementation in `ConnectWallet.tsx` follows the **official Sui documentation pattern**:

### ✅ **What We're Doing Right**

```typescript
// 1. Using the official hooks
import { useSuiClient, useCurrentAccount } from "@mysten/dapp-kit";

// 2. Getting SuiClient instance
const suiClient = useSuiClient();

// 3. Calling the official getBalance method
const { totalBalance } = await suiClient.getBalance({
  owner: currentAccount.address,
});

// 4. Converting MIST to SUI properly
const suiBalance = mistToSui(totalBalance).toFixed(4);
```

### 🔧 **Features Implemented**

- ✅ **Auto-refresh** every 10 seconds
- ✅ **Retry logic** with exponential backoff (3 attempts)
- ✅ **Loading states** and error handling
- ✅ **Proper MIST to SUI conversion**
- ✅ **zkLogin compatibility** (works with Enoki wallets)

## Alternative Implementation with `useSuiClientQuery`

For better React Query integration, you can use the `useSuiClientQuery` hook:

```typescript
import { useSuiClientQuery } from "@mysten/dapp-kit";

const {
  data: balanceData,
  isLoading,
  error,
  refetch,
} = useSuiClientQuery(
  "getBalance",
  {
    owner: currentAccount?.address || "",
  },
  {
    enabled: !!currentAccount?.address,
    refetchInterval: 10000, // Auto-refresh every 10 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  }
);

const balance = balanceData
  ? mistToSui(balanceData.totalBalance).toFixed(4)
  : "0.0000";
```

### 🎯 **Benefits of useSuiClientQuery**

- 🔄 **Better caching** via React Query
- 🎛️ **More granular control** over refetch behavior
- 📊 **Built-in loading/error states**
- 🔁 **Automatic retries** with configurable delay
- ⚡ **Background refetching** and stale-while-revalidate

## Key Concepts

### 🪙 **MIST vs SUI Conversion**

```typescript
// Utility functions in src/lib/utils.ts
export function mistToSui(mistAmount: string | number): number {
  const mist =
    typeof mistAmount === "string" ? parseInt(mistAmount) : mistAmount;
  return mist / 1_000_000_000;
}

export function formatSuiFromMist(
  mistAmount: string | number,
  decimals: number = 4
): string {
  const suiAmount = mistToSui(mistAmount);
  return `${suiAmount.toFixed(decimals)} SUI`;
}
```

### 🔌 **zkLogin Integration**

zkLogin wallets work seamlessly with both approaches:

```typescript
// Enoki wallet registration (already set up)
registerEnokiWallets({
  client: suiClient,
  network: "devnet",
  apiKey: process.env.NEXT_PUBLIC_ENOKI_API_KEY!,
  providers: {
    google: { clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID! },
    facebook: { clientId: process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID! },
    twitch: { clientId: process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID! },
  },
});
```

## Best Practices

### 🎯 **Performance Optimization**

1. **Use reasonable refresh intervals** (10 seconds recommended)
2. **Implement proper error boundaries**
3. **Add retry logic with exponential backoff**
4. **Cache balance data appropriately**

### 🔒 **Error Handling**

```typescript
// Comprehensive error handling
try {
  const { totalBalance } = await suiClient.getBalance({
    owner: currentAccount.address,
  });
  const suiBalance = mistToSui(totalBalance).toFixed(4);
  setBalance(suiBalance);
  setBalanceError(null);
} catch (error) {
  console.error("Failed to fetch balance:", error);

  // Retry logic
  if (retryCount < 3) {
    const delay = Math.pow(2, retryCount) * 1000;
    setTimeout(() => getBalance(retryCount + 1), delay);
    return;
  }

  setBalance("0.0000");
  setBalanceError("Failed to fetch balance");
}
```

### 🎨 **UI/UX Considerations**

```typescript
// Loading states
{
  isLoading ? (
    <span className="animate-pulse text-yellow-400">Loading...</span>
  ) : error ? (
    <span className="text-red-400 text-xs">Error</span>
  ) : (
    <span className="text-green-400">{`${balance || "0.0000"} SUI`}</span>
  );
}
```

## Troubleshooting

### ❌ **Common Issues**

1. **Balance shows as "0 SUI"**

   - **Cause**: Not converting from MIST to SUI
   - **Solution**: Use `mistToSui()` utility function

2. **Balance not updating**

   - **Cause**: No refresh mechanism
   - **Solution**: Implement auto-refresh with `setInterval` or `refetchInterval`

3. **Network errors**
   - **Cause**: RPC endpoint issues
   - **Solution**: Add retry logic with exponential backoff

### ✅ **Verification Steps**

1. Check that `currentAccount.address` is valid
2. Verify network configuration (devnet/mainnet)
3. Ensure proper MIST to SUI conversion
4. Test with different wallet providers (Google, Facebook, Twitch)

## 📚 **Official Documentation References**

- [Sui TypeScript SDK](https://docs.sui.io/guides/developer/first-app/client-tssdk)
- [dApp Kit Documentation](https://docs.sui.io/guides/developer/first-app/client-tssdk#what-is-dapp-kit)
- [Balance Fetching Example](https://docs.sui.io/guides/developer/first-app/client-tssdk#get-coins)

## 🔗 **Related Files**

- `src/components/wallet/ConnectWallet.tsx` - Current implementation
- `src/components/wallet/ConnectWalletWithQuery.tsx` - Alternative implementation
- `src/components/wallet/WalletBalance.tsx` - Balance display component
- `src/lib/utils.ts` - Utility functions for MIST/SUI conversion
- `src/components/providers/WalletProviders.tsx` - Wallet provider setup

---

**✨ Both implementations are valid and follow official Sui documentation patterns. Choose based on your specific needs for caching and React Query integration.**
