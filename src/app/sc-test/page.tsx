"use client";

import { useState, useEffect } from "react";
import { 
  useCurrentAccount, 
  useSignAndExecuteTransaction,
  useSuiClient
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { SuiClient } from "@mysten/sui.js/client";
import { ConnectWallet } from "@/components/wallet/ConnectWallet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  Check, 
  Clock, 
  X, 
  Plus, 
  ExternalLink, 
  DollarSign, 
  ShoppingBag,
  List,
  Calendar,
  Trash2,
  Star
} from "lucide-react";

// Constants
const PACKAGE_ID = "0x7dee12dcb0e9afc507ef32e7741f18009f30ffbabe9fabdf53c2a4331793a76e";
const NETWORK = "testnet";
const EXPLORER_URL = "https://suiscan.xyz/testnet";

export default function SmartContractTest() {
  // Updated wallet hooks from dapp-kit
  const account = useCurrentAccount();
const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();  const suiClient = useSuiClient();
  // Add this with your other state variables
const [useSpecificAddress, setUseSpecificAddress] = useState(false);
const specificWalletAddress = "0x40bd8248e692f15c0eff9e7cf79ca4f399964adc42c98ba44e38d5d23130106b";
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [transactions, setTransactions] = useState<string[]>([]);
  const [userKiosks, setUserKiosks] = useState<any[]>([]);
  const [userNfts, setUserNfts] = useState<any[]>([]);
  const [listedServices, setListedServices] = useState<any[]>([]);
  const [rentedServices, setRentedServices] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshingKiosks, setRefreshingKiosks] = useState(false);
  const [manualCapId, setManualCapId] = useState("");

  // Pre-minted NFT listing form state
  const [premintedNftId, setPremintedNftId] = useState<string>("");
  const [kioskIdInput, setKioskIdInput] = useState<string>("");
  const [kioskCapIdInput, setKioskCapIdInput] = useState<string>("");
  const [listPriceSui, setListPriceSui] = useState<string>("1");
  const [listTxDigest, setListTxDigest] = useState<string | null>(null);
  // Buy from kiosk form state
  const [buyItemId, setBuyItemId] = useState<string>("");
  const [buyKioskId, setBuyKioskId] = useState<string>("");
  const [buyPolicyId, setBuyPolicyId] = useState<string>(process.env.NEXT_PUBLIC_TRANSFER_POLICY_ID || "");
  const [buyPriceSui, setBuyPriceSui] = useState<string>("");
  const [buyTxDigest, setBuyTxDigest] = useState<string | null>(null);
  // 
  

  // NFT mint form state
  const [nftForm, setNftForm] = useState({
    name: "Dr. Sarah Johnson",
    specialization: "Anxiety, Depression, PTSD",
    credentials: "PhD Psychology, Licensed Therapist",
    yearsExperience: "15",
    bio: "Specialized in cognitive behavioral therapy with 15 years of experience.",
    sessionTypes: "Individual, Couples",
    languages: "English, Spanish",
    rating: "95",
    totalSessions: "2",
    profileImageUrl: "https://example.com/image.jpg",
    certificationUrl: "https://example.com/cert.pdf"
  });

  // For selecting items in UI
  const [selectedNft, setSelectedNft] = useState<string | null>(null);
  const [selectedKiosk, setSelectedKiosk] = useState<string | null>(null);
  const [selectedListing, setSelectedListing] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);

  // Load user's data when wallet connects
  useEffect(() => {
    if (account) {
      fetchUserKiosks();
      fetchUserNfts();
      fetchListedServices();
      fetchRentedServices();
    }
  }, [account]);

  // Helper function to start loading state
  const startLoading = (operation: string) => {
    setError(null);
    setLoading(prev => ({ ...prev, [operation]: true }));
  };

  // Helper function to end loading state
  const endLoading = (operation: string) => {
    setLoading(prev => ({ ...prev, [operation]: false }));
  };

  // Basic 0x-hex object id validator (1-64 hex chars after 0x)
  const isValidObjectId = (value: string | undefined | null): boolean => {
    const v = (value || "").trim();
    return /^0x[0-9a-fA-F]{1,64}$/.test(v);
  };

  // Convert SUI (string, allows decimals) to MIST (u64 bigint)
  const suiToMist = (sui: string): bigint => {
    const trimmed = (sui || "").trim();
    if (!trimmed) return BigInt(0);
    const neg = trimmed.startsWith("-");
    if (neg) throw new Error("Price must be positive");
    const [wholeRaw, fracRaw = ""] = trimmed.split(".");
    const whole = wholeRaw.replace(/[^0-9]/g, "") || "0";
    const frac = (fracRaw.replace(/[^0-9]/g, "") + "000000000").slice(0, 9);
    return BigInt(whole) * BigInt("1000000000") + BigInt(frac || "0");
  };

// Update your handleTxResult function to safely handle different response formats
const handleTxResult = (result: any, operation: string) => {
  console.log(`${operation} result:`, result); // Add logging to see the actual structure
  
  // Check if transaction was successful using a more robust approach
  const isSuccess = result?.effects?.status?.status === "success" || 
                   result?.status === "success" || 
                   result?.digest; // If we have a digest, assume success
  
  if (isSuccess) {
    // Add transaction to history if we have a digest
    if (result?.digest) {
      setTransactions(prev => [result.digest, ...prev]);
    }
    
    // Update relevant data
    setTimeout(() => {
      fetchUserKiosks();
      fetchUserNfts();
      fetchListedServices();
      fetchRentedServices();
    }, 2000); // Small delay to allow indexing
    // Extra refresh for slower indexers
    setTimeout(() => {
      fetchUserKiosks();
    }, 6000);
  } else {
    // Extract error message using a more flexible approach
    const errorMessage = result?.effects?.status?.error || 
                        result?.error?.message || 
                        "Unknown error";
    setError(`${operation} failed: ${errorMessage}`);
  }
  
  endLoading(operation);
};

// Create a new kiosk via your package entry fun (handles share + cap transfer)
const createKiosk = async () => {
  if (!account) return;
  startLoading("createKiosk");

  try {
    const tx = new Transaction();
    if (useSpecificAddress) tx.setSender(specificWalletAddress);

    // Call your module's entry fun that internally: kiosk::new + share + transfer cap
    tx.moveCall({
      target: `${PACKAGE_ID}::nft_rental::new_kiosk`,
      arguments: [],
    });

    console.log("Executing create kiosk transaction...");

    signAndExecuteTransaction(
      { transaction: tx },
      {
        onSuccess: (result) => {
          console.log("Create kiosk result:", result);
          handleTxResult(result, "Create Kiosk");
        },
        onError: (e: any) => {
          setError(`Error creating kiosk: ${e?.message || e}`);
          endLoading("createKiosk");
        },
      },
    );
  } catch (e: any) {
    console.error("Error creating kiosk:", e);
    setError(`Error creating kiosk: ${e.message}`);
    endLoading("createKiosk");
  }
};

  // Rental features removed; no extension installation is needed.

  // List a pre-minted NFT on a kiosk (standard kiosk: place + list)
  const listNftForSaleOnKiosk = async () => {
    if (!account) return;
    startLoading("listNftForSale");
    setListTxDigest(null);
    try {
      if (!premintedNftId || !kioskIdInput || !kioskCapIdInput) {
        throw new Error("Provide NFT ID, Kiosk ID, and Kiosk OwnerCap ID");
      }

      // Resolve object type from chain to supply as the type argument for kiosk calls
      const nftId = premintedNftId.trim();
      const kioskId = kioskIdInput.trim();
      const capId = kioskCapIdInput.trim();

      // Early validation for common copy/paste mistakes
      if (!isValidObjectId(nftId)) {
        throw new Error(`Invalid NFT Object ID format. Expected 0x-prefixed hex, got: ${nftId || '<empty>'}`);
      }
      if (!isValidObjectId(kioskId)) {
        throw new Error(`Invalid Kiosk ID format. Expected 0x-prefixed hex, got: ${kioskId || '<empty>'}`);
      }
      if (!isValidObjectId(capId)) {
        throw new Error(`Invalid Kiosk OwnerCap ID format. Expected 0x-prefixed hex, got: ${capId || '<empty>'}`);
      }
      if (kioskId.toLowerCase() === capId.toLowerCase()) {
        throw new Error("Kiosk ID and OwnerCap ID cannot be the same value.");
      }
  const obj = await suiClient.getObject({
        id: nftId,
        options: { showType: true, showOwner: true, showContent: true },
      } as any);

      // On current RPC, showType puts the type at data.type (not data.content.type)
      const nftType = (obj as any)?.data?.type || (obj as any)?.data?.content?.type;
      if (!nftType || typeof nftType !== "string") {
        throw new Error("Unable to resolve NFT type; ensure the object exists and you are the owner.");
      }

      // Ensure ownership
      const ownerAddr = (obj as any)?.data?.owner?.AddressOwner as string | undefined;
      if (!ownerAddr || ownerAddr.toLowerCase() !== account.address.toLowerCase()) {
        throw new Error("You must own the NFT to place it into your kiosk.");
      }

      // Verify the OwnerCap actually belongs to the provided kiosk (common mismatch)
      const capObj = await suiClient.getObject({ id: capId, options: { showContent: true, showType: true } } as any);
      const capType = (capObj as any)?.data?.type as string | undefined;
      if (!capType) throw new Error("Unable to resolve OwnerCap type.");
      if (!capType.endsWith("::kiosk::KioskOwnerCap")) {
        throw new Error(`OwnerCap type unsupported for this flow. Expected 0x2::kiosk::KioskOwnerCap, got: ${capType}. Please create a new kiosk using the Create New Kiosk button and use its OwnerCap.`);
      }
      const fields: any = (capObj as any)?.data?.content?.fields || {};
      const capKioskId: string | undefined = (fields.kiosk || fields.kiosk_id || fields.for) as any;
      if (!capKioskId) {
        throw new Error("OwnerCap did not expose the kiosk field. Ensure the OwnerCap ID is correct and on the same network.");
      }
      if (capKioskId.toLowerCase() !== kioskId.toLowerCase()) {
        throw new Error("The provided OwnerCap does not correspond to the provided Kiosk ID.");
      }

      console.log("Listing debug:", { nftId, kioskId, capId, nftType });

      // Ensure the NFT is the expected TherapistNFT type from this package
      if (!nftType.endsWith("::therapist_nft::TherapistNFT") || !nftType.startsWith(PACKAGE_ID)) {
        throw new Error(`NFT type mismatch. Expected ${PACKAGE_ID}::therapist_nft::TherapistNFT, got: ${nftType}`);
      }

      const priceMist = suiToMist(listPriceSui);
  if (priceMist <= BigInt(0)) throw new Error("Price must be greater than 0");

      const tx = new Transaction();
      // Set an explicit gas budget to avoid budget inference issues on some wallets/RPCs
      try {
        tx.setGasBudget(BigInt("50000000") as any);
      } catch {
        // Fallback for environments expecting number
        // @ts-ignore
        tx.setGasBudget(50_000_000);
      }

      // Resolve kiosk as a shared, mutable object reference (required by &mut Kiosk parameters)
      const kioskObj = await suiClient.getObject({ id: kioskId, options: { showOwner: true, showType: true } } as any);
      const kioskType = (kioskObj as any)?.data?.type as string | undefined;
      if (!kioskType || !kioskType.endsWith("::kiosk::Kiosk")) {
        throw new Error(`Kiosk type mismatch. Expected 0x2::kiosk::Kiosk, got: ${kioskType}`);
      }
      const sharedMeta: any = (kioskObj as any)?.data?.owner?.Shared || (kioskObj as any)?.data?.owner?.shared;
      const initialSharedVersion = sharedMeta?.initial_shared_version ?? sharedMeta?.initialSharedVersion;
      if (!initialSharedVersion) {
        throw new Error("Kiosk is not a shared object or not found. Ensure the Kiosk ID is correct.");
      }
      const kioskRef = tx.sharedObjectRef({
        objectId: kioskId,
        initialSharedVersion: String(initialSharedVersion),
        mutable: true,
      });

      // Single entry call in your module: requires ownership, places then lists
      tx.moveCall({
        target: `${PACKAGE_ID}::nft_rental::list_for_sale`,
        arguments: [
          kioskRef,
          tx.object(capId),
          tx.object(nftId),
          tx.pure.u64(priceMist),
        ],
      });

      // Preflight with dev-inspect to catch VM errors early
      try {
        // @ts-ignore
        const inspect = await (suiClient as any).devInspectTransactionBlock?.({
          sender: account.address,
          transactionBlock: tx,
        });
        const err = (inspect as any)?.effects?.status?.error || (inspect as any)?.error;
        if (err) {
          throw new Error(`Preflight failed: ${err}`);
        }
      } catch (preErr: any) {
        // Surface the error and stop to avoid burning gas on a known-bad tx
        setError(String(preErr?.message || preErr));
        endLoading("listNftForSale");
        return;
      }

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: (result) => {
            setListTxDigest((result as any)?.digest ?? null);
            handleTxResult(result, "List NFT for Sale");
          },
          onError: (e: any) => {
            setError(`Error listing NFT: ${e?.message || e}`);
            endLoading("listNftForSale");
          },
        },
      );
    } catch (e: any) {
      setError(e?.message || String(e));
      endLoading("listNftForSale");
    }
  };

  // Zero-rule TransferPolicy is created/shared at package init; paste its ID in the Buy form.

  // Buy a listed NFT from a kiosk (standard kiosk purchase)
  const buyNftFromKiosk = async () => {
    if (!account) return;
    startLoading("buyNft");
    setBuyTxDigest(null);
    try {
  const itemId = buyItemId.trim();
  const kioskId = buyKioskId.trim();
  const policyId = buyPolicyId.trim();
  if (!itemId || !kioskId) throw new Error("Provide Item (NFT) ID and Kiosk ID");
  if (!policyId) throw new Error("Provide the shared TransferPolicy<TherapistNFT> ID (created at package init)");
      // Early input validation for 0x-hex formatting
      if (!isValidObjectId(itemId)) {
        throw new Error(`Invalid Item (NFT) ID format. Expected 0x-prefixed hex, got: ${itemId || '<empty>'}`);
      }
      if (!isValidObjectId(kioskId)) {
        throw new Error(`Invalid Kiosk ID format. Expected 0x-prefixed hex, got: ${kioskId || '<empty>'}`);
      }
      if (!isValidObjectId(policyId)) {
        throw new Error(`Invalid Transfer Policy ID format. Expected 0x-prefixed hex, got: ${policyId || '<empty>'}`);
      }
      if (!buyPriceSui.trim()) throw new Error("Provide the listing price in SUI");

      // Resolve NFT type for the purchase type argument
      const obj = await suiClient.getObject({
        id: itemId,
        options: { showType: true, showContent: true, showOwner: true },
      } as any);
      const nftType = (obj as any)?.data?.type || (obj as any)?.data?.content?.type;
      if (!nftType || typeof nftType !== "string") {
        throw new Error("Unable to resolve NFT type. Confirm the item ID and network.");
      }

      // Ensure the NFT is the expected TherapistNFT from this package
      if (!nftType.endsWith("::therapist_nft::TherapistNFT") || !nftType.startsWith(PACKAGE_ID)) {
        throw new Error(`NFT type mismatch. Expected ${PACKAGE_ID}::therapist_nft::TherapistNFT, got: ${nftType}`);
      }

      // Advisory check: item should be owned by the kiosk when listed; if not, continue and let devInspect/purchase validate
      const owner = (obj as any)?.data?.owner;
      const kioskOwnerId: string | undefined = (owner && (owner as any).ObjectOwner) ? (owner as any).ObjectOwner : undefined;
      if (!kioskOwnerId || kioskOwnerId.toLowerCase() !== kioskId.toLowerCase()) {
        console.warn("Item owner is not the provided kiosk. Proceeding; purchase will fail if not actually listed.", { kioskOwnerId, kioskId });
      }

      const priceMist = suiToMist(buyPriceSui);
      if (priceMist <= BigInt(0)) throw new Error("Price must be greater than 0");

      const tx = new Transaction();
      try {
        tx.setGasBudget(BigInt("50000000") as any);
      } catch {
        // @ts-ignore
        tx.setGasBudget(50_000_000);
      }

      // Create the payment coin equal to the listing price from gas
      const [payment] = tx.splitCoins(tx.gas, [tx.pure.u64(priceMist)]);

      // Resolve kiosk as a shared, mutable object reference
      const kioskObj = await suiClient.getObject({ id: kioskId, options: { showOwner: true, showType: true } } as any);
      const kioskType = (kioskObj as any)?.data?.type as string | undefined;
      if (!kioskType || !kioskType.endsWith("::kiosk::Kiosk")) {
        throw new Error(`Kiosk type mismatch. Expected 0x2::kiosk::Kiosk, got: ${kioskType}`);
      }
      const sharedMeta: any = (kioskObj as any)?.data?.owner?.Shared || (kioskObj as any)?.data?.owner?.shared;
      const initialSharedVersion = sharedMeta?.initial_shared_version ?? sharedMeta?.initialSharedVersion;
      if (!initialSharedVersion) {
        throw new Error("Kiosk is not a shared object or not found. Ensure the Kiosk ID is correct.");
      }
      const kioskRef = tx.sharedObjectRef({
        objectId: kioskId,
        initialSharedVersion: String(initialSharedVersion),
        mutable: true,
      });

      // Resolve TransferPolicy<TherapistNFT> as a shared, immutable reference
      const tpObj = await suiClient.getObject({ id: policyId, options: { showOwner: true, showType: true } } as any);
      const tpType = (tpObj as any)?.data?.type as string | undefined;
      const expectedTp = `0x2::transfer_policy::TransferPolicy<${PACKAGE_ID}::therapist_nft::TherapistNFT>`;
      if (!tpType || tpType !== expectedTp) {
        throw new Error(`TransferPolicy type mismatch. Expected ${expectedTp}, got: ${tpType}`);
      }
      const tpShared: any = (tpObj as any)?.data?.owner?.Shared || (tpObj as any)?.data?.owner?.shared;
      const tpInitialSharedVersion = tpShared?.initial_shared_version ?? tpShared?.initialSharedVersion;
      if (!tpInitialSharedVersion) {
        throw new Error("TransferPolicy is not shared. Provide the shared policy ID created at package init.");
      }
      const tpRef = tx.sharedObjectRef({
        objectId: policyId,
        initialSharedVersion: String(tpInitialSharedVersion),
        mutable: false,
      });

      // Call your module buy entry: kiosk, TransferPolicy, item_id, payment
      tx.moveCall({
        target: `${PACKAGE_ID}::nft_rental::buy`,
        arguments: [
          kioskRef,
          tpRef,
          tx.pure.id(itemId),
          payment,
        ],
      });

      // Preflight with dev-inspect to catch VM errors early
      try {
        // @ts-ignore
        const inspect = await (suiClient as any).devInspectTransactionBlock?.({
          sender: account.address,
          transactionBlock: tx,
        });
        const err = (inspect as any)?.effects?.status?.error || (inspect as any)?.error;
        if (err) {
          throw new Error(`Preflight failed: ${err}`);
        }
      } catch (preErr: any) {
        setError(String(preErr?.message || preErr));
        endLoading("buyNft");
        return;
      }

  // No manual transfer needed; contract transfers NFT to buyer after confirming policy

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: (result) => {
            setBuyTxDigest((result as any)?.digest ?? null);
            handleTxResult(result, "Buy NFT");
          },
          onError: (e: any) => {
            // Surface a friendlier message for common aborts
            const msg = String(e?.message || e);
            if (msg.includes("kiosk::purchase") && msg.includes("MoveAbort")) {
              setError("Purchase aborted. Likely causes: wrong Kiosk ID/Item ID, or payment not equal to price. Confirm details and try again.");
            } else {
              setError(`Error buying NFT: ${msg}`);
            }
            endLoading("buyNft");
          },
        },
      );
    } catch (e: any) {
      setError(e?.message || String(e));
      endLoading("buyNft");
    }
  };

// Mint a therapist NFT
const mintTherapistNft = async () => {
  if (!account) return;
  startLoading("mintNft");

  try {
    // Validate input values first
    const yearsExp = parseInt(nftForm.yearsExperience);
    const rating = parseInt(nftForm.rating);
    const totalSessions = parseInt(nftForm.totalSessions);

    // Validation for your specific ranges
    if (isNaN(yearsExp) || yearsExp < 1 || yearsExp > 50) {
      setError("Years of experience must be between 1 and 50");
      endLoading("mintNft");
      return;
    }

    if (isNaN(rating) || rating < 0 || rating > 100) {
      setError("Rating must be between 0 and 100");
      endLoading("mintNft");
      return;
    }

    if (isNaN(totalSessions) || totalSessions < 1 || totalSessions > 100) {
      setError("Total sessions must be between 1 and 100");
      endLoading("mintNft");
      return;
    }

    console.log("Validated values:", { yearsExp, rating, totalSessions });

    const tx = new Transaction();
    
    console.log("Building mint transaction...");
    
    tx.moveCall({
      target: `${PACKAGE_ID}::therapist_nft::mint`,
      arguments: [
        tx.pure.string(nftForm.name),
        tx.pure.string(nftForm.specialization),
        tx.pure.string(nftForm.credentials),
        tx.pure.u64(yearsExp),        
        tx.pure.string(nftForm.bio),
        tx.pure.string(nftForm.sessionTypes),
        tx.pure.string(nftForm.languages),
        tx.pure.u64(rating),          
        tx.pure.u64(totalSessions),   
        tx.pure.string(nftForm.profileImageUrl),
        tx.pure.string(nftForm.certificationUrl)
      ],
    });

// TODO: (shawn look here) -> change smart contract to u8 instead u64 (too big)

    console.log("transaction", tx);
    
    signAndExecuteTransaction(
      {
        transaction: tx,
      },
      {
        onSuccess: (result) => {
          console.log("Transaction successful:", result);
          handleTxResult(result, "Mint NFT");
        },
        onError: (error) => {
          console.error("Transaction failed:", error);
          setError(`Error minting NFT: ${error.message}`);
          endLoading("mintNft");
        }
      }
    );

  } catch (e: any) {
    console.error("Error minting NFT:", e);
    setError(`Error minting NFT: ${e.message}`);
    endLoading("mintNft");
  }
};
  // Rental features removed; use list_for_sale via listNftForSaleOnKiosk.

  // Rental features removed; delist/rent/borrow flows are not present in the simplified contract.

  // Rental features removed.

  // Rental features removed.

  // Rental features removed.

  // Rental features removed.

  // Rental features removed.

  // Fetch user's kiosks
  const fetchUserKiosks = async () => {
    if (!account) return;
    try {
      // Helper: fetch caps for a given StructType, and ensure we resolve fields.kiosk
      const fetchCaps = async (structType: string) => {
        const res = await suiClient.getOwnedObjects({
          owner: account.address,
          filter: { StructType: structType } as any,
          options: { showType: true, showContent: true },
        } as any);

        const items = res?.data || [];

        // Resolve kiosk field; if not present inline, fetch each object separately
        const resolved = await Promise.all(
          items.map(async (o: any) => {
            const ownerCapId = o?.data?.objectId;
            let kioskId = o?.data?.content?.fields?.kiosk;
            if (!ownerCapId) return null;
            if (!kioskId) {
              try {
                const obj = await suiClient.getObject({ id: ownerCapId, options: { showContent: true } } as any);
                kioskId = (obj as any)?.data?.content?.fields?.kiosk;
              } catch (e) {
                console.warn("Failed to resolve kiosk for cap:", ownerCapId, e);
              }
            }
            if (!kioskId) return null;
            return { id: kioskId as string, cap: ownerCapId as string, hasExtension: false };
          })
        );

        return resolved.filter(Boolean) as any[];
      };

      // Try both known type names to be safe across framework versions
  const [capsNew, capsOld] = await Promise.all([
        fetchCaps("0x2::kiosk::KioskOwnerCap"),
        fetchCaps("0x2::kiosk::OwnerCap"),
      ]);

      let discovered = [...capsNew, ...capsOld];

      // Fallback: some RPCs ignore StructType filter; do a paginated fetch then filter client-side
      if (discovered.length === 0) {
        console.log("Cap filter returned 0; falling back to paginated owned-objects fetch...");
        let cursor: string | null | undefined = undefined;
        const all: any[] = [];
        let page = 0;
        // Fetch up to 10 pages of 50 (Sui API max) to avoid infinite loops
        while (page < 10) {
          const resp = await suiClient.getOwnedObjects({
            owner: account.address,
            options: { showType: true },
            cursor,
            limit: 50,
          } as any);
          all.push(...(resp?.data || []));
          cursor = (resp as any)?.nextCursor;
          page += 1;
          if (!cursor) break;
        }
        console.log("Owned objects total:", all.length);
        const typeMatches = new Set([
          "0x2::kiosk::KioskOwnerCap",
          "0x2::kiosk::OwnerCap",
        ]);
        const caps = all.filter((o) => {
          const t = (o as any)?.data?.type as string | undefined;
          if (!t) return false;
          return (
            typeMatches.has(t) ||
            t.endsWith("::kiosk::KioskOwnerCap") ||
            t.endsWith("::kiosk::OwnerCap")
          );
        });
        console.log("Filtered caps (fallback):", caps.length);

        // Resolve kiosk ids
        discovered = (
          await Promise.all(
            caps.map(async (o: any) => {
              const capId = o?.data?.objectId;
              if (!capId) return null;
              try {
                const obj = await suiClient.getObject({ id: capId, options: { showContent: true } } as any);
                const kioskId = (obj as any)?.data?.content?.fields?.kiosk;
                if (!kioskId) return null;
                return { id: kioskId as string, cap: capId as string, hasExtension: false };
              } catch (e) {
                return null;
              }
            })
          )
        ).filter(Boolean) as any[];
      }

      const byKiosk = new Map<string, any>();
      discovered.forEach((k) => {
        if (!byKiosk.has(k.id)) byKiosk.set(k.id, k);
      });

      const kiosks = Array.from(byKiosk.values());
      console.log("Discovered kiosks:", kiosks);
      setUserKiosks(kiosks);
    } catch (error) {
      console.error("Error fetching user kiosks:", error);
    }
  };

  const refreshKiosks = async () => {
    if (!account) return;
    try {
      setRefreshingKiosks(true);
      await fetchUserKiosks();
    } finally {
      setRefreshingKiosks(false);
    }
  };

  const addKioskByOwnerCap = async () => {
    if (!account) return;
    const capId = manualCapId.trim();
    if (!capId) return;
    try {
      const obj = await suiClient.getObject({ id: capId, options: { showContent: true } } as any);
      const kioskId = (obj as any)?.data?.content?.fields?.kiosk;
      if (!kioskId) {
        setError("Could not resolve kiosk from OwnerCap. Check the ID and network.");
        return;
      }
      setUserKiosks((prev) => {
        if (prev.some((k) => k.id === kioskId)) return prev;
        const next = [...prev, { id: kioskId as string, cap: capId, hasExtension: false }];
        console.log("Manually added kiosk:", next);
        return next;
      });
      setManualCapId("");
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  };

  // Fetch user's NFTs
  const fetchUserNfts = async () => {
    if (!account) return;
    
    try {
      // In a real application, you'd query the blockchain for the user's NFTs
      // This is a mock implementation
      const mockNfts = [
        { 
          id: "0xnft1", 
          name: "Dr. Sarah Johnson",
          specialization: "Anxiety, Depression",
          rating: 95
        },
        { 
          id: "0xnft2", 
          name: "Dr. Michael Chen",
          specialization: "Family Therapy, Trauma",
          rating: 92
        }
      ];
      setUserNfts(mockNfts);
    } catch (error) {
      console.error("Error fetching user NFTs:", error);
    }
  };

  // Fetch listed services
  const fetchListedServices = async () => {
    try {
      // In a real application, you'd query the blockchain for listed services
      // This is a mock implementation
      const mockListings = [
        { 
          id: "0xlisting1",
          nftId: "0xnft1",
          name: "Dr. Sarah Johnson", 
          specialization: "Anxiety, Depression",
          kioskId: "0x123456",
          price30min: 5,
          price1hour: 10,
          rating: 95
        },
        { 
          id: "0xlisting2",
          nftId: "0xnft2", 
          name: "Dr. Michael Chen",
          specialization: "Family Therapy, Trauma",
          kioskId: "0x789012",
          price30min: 5,
          price1hour: 10,
          rating: 92
        }
      ];
      setListedServices(mockListings);
    } catch (error) {
      console.error("Error fetching listed services:", error);
    }
  };

  // Fetch rented services
  const fetchRentedServices = async () => {
    if (!account) return;
    
    try {
      // In a real application, you'd query the blockchain for the user's rented services
      // This is a mock implementation
      const mockRented = [
        { 
          id: "0xrental1",
          nftId: "0xnft1", 
          name: "Dr. Sarah Johnson",
          specialization: "Anxiety, Depression",
          sessionType: 1, // 30 minutes
          startTime: Date.now() - 600000, // 10 minutes ago
          endTime: Date.now() + 1200000,  // 20 minutes from now
          active: true
        }
      ];
      setRentedServices(mockRented);
    } catch (error) {
      console.error("Error fetching rented services:", error);
    }
  };

  // Generate SuiScan link for a transaction
  const getTxLink = (digest: string) => `${EXPLORER_URL}/tx/${digest}`;

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNftForm(prev => ({ ...prev, [name]: value }));
  };

  // Format address for display
  const formatAddress = (address: string) => {
    if (!address) return '';
    return address.length > 12 
      ? `${address.slice(0, 6)}...${address.slice(-4)}`
      : address;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/20 cyber-grid">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-6">
          TherapyFans <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Smart Contract Integration</span>
        </h1>

        {!account ? (
          <Card className="mb-8 border-0 glass border-glow hover:glow-purple">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-6">Connect your wallet to interact with the smart contracts</p>
                <div className="flex justify-center">
                  <ConnectWallet />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-lg mb-4 flex items-center">
                <X className="w-5 h-5 mr-2" />
                <p>{error}</p>
              </div>
            )}
            
            {/* Wallet Info */}
            <Card className="border-0 glass border-glow hover:glow-blue">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Connected Wallet</span>
                  <Badge variant="outline" className="font-mono">
                    {formatAddress(account.address)}
                  </Badge>
                </CardTitle>
              </CardHeader>
            </Card>


            {/* Kiosk Management */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="border-0 glass border-glow hover:glow-purple">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Kiosk Management</span>
                    <Button size="sm" variant="outline" onClick={refreshKiosks} disabled={refreshingKiosks}>
                      {refreshingKiosks ? (
                        <Clock className="w-3 h-3 mr-1 animate-spin" />
                      ) : null}
                      Refresh
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Paste OwnerCap ID (0x...)"
                      className="font-mono"
                      value={manualCapId}
                      onChange={(e) => setManualCapId(e.target.value)}
                    />
                    <Button variant="outline" onClick={addKioskByOwnerCap}>Add by OwnerCap</Button>
                  </div>
                  <Button 
                    onClick={createKiosk} 
                    disabled={loading.createKiosk}
                    className="w-full"
                  >
                    {loading.createKiosk ? (
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Create New Kiosk
                  </Button>

                  {userKiosks.length > 0 && (
                    <div className="mt-4 space-y-4">
                      <h3 className="text-sm font-medium text-muted-foreground">Your Kiosks:</h3>
                      {userKiosks.map(kiosk => (
                        <div 
                          key={kiosk.id} 
                          className={`p-3 rounded-lg border ${selectedKiosk === kiosk.id 
                            ? 'border-purple-500/50 bg-purple-500/10' 
                            : 'border-border bg-secondary/50'}`}
                          onClick={() => setSelectedKiosk(kiosk.id === selectedKiosk ? null : kiosk.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="flex flex-col">
                                <Badge variant="outline" className="font-mono w-fit">
                                  {formatAddress(kiosk.id)}
                                </Badge>
                                {kiosk.cap && (
                                  <span className="mt-1 text-xs text-muted-foreground font-mono break-all">Cap: {formatAddress(kiosk.cap)}</span>
                                )}
                              </div>
                              {kiosk.hasExtension && (
                                <Badge variant="secondary" className="ml-2">
                                  Rental Extension
                                </Badge>
                              )}
                            </div>
                            {/* Extension install removed in simplified buy/sell flow */}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* List Pre-minted NFT on Kiosk */}
              <Card className="border-0 glass border-glow hover:glow-orange">
                <CardHeader>
                  <CardTitle>List Pre-minted NFT on Kiosk</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">NFT Object ID</label>
                    <Input
                      value={premintedNftId}
                      onChange={(e) => setPremintedNftId(e.target.value)}
                      placeholder="0x... (your NFT object ID)"
                      className="mb-2 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Kiosk ID</label>
                      <Input
                        value={kioskIdInput}
                        onChange={(e) => setKioskIdInput(e.target.value)}
                        placeholder="0x... kiosk object ID"
                        className="font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Kiosk OwnerCap ID</label>
                      <Input
                        value={kioskCapIdInput}
                        onChange={(e) => setKioskCapIdInput(e.target.value)}
                        placeholder="0x... kiosk owner cap ID"
                        className="font-mono"
                      />
                    </div>
                  </div>

                  {selectedKiosk && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const kiosk = userKiosks.find((k) => k.id === selectedKiosk);
                          if (kiosk) {
                            setKioskIdInput(kiosk.id);
                            setKioskCapIdInput(kiosk.cap);
                          }
                        }}
                      >
                        Use Selected Kiosk
                      </Button>
                      <Badge variant="outline" className="font-mono">{formatAddress(selectedKiosk)}</Badge>
                    </div>
                  )}

                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Listing Price (SUI)</label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={listPriceSui}
                        type="text"
                        onChange={(e) => setListPriceSui(e.target.value)}
                        placeholder="e.g. 1.5"
                        className="w-full"
                      />
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" /> SUI
                      </Badge>
                    </div>
                  </div>

                  <Button
                    onClick={listNftForSaleOnKiosk}
                    disabled={loading.listNftForSale}
                    className="w-full"
                  >
                    {loading.listNftForSale ? (
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <List className="w-4 h-4 mr-2" />
                    )}
                    Place & List NFT for Sale
                  </Button>

                  {listTxDigest && (
                    <div className="text-sm mt-2">
                      <a
                        href={getTxLink(listTxDigest)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline flex items-center"
                      >
                        View listing tx on SuiScan
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Buy from Kiosk */}
              <Card className="border-0 glass border-glow hover:glow-green">
                <CardHeader>
                  <CardTitle>Buy from Kiosk</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Item (NFT) ID</label>
                      <Input
                        value={buyItemId}
                        onChange={(e) => setBuyItemId(e.target.value)}
                        placeholder="0x... listed NFT object ID"
                        className="font-mono"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Use the TherapistNFT object ID (not the dynamic field/listing child ID).</p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Kiosk ID</label>
                      <Input
                        value={buyKioskId}
                        onChange={(e) => setBuyKioskId(e.target.value)}
                        placeholder="0x... kiosk object ID"
                        className="font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Transfer Policy ID</label>
                    <Input
                      value={buyPolicyId}
                      onChange={(e) => setBuyPolicyId(e.target.value)}
                      placeholder="0x... TransferPolicy<TherapistNFT> (shared) ID"
                      className="font-mono"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Zero-rule policy is created/shared at package init. Paste its ID here.</p>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Price to Pay (SUI)</label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={buyPriceSui}
                        type="text"
                        onChange={(e) => setBuyPriceSui(e.target.value)}
                        placeholder="e.g. 1.5"
                        className="w-full"
                      />
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" /> SUI
                      </Badge>
                    </div>
                  </div>

                  <Button
                    onClick={buyNftFromKiosk}
                    disabled={loading.buyNft}
                    className="w-full"
                  >
                    {loading.buyNft ? (
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <ShoppingBag className="w-4 h-4 mr-2" />
                    )}
                    Buy NFT
                  </Button>

                  {buyTxDigest && (
                    <div className="text-sm mt-2">
                      <a
                        href={getTxLink(buyTxDigest)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline flex items-center"
                      >
                        View purchase tx on SuiScan
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Mint Therapist NFT */}
              <Card className="border-0 glass border-glow hover:glow-green">
                <CardHeader>
                  <CardTitle>Mint Therapist NFT</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Name</label>
                      <Input 
                        name="name" 
                        value={nftForm.name} 
                        onChange={handleInputChange} 
                        placeholder="Full name"
                        className="mb-2"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Specialization</label>
                      <Input 
                        name="specialization" 
                        value={nftForm.specialization} 
                        onChange={handleInputChange} 
                        placeholder="Anxiety, Depression, etc."
                        className="mb-2"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Years Experience</label>
                      <Input 
                        name="yearsExperience" 
                        value={nftForm.yearsExperience} 
                        onChange={handleInputChange} 
                        type="number"
                        className="mb-2"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Rating (0-100)</label>
                      <Input 
                        name="rating" 
                        value={nftForm.rating} 
                        onChange={handleInputChange} 
                        type="number"
                        min="0"
                        max="100"
                        className="mb-2"
                      />
                    </div>
                  </div>

                  <label className="text-xs text-muted-foreground mb-1 block">Bio</label>
                  <Input 
                    name="bio" 
                    value={nftForm.bio} 
                    onChange={handleInputChange} 
                    placeholder="Short bio"
                    className="mb-2"
                  />

                  <Button 
                    onClick={mintTherapistNft} 
                    disabled={loading.mintNft}
                    className="w-full"
                    variant="gradient"
                  >
                    {loading.mintNft ? (
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Mint Therapist NFT
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Your NFTs */}
            <Card className="border-0 glass border-glow hover:glow-blue">
              <CardHeader>
                <CardTitle>Your Therapist NFTs</CardTitle>
              </CardHeader>
              <CardContent>
                {userNfts.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No NFTs found. Mint a new Therapist NFT to get started.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userNfts.map(nft => (
                      <div 
                        key={nft.id}
                        className={`p-4 rounded-lg border ${selectedNft === nft.id 
                          ? 'border-blue-500/50 bg-blue-500/10' 
                          : 'border-border bg-secondary/50'}`}
                        onClick={() => setSelectedNft(nft.id === selectedNft ? null : nft.id)}
                      >
                        <div className="flex justify-between">
                          <div>
                            <h3 className="font-medium">{nft.name}</h3>
                            <p className="text-sm text-muted-foreground">{nft.specialization}</p>
                            <div className="flex items-center mt-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                              <span className="text-sm">{nft.rating/20} / 5</span>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <Badge variant="outline" className="font-mono">
                              {formatAddress(nft.id)}
                            </Badge>

                            {selectedNft === nft.id && selectedKiosk && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const kiosk = userKiosks.find(k => k.id === selectedKiosk);
                                  if (kiosk) {
                                    setPremintedNftId(nft.id);
                                    setKioskIdInput(kiosk.id);
                                    setKioskCapIdInput(kiosk.cap);
                                  }
                                }}
                                className="ml-auto"
                              >
                                <ShoppingBag className="w-3 h-3 mr-1" />
                                Fill Listing Form
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Listed Services */}
            <Card className="border-0 glass border-glow hover:glow-green">
              <CardHeader>
                <CardTitle>Listed Therapy Services</CardTitle>
              </CardHeader>
              <CardContent>
                {listedServices.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No services listed. List your Therapist NFT to make it available for booking.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {listedServices.map(listing => (
                      <div 
                        key={listing.id}
                        className={`p-4 rounded-lg border ${selectedListing === listing.id 
                          ? 'border-green-500/50 bg-green-500/10' 
                          : 'border-border bg-secondary/50'}`}
                        onClick={() => setSelectedListing(listing.id === selectedListing ? null : listing.id)}
                      >
                        <div className="flex justify-between">
                          <div>
                            <h3 className="font-medium">{listing.name}</h3>
                            <p className="text-sm text-muted-foreground">{listing.specialization}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <div className="flex items-center">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                                <span className="text-sm">{listing.rating/20} / 5</span>
                              </div>
                              <div className="text-sm">
                                <span className="text-muted-foreground">30min:</span>{" "}
                                <span className="font-medium text-green-400">{listing.price30min} SUI</span>
                              </div>
                              <div className="text-sm">
                                <span className="text-muted-foreground">1hr:</span>{" "}
                                <span className="font-medium text-green-400">{listing.price1hour} SUI</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant="outline" className="font-mono">
                              {formatAddress(listing.id)}
                            </Badge>

                            {/* Actions removed in simplified buy/sell flow */}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rental features removed; active sessions section omitted */}

            {/* Transaction History */}
            {transactions.length > 0 && (
              <Card className="border-0 glass border-glow hover:glow-blue">
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {transactions.map((digest, index) => (
                      <a 
                        key={index} 
                        href={getTxLink(digest)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-blue-500/50 hover:bg-blue-500/10 transition-colors"
                      >
                        <span className="font-mono text-sm text-muted-foreground">
                          {formatAddress(digest)}
                        </span>
                        <div className="flex items-center text-blue-400 text-sm">
                          View on SuiScan
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </div>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}