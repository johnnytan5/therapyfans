import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vyeibfsdmzjtabujnvtd.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5ZWliZnNkbXpqdGFidWpudnRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzOTYxNDgsImV4cCI6MjA2OTk3MjE0OH0.fwAengFByDqaD2x3Bp3fIth10sCWfTeIxdwn5qWgm-M';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database tables
export interface Therapist {
  id: string;
  full_name: string;
  profile_picture_url: string | null;
  bio: string | null;
  qualifications: string | null;
  license_number: string | null;
  years_of_experience: number | null;
  therapy_styles: string[];
  languages_spoken: string[];
  price_per_session: string | null;
  created_at: string;
  is_verified: boolean;
}

export interface Client {
  wallet_address: string; // Primary key - Sui wallet address from zkLogin (ONLY identifier)
  anon_display_name: string | null;
  email: string | null;
  auth_provider: 'google' | 'facebook' | 'twitch' | null; // zkLogin provider used
  provider_subject: string | null; // Subject ID from OAuth provider (for zkLogin)
  timezone: string | null;
  preferences: string[] | null; // JSON array of preferences
  vibe_tags: string[] | null; // JSON array of therapy preferences/tags
  total_sessions: number;
  total_spent_sui: number; // Total SUI spent on therapy sessions
  is_verified: boolean; // Account verification status
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  client_wallet_address: string | null; // Reference to clients.wallet_address
  therapist_id: string | null;
  scheduled_at: string | null;
  duration_minutes: number | null;
  meeting_link: string | null;
  status: string | null;
  notes: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  session_id: string | null;
  therapist_id: string | null;
  client_wallet_address: string | null; // Reference to clients.wallet_address
  rating: number | null;
  review_text: string | null;
  created_at: string;
}
