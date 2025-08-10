import { useEffect, useMemo, useState } from 'react';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { getTherapistNFTDetails } from '@/lib/therapistWalletService';
import { NETWORK } from '@/lib/suiConfig';

export interface TherapistNFTData {
  therapistId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  priceMist?: number | null;
  metadata?: Record<string, any>;
}

function toStringMaybeVector(value: any): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    try {
      return String.fromCharCode(...value);
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function deepFindPrice(fieldObj: any): number | null {
  try {
    const stack = [fieldObj];
    while (stack.length) {
      const cur = stack.pop();
      if (!cur) continue;
      if (typeof cur === 'object') {
        for (const [k, v] of Object.entries(cur)) {
          if (k.toLowerCase().includes('price')) {
            if (typeof v === 'number') return v;
            if (typeof v === 'string') {
              const parsed = parseInt(v, 10);
              if (!Number.isNaN(parsed)) return parsed;
            }
          }
          if (v && typeof v === 'object') stack.push(v as any);
        }
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export function useTherapistNFT(walletAddress?: string | null) {
  const [data, setData] = useState<TherapistNFTData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suiClient = useMemo(() => new SuiClient({ url: getFullnodeUrl(NETWORK as any) }), []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!walletAddress) return;
      setLoading(true);
      setError(null);
      try {
        // Fetch base NFT details
        const { therapistId, nftDetails } = await getTherapistNFTDetails(walletAddress);

        // Best-effort: discover listing price from kiosk (if listed)
        let priceMist: number | null = null;
        try {
          const owned = await suiClient.getOwnedObjects({
            owner: walletAddress,
            options: { showType: true, showContent: true },
          });
          const ownerCaps = (owned?.data || []).filter((o: any) =>
            o?.data?.type?.includes('::kiosk::KioskOwnerCap') || o?.data?.type?.includes('::kiosk::OwnerCap')
          );
          for (const cap of ownerCaps) {
            let kioskId: string | null = null;
            const fields = (cap?.data as any)?.content?.fields;
            kioskId = fields?.for || fields?.kiosk || null;
            if (!kioskId) {
              const capObj = await suiClient.getObject({ id: cap.data.objectId, options: { showContent: true } });
              const cfields = (capObj as any)?.data?.content?.fields;
              kioskId = cfields?.for || cfields?.kiosk || null;
            }
            if (!kioskId) continue;

            const dyn = await suiClient.getDynamicFields({ parentId: kioskId });
            for (const f of dyn.data || []) {
              try {
                const obj = await suiClient.getDynamicFieldObject({ parentId: kioskId, name: f.name });
                const price = deepFindPrice((obj as any)?.data?.content);
                // Heuristic: ensure this listing relates to our therapistId
                const containsOurId = JSON.stringify((obj as any)?.data?.content || {}).includes(therapistId);
                if (containsOurId && price !== null) {
                  priceMist = price;
                  break;
                }
              } catch {
                // ignore field errors
              }
            }
            if (priceMist !== null) break;
          }
        } catch {
          // ignore price errors, fallback to null
        }

        const imageUrl = toStringMaybeVector(nftDetails.profile_image_url);
        const description = toStringMaybeVector(nftDetails.bio);

        const result: TherapistNFTData = {
          therapistId,
          name: nftDetails.name,
          description: description,
          imageUrl: imageUrl,
          priceMist,
          metadata: nftDetails as any,
        };
        if (!cancelled) setData(result);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load therapist NFT');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [walletAddress, suiClient]);

  return { data, loading, error } as const;
}

export default useTherapistNFT;


