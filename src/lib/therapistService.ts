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

// Session types for therapist dashboards
export interface AvailableSession {
  id: string;
  therapist_id: string; // kept for backward compatibility if present
  therapist_wallet?: string;
  // Normalized fields for convenience
  scheduled_at: string | null; // alias of start_time
  end_time?: string | null;
  duration_minutes: number | null; // always 30 in your schema
  price_sui: number | null;
  created_at: string;
}

export interface BookedSession {
  id: string;
  therapist_id: string;
  client_wallet_address: string | null;
  scheduled_at: string | null;
  duration_minutes: number | null;
  meeting_link: string | null;
  status: string | null;
  notes: string | null;
  created_at: string;
  client?: { wallet_address: string; anon_display_name: string | null } | null;
}

export interface TherapistSessionsResult {
  available: AvailableSession[];
  booked: BookedSession[];
  upcoming: BookedSession[];
  past: BookedSession[];
}

/**
 * Load sessions for a therapist from available_sessions and booked_sessions tables
 * Returns raw groups plus derived upcoming/past groupings for convenience
 */
export async function loadTherapistSessions(therapistId: string, therapistWallet?: string): Promise<TherapistSessionsResult> {
  try {
    const now = new Date();

    const availableQuery = supabase
      .from('available_sessions')
      .select('*')
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });
    // Only filter by therapist_wallet since that's what the table has
    if (therapistWallet) {
      availableQuery.eq('therapist_wallet', therapistWallet);
    }

    // Skip booked_sessions if table doesn't exist - for now just return empty array
    const bookedQuery = Promise.resolve({ data: [], error: null });

    const [{ data: availableRows, error: availableError }, { data: bookedRows, error: bookedError }] = await Promise.all([
      availableQuery,
      bookedQuery,
    ]);

    if (availableError) {
      console.error('Error fetching available_sessions:', availableError);
    }
    if (bookedError) {
      console.error('Error fetching booked_sessions:', bookedError);
    }

    const normalizeAvailable = (row: any): AvailableSession => {
      const dateStr: string | null = row.date || null;
      const startTime: string | null = row.start_time || null; // HH:MM:SS
      const endTime: string | null = row.end_time || null;
      const start = dateStr && startTime ? new Date(`${dateStr}T${startTime}Z`).toISOString() : (row.scheduled_at || row.scheduled_time || null);
      const end = dateStr && endTime ? new Date(`${dateStr}T${endTime}Z`).toISOString() : (endTime || (start ? new Date(new Date(start).getTime() + 30 * 60 * 1000).toISOString() : null));
      const duration = row.duration_minutes ?? 30; // standard fixed duration
      const price = row.price_sui ?? row.price ?? null;
      const created = row.created_at ?? new Date().toISOString();
      return {
        id: String(row.id),
        therapist_id: String(row.therapist_id ?? ''),
        therapist_wallet: row.therapist_wallet ?? undefined,
        scheduled_at: start,
        end_time: end,
        duration_minutes: typeof duration === 'number' ? duration : (duration ? Number(duration) : null),
        price_sui: typeof price === 'number' ? price : (price ? Number(price) : null),
        created_at: created,
      };
    };

    const available: AvailableSession[] = ((availableRows as any[]) || []).map(normalizeAvailable)
      .sort((a, b) => {
        const ta = a.scheduled_at ? new Date(a.scheduled_at).getTime() : 0;
        const tb = b.scheduled_at ? new Date(b.scheduled_at).getTime() : 0;
        return ta - tb;
      });
    const booked: BookedSession[] = ((bookedRows as any[]) || []).map((row: any) => {
      const start = row.start_time || row.scheduled_at || row.scheduled_time || null;
      return {
        ...row,
        scheduled_at: start,
        client: row.clients || null,
      } as BookedSession;
    });

    const upcoming: BookedSession[] = booked.filter((s) => {
      if (!s.scheduled_at) return false;
      const when = new Date(s.scheduled_at);
      const isFuture = when.getTime() >= now.getTime();
      const isScheduled = (s.status || '').toLowerCase() === 'scheduled' || (s.status || '').toLowerCase() === 'accepted';
      return isFuture && isScheduled;
    });

    const past: BookedSession[] = booked.filter((s) => {
      if (!s.scheduled_at) return false;
      const when = new Date(s.scheduled_at);
      const isPast = when.getTime() < now.getTime();
      const isCompleted = (s.status || '').toLowerCase() === 'completed' || isPast;
      return isCompleted;
    });

    return { available, booked, upcoming, past };
  } catch (error) {
    console.error('Unexpected error loading therapist sessions:', error);
    return { available: [], booked: [], upcoming: [], past: [] };
  }
}

/** Create a single available session row */
export async function createAvailableSession(params: {
  therapistId: string; // therapist UUID/id (optional depending on table)
  therapistWallet?: string; // wallet address used by available_sessions
  scheduledAt: string; // ISO string for the selected date+time
  durationMinutes: number; // always 30, but kept for API compatibility
  priceSui?: number | null;
}): Promise<AvailableSession | null> {
  try {
    const createdAt = new Date().toISOString();
    const startISO = params.scheduledAt;
    const startDate = new Date(startISO);
    // Build date (YYYY-MM-DD) and time (HH:MM:SS) parts to match table types
    const dateStr = startDate.toISOString().slice(0, 10);
    const hh = startDate.getUTCHours().toString().padStart(2, '0');
    const mm = startDate.getUTCMinutes().toString().padStart(2, '0');
    const startTime = `${hh}:${mm}:00`;
    const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);
    const eh = endDate.getUTCHours().toString().padStart(2, '0');
    const em = endDate.getUTCMinutes().toString().padStart(2, '0');
    const endTime = `${eh}:${em}:00`;

    const meetingRoomId = `room-${dateStr.replace(/-/g, '')}-${hh}${mm}`; // room-name-YYMMDD-time
    const therapistWallet = params.therapistWallet || params.therapistId;
    // Use more unique id to avoid collisions, include 8 chars of wallet
    const walletKey = (therapistWallet || '').replace(/^0x/, '').slice(-8);
    const slotId = `slot-${dateStr.replace(/-/g, '')}-${hh}${mm}-${walletKey}`;
    const priceValue = typeof params.priceSui === 'number' ? params.priceSui : 5; // ensure NOT NULL
    // Try a few column variants to tolerate schema differences
    // Only use therapist_wallet since that's what your table has
    const payload = {
      id: slotId,
      therapist_wallet: therapistWallet,
      date: dateStr,
      start_time: startTime,
      end_time: endTime,
      duration_minutes: 30,
      status: 'available',
      nft_token_id: null,
      meeting_room_id: meetingRoomId,
      meeting_link: null,
      price_sui: priceValue,
      created_at: createdAt,
    };

    const { data, error } = await supabase
      .from('available_sessions')
      .upsert([payload], { onConflict: 'id' })
      .select('*')
      .single();
    
    if (!error && data) {
      // Normalize on the way out
      const start = data.date && data.start_time
        ? new Date(`${data.date}T${data.start_time}Z`).toISOString()
        : null;
      const end = data.date && data.end_time
        ? new Date(`${data.date}T${data.end_time}Z`).toISOString()
        : (start ? new Date(new Date(start).getTime() + 30 * 60 * 1000).toISOString() : null);
      return {
        id: String(data.id),
        therapist_id: String(data.therapist_wallet || ''), // map wallet to id for compatibility
        therapist_wallet: data.therapist_wallet,
        scheduled_at: start,
        end_time: end,
        duration_minutes: 30,
        price_sui: data.price_sui ?? null,
        created_at: data.created_at ?? createdAt,
      };
    }
    
    if (error && error.code === '23505') {
      // Duplicate id – treat as success (already exists)
      console.log('Slot already exists, skipping');
      return null;
    }
    
    if (error) {
      console.error('Error creating available session:', error);
      return null;
    }
    return null;
  } catch (err) {
    console.error('Unexpected error creating available session:', err);
    return null;
  }
}

/** Delete an available session by id */
export async function deleteAvailableSession(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('available_sessions')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('Error deleting available session:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Unexpected error deleting available session:', err);
    return false;
  }
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
