import { supabase, Therapist } from './supabase';

export interface TherapistWithRating extends Therapist {
  rating: number;
  reviewCount: number;
}

// Mock ratings for now - in a real app, you'd calculate these from reviews
const mockRatings: Record<string, { rating: number; reviewCount: number }> = {
  '95bc553d-9fc5-408c-b646-f85c2e0e0f9b': { rating: 4.8, reviewCount: 12 }, // Dr. Sarah Chen
  '45743031-78a6-4c93-9f4c-343e6518d117': { rating: 4.9, reviewCount: 8 },  // Dr. Ahmed Hassan
  'dfad81a3-b1b7-4c53-a0ef-abbedc159d82': { rating: 4.7, reviewCount: 15 }, // Maria Rodriguez
  '1add72c5-5605-4457-b620-12a97d47d671': { rating: 4.6, reviewCount: 6 },  // Dr. James Williams
  '10e722e7-584d-4c23-83f0-1e69d7b0c473': { rating: 4.9, reviewCount: 10 }, // Lisa Thompson
};

export async function getTherapists(): Promise<TherapistWithRating[]> {
  try {
    const { data, error } = await supabase
      .from('therapists')
      .select('*')
      .eq('is_verified', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching therapists:', error);
      return [];
    }

    console.log('Raw therapist data from Supabase:', data);

    // Transform the data to include ratings and format for frontend
    const transformedData = (data || []).map(therapist => {
      console.log('Processing therapist:', therapist);
      return {
        ...therapist,
        rating: mockRatings[therapist.id]?.rating || 4.5,
        reviewCount: mockRatings[therapist.id]?.reviewCount || 0,
      };
    });

    console.log('Transformed therapist data:', transformedData);
    return transformedData;
  } catch (error) {
    console.error('Error fetching therapists:', error);
    return [];
  }
}

export async function getTherapistById(id: string): Promise<TherapistWithRating | null> {
  try {
    const { data, error } = await supabase
      .from('therapists')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Error fetching therapist:', error);
      return null;
    }

    return {
      ...data,
      rating: mockRatings[data.id]?.rating || 4.5,
      reviewCount: mockRatings[data.id]?.reviewCount || 0,
    };
  } catch (error) {
    console.error('Error fetching therapist:', error);
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
