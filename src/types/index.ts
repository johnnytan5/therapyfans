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