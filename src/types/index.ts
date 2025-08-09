// Database Types (matching Supabase schema)
export interface User {
  id: string;
  role: 'client' | 'therapist';
  alias: string;
  created_at: string;
  metadata?: {
    preferences?: string[];
    vibe_tags?: string[];
    timezone?: string;
  };
}

// Extended Client type for wallet-based authentication
export interface ClientProfile {
  wallet_address: string; // Primary key - Sui wallet address (ONLY identifier)
  anon_display_name: string | null;
  email: string | null;
  auth_provider: 'google' | 'facebook' | 'twitch' | null;
  provider_subject: string | null;
  timezone: string | null;
  preferences: string[] | null;
  vibe_tags: string[] | null;
  total_sessions: number;
  total_spent_sui: number;
  is_verified: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

// Wallet authentication context
export interface WalletAuthContext {
  isConnected: boolean;
  wallet_address: string | null;
  auth_provider: 'google' | 'facebook' | 'twitch' | null;
  client_profile: ClientProfile | null;
  isLoading: boolean;
}

export interface TherapistProfile {
  user_id: string;
  bio: string;
  specializations: string[];
  verified: boolean;
  rating: number;
  created_at: string;
}

export interface Session {
  id: string;
  client_id: string;
  therapist_id: string;
  scheduled_time: string;
  duration_min: number;
  price_sui: number;
  nft_token_id?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
}

export interface SessionFeedback {
  id: string;
  session_id: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface PaymentTransaction {
  id: string;
  session_id: string;
  payer_id: string;
  amount_sui: number;
  tx_hash: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface UserTag {
  user_id: string;
  tag_id: string;
}

// Extended types for UI
export interface TherapistWithProfile extends User {
  profile: TherapistProfile;
  tags: Tag[];
}

export interface SessionWithDetails extends Session {
  client: User;
  therapist: TherapistWithProfile;
  feedback?: SessionFeedback;
}

// Mock UI types
export interface MockWalletConnection {
  connected: boolean;
  address?: string;
  balance?: number;
}

export interface VibeTag {
  id: string;
  name: string;
  category: 'style' | 'specialty' | 'approach';
  color: string;
}

// Sui Blockchain Types for Therapist NFT Integration
export interface SuiObjectResponse {
  data?: {
    objectId: string;
    type: string;
    content?: {
      dataType: string;
      type: string;
      fields: Record<string, any>;
    };
  };
}

export interface KioskOwnerCap {
  objectId: string;
  type: string;
  fields: {
    kiosk: string;
  };
}

export interface TherapistNFTOnChain {
  objectId: string;
  type: string;
  fields: {
    id: { id: string };
    name: string | number[];
    specialization: string | number[];
    credentials: string | number[];
    years_experience: string;
    bio: string | number[];
    session_types: string | number[];
    languages: string | number[];
    rating: string;
    total_sessions: string;
    profile_image_url: string | number[];
    certification_url: string | number[];
  };
}

export interface TherapistNFTData {
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
}