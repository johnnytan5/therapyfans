import { supabase } from './supabase';
import { generateMeetingLink, generateMeetingRoomId } from './meetingLinks';

// Database interfaces matching our schema
export interface AvailableSession {
  id: string;
  therapist_wallet: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  duration_minutes: number;
  price_sui: number;
  status: 'available' | 'booked' | 'cancelled' | 'completed';
  meeting_room_id: string;
  created_at: string;
  updated_at: string;
}

export interface BookedSession {
  id: string;
  available_session_id: string;
  client_wallet: string;
  therapist_wallet: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  price_sui: number;
  transaction_hash: string | null;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  session_status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled' | 'no_show';
  nft_token_id: string;
  meeting_room_id: string;
  meeting_link: string;
  notes: string | null;
  rating: number | null;
  feedback: string | null;
  booked_at: string;
  session_started_at: string | null;
  session_ended_at: string | null;
  updated_at: string;
  // Therapist info (joined from therapists table)
  therapist_name?: string;
  therapist_profile_picture?: string | null;
}

// Frontend-compatible interface (matches existing SessionNFT)
export interface SessionNFT {
  id: string;
  therapist_wallet: string;
  date: string;
  start_time: string;
  end_time: string;
  price_sui: number;
  status: 'available' | 'booked' | 'completed';
  nft_token_id?: string;
  meeting_link?: string;
  meeting_room_id: string;
  client_wallet?: string;
  purchased_at?: string;
}

export interface BookingData {
  client_wallet: string;
  transaction_hash?: string;
  payment_status?: 'pending' | 'completed' | 'failed' | 'refunded';
}

/**
 * Session service for managing therapy session bookings
 */
export class SessionService {
  /**
   * Get available sessions for a therapist on a specific date
   */
  static async getAvailableSessionsByTherapist(
    therapistWallet: string, 
    date?: string
  ): Promise<SessionNFT[]> {
    try {
      let query = supabase
        .from('available_sessions')
        .select('*')
        .eq('therapist_wallet', therapistWallet)
        .eq('status', 'available')
        .gte('date', new Date().toISOString().split('T')[0]) // Only future dates
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      // Filter by specific date if provided
      if (date) {
        query = query.eq('date', date);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching available sessions:', error);
        return [];
      }

      // Transform to frontend-compatible format
      return (data || []).map((session: AvailableSession) => ({
        id: session.id,
        therapist_wallet: session.therapist_wallet,
        date: session.date,
        start_time: session.start_time,
        end_time: session.end_time,
        price_sui: session.price_sui,
        status: session.status as 'available' | 'booked' | 'completed',
        meeting_room_id: session.meeting_room_id,
      }));
    } catch (error) {
      console.error('Error in getAvailableSessionsByTherapist:', error);
      return [];
    }
  }

  /**
   * Get all available sessions for a therapist (next 7 days)
   */
  static async getAllAvailableSessionsForTherapist(therapistWallet: string): Promise<SessionNFT[]> {
    try {
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      const todayStr = today.toISOString().split('T')[0];
      const nextWeekStr = nextWeek.toISOString().split('T')[0];

      console.log('🔍 SessionService: Querying available sessions for therapist:', therapistWallet);
      console.log('🔍 SessionService: Date range:', todayStr, 'to', nextWeekStr);

      const { data, error } = await supabase
        .from('available_sessions')
        .select('*')
        .eq('therapist_wallet', therapistWallet)
        .eq('status', 'available')
        .gte('date', todayStr)
        .lte('date', nextWeekStr)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      console.log('🔍 SessionService: Raw query result:', { data, error });

      if (error) {
        console.error('Error fetching all available sessions:', error);
        return [];
      }

      const mapped = (data || []).map((session: AvailableSession) => ({
        id: session.id,
        therapist_wallet: session.therapist_wallet,
        date: session.date,
        start_time: session.start_time,
        end_time: session.end_time,
        price_sui: session.price_sui,
        status: session.status as 'available' | 'booked' | 'completed',
        meeting_room_id: session.meeting_room_id,
      }));

      console.log('🔍 SessionService: Mapped sessions:', mapped);
      return mapped;
    } catch (error) {
      console.error('Error in getAllAvailableSessionsForTherapist:', error);
      return [];
    }
  }

  /**
   * Book a session (create booking and update available session)
   */
  static async bookSession(
    sessionId: string, 
    bookingData: BookingData
  ): Promise<{ success: boolean; bookedSession?: SessionNFT; error?: string }> {
    try {
      // Start a transaction-like operation
      console.log('🔄 Starting session booking:', { sessionId, clientWallet: bookingData.client_wallet });

      // Check if client exists (for foreign key constraint)
      const { data: clientExists, error: clientError } = await supabase
        .from('clients')
        .select('wallet_address')
        .eq('wallet_address', bookingData.client_wallet)
        .single();

      if (clientError && clientError.code === 'PGRST116') {
        console.log('📝 Client not found, creating client profile...');
        // Create a basic client profile if it doesn't exist
        const { error: createClientError } = await supabase
          .from('clients')
          .insert([{
            wallet_address: bookingData.client_wallet,
            anon_display_name: `Anonymous_${Math.random().toString(36).substr(2, 6)}`,
            total_sessions: 0,
            total_spent_sui: 0,
            is_verified: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (createClientError) {
          console.error('❌ Error creating client:', createClientError);
          return { success: false, error: 'Failed to create client profile' };
        }
        console.log('✅ Client profile created');
      }

      // First, get the available session details
      const { data: availableSession, error: fetchError } = await supabase
        .from('available_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('status', 'available')
        .single();

      if (fetchError || !availableSession) {
        console.error('❌ Session not found or not available:', fetchError);
        return { success: false, error: 'Session not available' };
      }

      // Generate NFT and meeting data
      const nftTokenId = `token-${sessionId}-${Math.random().toString(36).substr(2, 5)}`;
      const meetingLink = generateMeetingLink(
        sessionId,
        availableSession.therapist_wallet,
        availableSession.date,
        availableSession.start_time
      );

      // Create the booking record
      const bookingId = `booking-${sessionId}-${Date.now()}`;
      const bookedSessionData = {
        id: bookingId,
        available_session_id: sessionId,
        client_wallet: bookingData.client_wallet,
        therapist_wallet: availableSession.therapist_wallet,
        date: availableSession.date,
        start_time: availableSession.start_time,
        end_time: availableSession.end_time,
        duration_minutes: availableSession.duration_minutes,
        price_sui: availableSession.price_sui,
        transaction_hash: bookingData.transaction_hash,
        payment_status: bookingData.payment_status || 'completed',
        session_status: 'upcoming',
        nft_token_id: nftTokenId,
        meeting_room_id: availableSession.meeting_room_id,
        meeting_link: meetingLink,
        booked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Debug the booking data before insert
      console.log('📝 Booking data to insert:', {
        id: bookedSessionData.id,
        available_session_id: bookedSessionData.available_session_id,
        client_wallet: bookedSessionData.client_wallet,
        therapist_wallet: bookedSessionData.therapist_wallet,
        session_exists: !!availableSession
      });

      // Insert the booked session
      const { data: bookedSession, error: bookingError } = await supabase
        .from('booked_sessions')
        .insert([bookedSessionData])
        .select()
        .single();

      if (bookingError) {
        console.error('❌ Error creating booking:', bookingError);
        console.error('❌ Full booking error details:', {
          message: bookingError.message,
          details: bookingError.details,
          hint: bookingError.hint,
          code: bookingError.code
        });
        console.error('❌ Data that failed to insert:', bookedSessionData);
        
        // Return more specific error message
        if (bookingError.code === '23503') {
          return { success: false, error: 'Client profile not found. Please connect your wallet properly.' };
        }
        
        return { success: false, error: bookingError.message || 'Failed to create booking' };
      }

      // Update the available session status to 'booked'
      const { error: updateError } = await supabase
        .from('available_sessions')
        .update({ 
          status: 'booked',
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (updateError) {
        console.error('❌ Error updating available session:', updateError);
        // Note: In a real system, you'd want to rollback the booking here
        return { success: false, error: 'Failed to update session availability' };
      }

      // Update client statistics
      await this.updateClientStats(bookingData.client_wallet, availableSession.price_sui);

      console.log('✅ Session booked successfully:', bookedSession);

      // Return frontend-compatible format
      const sessionNFT: SessionNFT = {
        id: sessionId,
        therapist_wallet: availableSession.therapist_wallet,
        date: availableSession.date,
        start_time: availableSession.start_time,
        end_time: availableSession.end_time,
        price_sui: availableSession.price_sui,
        status: 'booked',
        nft_token_id: nftTokenId,
        meeting_link: meetingLink,
        meeting_room_id: availableSession.meeting_room_id,
        client_wallet: bookingData.client_wallet,
        purchased_at: bookedSession.booked_at,
      };

      return { success: true, bookedSession: sessionNFT };
    } catch (error) {
      console.error('💥 Unexpected error in bookSession:', error);
      return { success: false, error: 'Unexpected booking error' };
    }
  }

  /**
   * Get booked sessions for a client with therapist information
   */
  static async getClientBookedSessions(clientWallet: string): Promise<BookedSession[]> {
    try {
      // First, get the booked sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('booked_sessions')
        .select('*')
        .eq('client_wallet', clientWallet)
        .order('date', { ascending: false })
        .order('start_time', { ascending: false });

      if (sessionsError) {
        console.error('Error fetching client booked sessions:', sessionsError);
        return [];
      }

      if (!sessions || sessions.length === 0) {
        return [];
      }

      // Get unique therapist wallet addresses
      const therapistWallets = [...new Set(sessions.map(s => s.therapist_wallet))];

      // Fetch therapist information
      const { data: therapists, error: therapistsError } = await supabase
        .from('therapists')
        .select('id, full_name, profile_picture_url')
        .in('id', therapistWallets);

      if (therapistsError) {
        console.error('Error fetching therapist information:', therapistsError);
        // Continue without therapist info
      }

      // Create a map of therapist wallet -> therapist info
      const therapistMap = new Map();
      if (therapists) {
        therapists.forEach(therapist => {
          therapistMap.set(therapist.id, therapist);
        });
      }

      // Combine session data with therapist information
      const transformedData = sessions.map(session => ({
        ...session,
        therapist_name: therapistMap.get(session.therapist_wallet)?.full_name || 'Unknown Therapist',
        therapist_profile_picture: therapistMap.get(session.therapist_wallet)?.profile_picture_url || null,
      }));

      return transformedData;
    } catch (error) {
      console.error('Error in getClientBookedSessions:', error);
      return [];
    }
  }

  /**
   * Get upcoming sessions for a client
   */
  static async getClientUpcomingSessions(clientWallet: string): Promise<BookedSession[]> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('booked_sessions')
        .select('*')
        .eq('client_wallet', clientWallet)
        .in('session_status', ['upcoming', 'ongoing'])
        .gte('date', today)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching upcoming sessions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getClientUpcomingSessions:', error);
      return [];
    }
  }

  /**
   * Get past sessions for a client
   */
  static async getClientPastSessions(clientWallet: string): Promise<BookedSession[]> {
    try {
      const { data, error } = await supabase
        .from('booked_sessions')
        .select('*')
        .eq('client_wallet', clientWallet)
        .in('session_status', ['completed', 'cancelled', 'no_show'])
        .order('date', { ascending: false })
        .order('start_time', { ascending: false });

      if (error) {
        console.error('Error fetching past sessions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getClientPastSessions:', error);
      return [];
    }
  }

  /**
   * Update session status
   */
  static async updateSessionStatus(
    bookingId: string, 
    status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled' | 'no_show'
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('booked_sessions')
        .update({ 
          session_status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) {
        console.error('Error updating session status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateSessionStatus:', error);
      return false;
    }
  }

  /**
   * Add session rating and feedback
   */
  static async addSessionFeedback(
    bookingId: string, 
    rating: number, 
    feedback?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('booked_sessions')
        .update({ 
          rating,
          feedback,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) {
        console.error('Error adding session feedback:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in addSessionFeedback:', error);
      return false;
    }
  }

  /**
   * Update client statistics after booking
   */
  private static async updateClientStats(clientWallet: string, sessionPrice: number): Promise<void> {
    try {
      // Get current client stats
      const { data: client, error: fetchError } = await supabase
        .from('clients')
        .select('total_sessions, total_spent_sui')
        .eq('wallet_address', clientWallet)
        .single();

      if (fetchError) {
        console.warn('Could not fetch client for stats update:', fetchError);
        return;
      }

      // Update stats
      const { error: updateError } = await supabase
        .from('clients')
        .update({
          total_sessions: (client?.total_sessions || 0) + 1,
          total_spent_sui: (client?.total_spent_sui || 0) + sessionPrice,
          updated_at: new Date().toISOString()
        })
        .eq('wallet_address', clientWallet);

      if (updateError) {
        console.warn('Could not update client stats:', updateError);
      }
    } catch (error) {
      console.warn('Error updating client stats:', error);
    }
  }

  /**
   * Check if a session is still available (helper function)
   */
  static async isSessionAvailable(sessionId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('available_sessions')
        .select('status')
        .eq('id', sessionId)
        .single();

      if (error) return false;
      return data?.status === 'available';
    } catch (error) {
      return false;
    }
  }

  /**
   * Get session details by ID (for booking confirmation)
   */
  static async getSessionById(sessionId: string): Promise<AvailableSession | null> {
    try {
      const { data, error } = await supabase
        .from('available_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) {
        console.error('Error fetching session by ID:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getSessionById:', error);
      return null;
    }
  }
}

// Export convenience functions for easier imports
export const {
  getAvailableSessionsByTherapist,
  getAllAvailableSessionsForTherapist,
  bookSession,
  getClientBookedSessions,
  getClientUpcomingSessions,
  getClientPastSessions,
  updateSessionStatus,
  addSessionFeedback,
  isSessionAvailable,
  getSessionById
} = SessionService;