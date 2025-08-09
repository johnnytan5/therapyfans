import { supabase } from './supabase';

export interface TherapistWithSpecializations {
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
  specializations: string[];
  rating?: number;
  reviewCount?: number;
}

// Mock ratings for now - in a real app, you'd calculate these from reviews
const mockRatings: Record<string, { rating: number; reviewCount: number }> = {
  '95bc553d-9fc5-408c-b646-f85c2e0e0f9b': { rating: 4.8, reviewCount: 12 }, // Dr. Sarah Chen
  '45743031-78a6-4c93-9f4c-343e6518d117': { rating: 4.9, reviewCount: 8 },  // Dr. Ahmed Hassan
  'dfad81a3-b1b7-4c53-a0ef-abbedc159d82': { rating: 4.7, reviewCount: 15 }, // Maria Rodriguez
  '1add72c5-5605-4457-b620-12a97d47d671': { rating: 4.6, reviewCount: 6 },  // Dr. James Williams
  '10e722e7-584d-4c23-83f0-1e69d7b0c473': { rating: 4.9, reviewCount: 10 }, // Lisa Thompson
};

export async function getTherapists(): Promise<TherapistWithSpecializations[]> {
  try {
    const { data, error } = await supabase
      .from('therapists')
      .select(`
        *,
        therapist_specializations!inner(
          specializations(name)
        )
      `)
      .eq('is_verified', true);

    if (error) {
      console.error('Error fetching therapists:', error);
      return [];
    }

    // Transform the data to flatten specializations and add ratings
    const therapists = data?.map((therapist: any) => ({
      ...therapist,
      specializations: therapist.therapist_specializations?.map((ts: any) => ts.specializations?.name).filter(Boolean) || [],
      rating: mockRatings[therapist.id]?.rating || 4.5,
      reviewCount: mockRatings[therapist.id]?.reviewCount || 0,
    })) || [];

    return therapists;
  } catch (error) {
    console.error('Error in getTherapists:', error);
    return [];
  }
}

export async function getTherapistById(id: string): Promise<TherapistWithSpecializations | null> {
  try {
    const { data, error } = await supabase
      .from('therapists')
      .select(`
        *,
        therapist_specializations!inner(
          specializations(name)
        )
      `)
      .eq('id', id)
      .eq('is_verified', true)
      .single();

    if (error) {
      console.error('Error fetching therapist:', error);
      return null;
    }

    if (!data) return null;

    return {
      ...data,
      specializations: data.therapist_specializations?.map((ts: any) => ts.specializations?.name).filter(Boolean) || [],
      rating: mockRatings[data.id]?.rating || 4.5,
      reviewCount: mockRatings[data.id]?.reviewCount || 0,
    };
  } catch (error) {
    console.error('Error in getTherapistById:', error);
    return null;
  }
}

// Helper function to get display name from full name
export function getDisplayName(fullName: string | null | undefined): string {
  // Handle null, undefined, or empty strings
  if (!fullName || fullName.trim() === '') {
    return 'Anonymous Therapist';
  }
  
  // Extract first name or create a display name
  const parts = fullName.trim().split(' ');
  if (parts.length >= 2) {
    // Use first name + last initial
    return `${parts[0]} ${parts[parts.length - 1][0]}.`;
  }
  return fullName;
}

// Helper function to format price
export function formatPrice(price: string | null): string {
  if (!price) return '5.00';
  const numPrice = parseFloat(price);
  return numPrice.toFixed(2);
}
