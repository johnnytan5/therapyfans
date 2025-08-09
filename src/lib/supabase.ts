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
  id: string;
  anon_display_name: string | null;
  email: string | null;
  created_at: string;
}

export interface Session {
  id: string;
  client_id: string | null;
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
  client_id: string | null;
  rating: number | null;
  review_text: string | null;
  created_at: string;
}
