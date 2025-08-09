# 🔧 Kiosk ID Extraction Debug Fix

## 🐛 Problem Identified

You encountered this error:
```
❌ Error in getTherapistIdFromWallet: Error: Could not extract kiosk ID from KioskOwnerCap
```

**Analysis:** The wallet has 3 objects including a KioskOwnerCap, but the kiosk ID extraction is failing. This suggests the data structure might be different than expected.

## ✅ Enhanced Solution

### 1. **Robust Kiosk ID Extraction**

Updated `src/lib/therapistWalletService.ts` with:

```typescript
// Try multiple KioskOwnerCap type names
let kioskOwnerCap = ownedObjectsResponse.data.find((obj) => {
  return obj.data?.type?.includes('::kiosk::KioskOwnerCap');
});

// Fallback: try the old OwnerCap name
if (!kioskOwnerCap) {
  kioskOwnerCap = ownedObjectsResponse.data.find((obj) => {
    return obj.data?.type?.includes('::kiosk::OwnerCap');
  });
}

// Robust field extraction
let kioskId = null;

// Try to get from content fields first
if (kioskOwnerCap.data.content?.fields) {
  kioskId = (kioskOwnerCap.data.content.fields as any).kiosk;
}

// If not found, fetch object separately (like in sc-test page)
if (!kioskId) {
  const ownerCapObj = await suiClient.getObject({ 
    id: kioskOwnerCap.data.objectId, 
    options: { showContent: true } 
  });
  
  if (ownerCapObj.data?.content) {
    kioskId = (ownerCapObj.data.content as any).fields?.kiosk;
  }
}
```

### 2. **Enhanced Debug Logging**

Added comprehensive debugging:

```typescript
// Log all object types found
console.log('🔍 Object types found:', ownedObjectsResponse.data.map(obj => obj.data?.type));

// Debug helper for readable object structure logging
function debugLogObject(label: string, obj: any) {
  console.log(`🔍 ${label}:`, JSON.stringify(obj, (key, value) => {
    if (typeof value === 'string' && value.length > 100) {
      return value.substring(0, 100) + '...[truncated]';
    }
    return value;
  }, 2));
}

// Log full structure when extraction fails
if (!kioskId) {
  debugLogObject('KioskOwnerCap structure', kioskOwnerCap.data);
  debugLogObject('All owned objects', ownedObjectsResponse.data);
}
```

### 3. **Diagnostic Function**

Added `diagnosePotentialKioskIssues()` to help identify the problem:

```typescript
export async function diagnosePotentialKioskIssues(therapistWalletAddress: string): Promise<{
  hasObjects: boolean;
  hasKioskOwnerCap: boolean;
  objectTypes: string[];
  suggestions: string[];
}>
```

This function:
- ✅ Checks if wallet has any objects
- ✅ Identifies if KioskOwnerCap exists
- ✅ Lists all object types
- ✅ Provides actionable suggestions

### 4. **Marketplace Integration**

Updated marketplace page to call diagnostic function on errors:

```typescript
} catch (error) {
  console.warn('⚠️ Could not verify therapist wallet or get ID:', error);
  
  // Provide diagnostic information
  const diagnosis = await diagnosePotentialKioskIssues(actualWalletAddress);
  console.log('🔍 Wallet diagnosis:', diagnosis);
  console.log('💡 Suggestions:', diagnosis.suggestions);
}
```

## 🔍 What to Check Now

### Step 1: Review Console Logs

When you test the wallet again, you should see:

1. **Object Types Found:**
   ```
   🔍 Object types found: ['0x2::coin::Coin<0x2::sui::SUI>', '0x2::kiosk::KioskOwnerCap', ...]
   ```

2. **If Still Failing:**
   ```
   🔍 KioskOwnerCap structure: {
     "objectId": "0x...",
     "type": "0x2::kiosk::KioskOwnerCap",
     "content": {
       "dataType": "moveObject",
       "fields": { ... }
     }
   }
   ```

3. **Diagnostic Results:**
   ```
   🔍 Wallet diagnosis: {
     hasObjects: true,
     hasKioskOwnerCap: true,
     objectTypes: [...],
     suggestions: [...]
   }
   ```

### Step 2: Analyze the Structure

The debug logs will show exactly how the KioskOwnerCap is structured, allowing us to:
- ✅ See if `fields.kiosk` exists
- ✅ Check if the structure is nested differently
- ✅ Identify alternative field names
- ✅ Understand data type issues

### Step 3: Common Solutions

Based on the structure revealed, possible fixes:

**If fields are nested:**
```typescript
kioskId = content.fields?.data?.kiosk || content.fields?.value?.kiosk;
```

**If using different field name:**
```typescript
kioskId = content.fields?.kiosk_id || content.fields?.kioskId;
```

**If wrapped in additional structure:**
```typescript
kioskId = content.fields?.inner?.kiosk || content.fields?.content?.kiosk;
```

## 🧪 Test Cases

### Test 1: Fresh Wallet (No Kiosk)
**Expected:** Clear error message and suggestions to create kiosk

### Test 2: Wallet with Kiosk but No NFT
**Expected:** Kiosk found, but no TherapistNFT error with mint suggestion

### Test 3: Wallet with Kiosk and NFT
**Expected:** Successful extraction of therapist ID

## 📋 Next Steps

1. **Test the updated function** and check console logs
2. **Share the debug output** if still failing
3. **Based on structure**, we can add specific handling
4. **Consider alternative approaches** if data structure is fundamentally different

## 🔧 Manual Testing

You can also test the diagnostic function directly:

```typescript
import { diagnosePotentialKioskIssues } from '@/lib/therapistWalletService';

const diagnosis = await diagnosePotentialKioskIssues('0x1f6f963c8a5ec87801f1199a7390d211f1c60d3c1e6f8adbfefc6a04716c9bd9');
console.log(diagnosis);
```

This enhanced approach should either fix the extraction or provide clear debugging information to identify exactly what's different about the KioskOwnerCap structure in your case.
