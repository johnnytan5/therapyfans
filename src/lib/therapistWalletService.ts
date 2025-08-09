import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import type { SuiObjectResponse } from '@mysten/sui/client';
import { PACKAGE_ID, SUI_TYPES, NETWORK } from './suiConfig';

interface KioskOwnerCap {
  objectId: string;
  type: string;
  fields: {
    kiosk: string;
  };
}

interface KioskObject {
  objectId: string;
  type: string;
  fields: {
    id: { id: string };
    item_count: string;
    profits: {
      type: string;
      fields: {
        value: string;
      };
    };
  };
}

interface TherapistNFT {
  objectId: string;
  type: string;
  fields: {
    id: { id: string };
    name: string;
    specialization: string;
    credentials: string;
    years_experience: string;
    bio: string;
    session_types: string;
    languages: string;
    rating: string;
    total_sessions: string;
    profile_image_url: string;
    certification_url: string;
  };
}

interface KioskContentsResponse {
  data: Array<{
    objectId: string;
    type: string;
  }>;
}

// Configuration - using centralized config
const THERAPIST_NFT_TYPE = SUI_TYPES.therapistNft;

// Support both old and new package IDs for backward compatibility
const NEW_PACKAGE_ID = PACKAGE_ID;

// Helper function to check if a type is a TherapistNFT (supports both old and new package IDs)
function isTherapistNFTType(objectType: string): boolean {
  return objectType?.includes('::therapist_nft::TherapistNFT') || 
         objectType?.includes(THERAPIST_NFT_TYPE);
}

/**
 * Debug helper to log object structure in a readable format
 */
function debugLogObject(label: string, obj: any) {
  console.log(`🔍 ${label}:`, JSON.stringify(obj, (key, value) => {
    // Truncate very long strings to keep output readable
    if (typeof value === 'string' && value.length > 100) {
      return value.substring(0, 100) + '...[truncated]';
    }
    return value;
  }, 2));
}

/**
 * Retrieves a therapist's ID from their TherapistNFT stored in their kiosk
 * 
 * @param therapistWalletAddress - The Sui wallet address of the therapist
 * @returns Promise<string> - The therapist_id from the TherapistNFT
 * @throws Error if wallet has no kiosk, kiosk has no TherapistNFT, or any RPC error occurs
 */
export async function getTherapistIdFromWallet(therapistWalletAddress: string): Promise<string> {
  try {
    // Validate wallet address format
    if (!therapistWalletAddress) {
      throw new Error('Wallet address is required');
    }
    
    if (!therapistWalletAddress.startsWith('0x')) {
      throw new Error(`Invalid wallet address format: expected address starting with 0x, got: ${therapistWalletAddress}`);
    }
    
    if (therapistWalletAddress.length !== 66) {
      throw new Error(`Invalid wallet address length: expected 66 characters, got: ${therapistWalletAddress.length}`);
    }

    // Initialize Sui client
    const suiClient = new SuiClient({ url: getFullnodeUrl(NETWORK as any) });

    console.log(`🔍 Querying objects for wallet: ${therapistWalletAddress}`);

    // Step 1: Query all objects owned by the therapist wallet
    const ownedObjectsResponse = await suiClient.getOwnedObjects({
      owner: therapistWalletAddress,
      options: {
        showType: true,
        showContent: true,
      },
    });

    if (!ownedObjectsResponse.data || ownedObjectsResponse.data.length === 0) {
      throw new Error('No objects found for this wallet address');
    }

    console.log(`📦 Found ${ownedObjectsResponse.data.length} objects`);
    
    // Debug: log all object types to understand what we have
    console.log('🔍 Object types found:', ownedObjectsResponse.data.map(obj => obj.data?.type).filter(Boolean));
    
    // First, check if there's a TherapistNFT directly owned by the wallet (not in kiosk)
    const directTherapistNFTs = ownedObjectsResponse.data.filter((obj) => {
      return obj.data?.type && isTherapistNFTType(obj.data.type);
    });
    
    if (directTherapistNFTs.length > 0) {
      const directNFT = directTherapistNFTs[0];
      console.log(`✅ Found direct TherapistNFT owned by wallet: ${directNFT.data?.objectId}`);
      console.log(`🏷️ Direct therapist ID ready for soulbound minting: ${directNFT.data?.objectId}`);
      return directNFT.data!.objectId;
    }

    // Step 2: Find KioskOwnerCap objects - there might be multiple
    const kioskOwnerCaps = ownedObjectsResponse.data.filter((obj) => {
      return obj.data?.type?.includes('::kiosk::KioskOwnerCap') || obj.data?.type?.includes('::kiosk::OwnerCap');
    });

    if (kioskOwnerCaps.length === 0) {
      throw new Error('No KioskOwnerCap found for this wallet - therapist may not have a kiosk');
    }

    console.log(`🏪 Found ${kioskOwnerCaps.length} KioskOwnerCap(s)`);
    
    // Try each kiosk until we find one with a TherapistNFT
    for (let i = 0; i < kioskOwnerCaps.length; i++) {
      const kioskOwnerCap = kioskOwnerCaps[i];
      console.log(`🔍 Checking kiosk ${i + 1}/${kioskOwnerCaps.length}...`);
      
      if (!kioskOwnerCap || !kioskOwnerCap.data) {
        console.warn(`⚠️ Invalid KioskOwnerCap object at index ${i}`);
        continue;
      }

      // Step 3: Extract kiosk_id from KioskOwnerCap with robust field extraction
      let kioskId = null;
      
      // Try to get kiosk ID from content fields first
      if (kioskOwnerCap.data.content && 'fields' in kioskOwnerCap.data.content) {
        const fields = kioskOwnerCap.data.content.fields as any;
        // KioskOwnerCap uses "for" field to reference the kiosk ID
        kioskId = fields.for || fields.kiosk;
      }
      
      // If not found in content fields, try fetching the object separately
      if (!kioskId) {
        console.log('🔍 Kiosk ID not found in content fields, fetching object separately...');
        try {
          const ownerCapObj = await suiClient.getObject({ 
            id: kioskOwnerCap.data.objectId, 
            options: { showContent: true } 
          });
          
          if (ownerCapObj.data?.content && 'fields' in ownerCapObj.data.content) {
            const content = ownerCapObj.data.content as any;
            kioskId = content.fields?.for || content.fields?.kiosk;
          }
        } catch (error) {
          console.warn('Failed to fetch KioskOwnerCap object separately:', error);
        }
      }

      if (!kioskId) {
        console.warn(`⚠️ Could not extract kiosk ID from KioskOwnerCap ${i + 1}`);
        continue;
      }

      console.log(`🏪 Found kiosk ID: ${kioskId}`);
      console.log(`🏪 Selected from KioskOwnerCap: ${kioskOwnerCap.data.objectId}`);

      // Try to find TherapistNFT in this kiosk
      try {
        const therapistId = await findTherapistNFTInKiosk(suiClient, kioskId);
        if (therapistId) {
          return therapistId;
        }
      } catch (error) {
        console.warn(`⚠️ Error checking kiosk ${kioskId}:`, error);
        // Continue to next kiosk
      }
    }
    
    // If we get here, no kiosk contained a TherapistNFT
    throw new Error(`No TherapistNFT found in any of the ${kioskOwnerCaps.length} kiosks`);
  } catch (error) {
    console.error('❌ Error in getTherapistIdFromWallet:', error);
    
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(`Unexpected error: ${String(error)}`);
    }
  }
}

/**
 * Helper function to find TherapistNFT in a specific kiosk
 */
async function findTherapistNFTInKiosk(suiClient: SuiClient, kioskId: string): Promise<string | null> {
  try {
    console.log(`🔍 Checking kiosk ${kioskId} for TherapistNFT...`);

    // Query the kiosk object to get its contents
    const kioskResponse = await suiClient.getObject({
      id: kioskId,
      options: {
        showContent: true,
      },
    });

    if (!kioskResponse.data) {
      console.warn(`⚠️ Could not fetch kiosk object ${kioskId}`);
      return null;
    }

    // Get dynamic fields of the kiosk to find stored items
    const dynamicFieldsResponse = await suiClient.getDynamicFields({
      parentId: kioskId,
    });

    if (!dynamicFieldsResponse.data || dynamicFieldsResponse.data.length === 0) {
      console.log(`📋 Kiosk ${kioskId} has no items stored`);
      return null;
    }

    console.log(`📋 Found ${dynamicFieldsResponse.data.length} items in kiosk ${kioskId}`);

    // Look through dynamic fields to find TherapistNFT
    for (const field of dynamicFieldsResponse.data) {
      try {
        // Get the dynamic field object
        const fieldResponse = await suiClient.getDynamicFieldObject({
          parentId: kioskId,
          name: field.name,
        });

        if (fieldResponse.data?.content) {
          const fieldContent = fieldResponse.data.content as any;
          
          console.log(`🔍 Checking dynamic field content:`, {
            fieldType: fieldContent.type,
            hasValue: !!fieldContent.fields?.value,
            valueFields: fieldContent.fields?.value ? Object.keys(fieldContent.fields.value) : null
          });
          
          // Check if this field contains a TherapistNFT directly
          if (fieldContent.type && isTherapistNFTType(fieldContent.type)) {
            const therapistId = fieldResponse.data.objectId;
            console.log(`✅ Found direct TherapistNFT in kiosk ${kioskId}: ${therapistId}`);
            console.log(`🏷️ Therapist ID ready for soulbound minting: ${therapistId}`);
            return therapistId;
          }

          // Check if it's a kiosk item wrapper containing the NFT
          if (fieldContent.fields?.value) {
            const value = fieldContent.fields.value;
            
            // The actual TherapistNFT object ID should be in the value field
            if (value.type && isTherapistNFTType(value.type)) {
              // For kiosk items, the actual NFT object ID is usually stored differently
              // Let's try to get the object ID from the value
              let actualTherapistId = null;
              
              if (value.fields?.id?.id) {
                actualTherapistId = value.fields.id.id;
              } else if (typeof value.fields?.id === 'string') {
                actualTherapistId = value.fields.id;
              } else if (value.objectId) {
                actualTherapistId = value.objectId;
              }
              
              if (actualTherapistId) {
                console.log(`✅ Found wrapped TherapistNFT in kiosk ${kioskId}: ${actualTherapistId}`);
                console.log(`🏷️ Therapist ID ready for soulbound minting: ${actualTherapistId}`);
                
                // Additional validation - try to query this object to ensure it's accessible
                try {
                  const testQuery = await suiClient.getObject({
                    id: actualTherapistId,
                    options: { showType: true }
                  });
                  
                  if (testQuery.data) {
                    console.log(`✅ Verified object ${actualTherapistId} is accessible, type: ${testQuery.data.type}`);
                    return actualTherapistId;
                  } else {
                    console.warn(`⚠️ Object ${actualTherapistId} exists but is not accessible:`, testQuery.error);
                  }
                } catch (testError) {
                  console.warn(`⚠️ Cannot access object ${actualTherapistId}:`, testError);
                }
              } else {
                console.log(`⚠️ Found TherapistNFT type but couldn't extract object ID from:`, value);
              }
            }
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch dynamic field ${field.name.value}:`, error);
        continue;
      }
    }

    console.log(`⚠️ No TherapistNFT found in kiosk ${kioskId}`);
    return null;
    
  } catch (error) {
    console.warn(`Error checking kiosk ${kioskId}:`, error);
    return null;
  }
}

/**
 * Utility function to verify if a wallet has a valid therapist setup
 * 
 * @param therapistWalletAddress - The Sui wallet address to check
 * @returns Promise<boolean> - True if wallet has a kiosk with TherapistNFT
 */
export async function verifyTherapistWallet(therapistWalletAddress: string): Promise<boolean> {
  try {
    await getTherapistIdFromWallet(therapistWalletAddress);
    return true;
  } catch (error) {
    console.log(`Wallet verification failed for ${therapistWalletAddress}:`, error);
    return false;
  }
}

/**
 * Check if a wallet has any objects that might indicate kiosk-related issues
 */
export async function diagnosePotentialKioskIssues(therapistWalletAddress: string): Promise<{
  hasObjects: boolean;
  hasKioskOwnerCap: boolean;
  objectTypes: string[];
  suggestions: string[];
}> {
  try {
    const suiClient = new SuiClient({ url: getFullnodeUrl(NETWORK as any) });
    
    const ownedObjectsResponse = await suiClient.getOwnedObjects({
      owner: therapistWalletAddress,
      options: {
        showType: true,
        showContent: true,
      },
    });

    const objects = ownedObjectsResponse.data || [];
    const objectTypes = objects.map(obj => obj.data?.type).filter(Boolean) as string[];
    
    const hasKioskOwnerCap = objectTypes.some(type => 
      type.includes('::kiosk::KioskOwnerCap') || type.includes('::kiosk::OwnerCap')
    );
    
    const suggestions: string[] = [];
    
    if (objects.length === 0) {
      suggestions.push('Wallet has no objects - may need to create a kiosk first');
    } else if (!hasKioskOwnerCap) {
      suggestions.push('Wallet has objects but no KioskOwnerCap - may need to create a kiosk');
    } else {
      suggestions.push('Wallet has KioskOwnerCap but kiosk ID extraction failed - may be a data structure issue');
    }
    
    if (!objectTypes.some(type => type.includes('TherapistNFT'))) {
      suggestions.push('No TherapistNFT found - therapist may need to mint their NFT first');
    }

    return {
      hasObjects: objects.length > 0,
      hasKioskOwnerCap,
      objectTypes,
      suggestions,
    };
  } catch (error) {
    return {
      hasObjects: false,
      hasKioskOwnerCap: false,
      objectTypes: [],
      suggestions: [`Error diagnosing wallet: ${error}`],
    };
  }
}

/**
 * Get therapist NFT details along with the ID
 * 
 * @param therapistWalletAddress - The Sui wallet address of the therapist
 * @returns Promise<{therapistId: string, nftDetails: TherapistNFT}> 
 */
export async function getTherapistNFTDetails(therapistWalletAddress: string): Promise<{
  therapistId: string;
  nftDetails: {
    name: string;
    specialization: string;
    credentials: string;
    years_experience: number;
    bio: string;
    session_types: string;
    languages: string;
    rating: number;
    total_sessions: number;
    profile_image_url: string;
    certification_url: string;
  };
}> {
  try {
    // Initialize Sui client
    const suiClient = new SuiClient({ url: getFullnodeUrl(NETWORK as any) });

    // Get therapist ID first
    const therapistId = await getTherapistIdFromWallet(therapistWalletAddress);

    // Fetch the NFT object directly to get detailed fields
    const nftResponse = await suiClient.getObject({
      id: therapistId,
      options: {
        showContent: true,
      },
    });

    if (!nftResponse.data?.content) {
      throw new Error('Could not fetch TherapistNFT details');
    }

    const fields = (nftResponse.data.content as any).fields;

    return {
      therapistId,
      nftDetails: {
        name: Array.isArray(fields.name) ? String.fromCharCode(...fields.name) : fields.name,
        specialization: Array.isArray(fields.specialization) ? String.fromCharCode(...fields.specialization) : fields.specialization,
        credentials: Array.isArray(fields.credentials) ? String.fromCharCode(...fields.credentials) : fields.credentials,
        years_experience: parseInt(fields.years_experience) || 0,
        bio: Array.isArray(fields.bio) ? String.fromCharCode(...fields.bio) : fields.bio,
        session_types: Array.isArray(fields.session_types) ? String.fromCharCode(...fields.session_types) : fields.session_types,
        languages: Array.isArray(fields.languages) ? String.fromCharCode(...fields.languages) : fields.languages,
        rating: parseInt(fields.rating) || 0,
        total_sessions: parseInt(fields.total_sessions) || 0,
        profile_image_url: Array.isArray(fields.profile_image_url) ? String.fromCharCode(...fields.profile_image_url) : fields.profile_image_url,
        certification_url: Array.isArray(fields.certification_url) ? String.fromCharCode(...fields.certification_url) : fields.certification_url,
      },
    };
  } catch (error) {
    console.error('❌ Error in getTherapistNFTDetails:', error);
    throw error;
  }
}
