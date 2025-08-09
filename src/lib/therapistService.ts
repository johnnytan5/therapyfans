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
  rating?: number | null;
  reviewCount?: number | null;
}

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

    console.log('🔍 Raw therapist data from database:');
    data?.forEach((t, index) => {
      console.log(`Therapist ${index + 1}:`, {
        id: t.id,
        name: t.full_name,
        price_per_session: t.price_per_session,
        all_price_fields: Object.keys(t).filter(key => key.toLowerCase().includes('price') || key.toLowerCase().includes('cost') || key.toLowerCase().includes('rate')),
        all_fields: Object.keys(t)
      });
    });

    // Transform the data to flatten specializations and add ratings
    const therapists = data?.map((therapist: any) => ({
      ...therapist,
      specializations: therapist.therapist_specializations?.map((ts: any) => ts.specializations?.name).filter(Boolean) || [],
      // Use DB columns; default to nulls if not present
      rating: typeof therapist.rating === 'number' && !Number.isNaN(therapist.rating)
        ? therapist.rating
        : null,
      reviewCount: typeof therapist.review_count === 'number' && !Number.isNaN(therapist.review_count)
        ? therapist.review_count
        : null,
      // Check for different possible price column names
      price_per_session: therapist.price_per_session || therapist.sui_price || therapist.price || therapist.session_price || '0.01',
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
      rating: typeof data.rating === 'number' && !Number.isNaN(data.rating)
        ? data.rating
        : null,
      reviewCount: typeof data.review_count === 'number' && !Number.isNaN(data.review_count)
        ? data.review_count
        : null,
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
  console.log('🏷️ formatPrice called with:', price);
  if (!price) {
    console.log('⚠️ Price is null/empty, using fallback 0.01');
    return '0.01';
  }
  const numPrice = parseFloat(price);
  console.log('💰 Formatted price:', numPrice.toFixed(2));
  return numPrice.toFixed(2);
}
