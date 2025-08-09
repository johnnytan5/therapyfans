// Meeting link generation utilities for NFT-based sessions

export interface SessionNFT {
  id: string;
  therapist_wallet: string;
  date: string; // "2024-12-20"
  start_time: string; // "14:00"
  end_time: string; // "14:30"
  price_sui: number; // 5.0
  status: 'available' | 'booked' | 'completed';
  nft_token_id?: string;
  meeting_link?: string;
  meeting_room_id?: string;
  client_wallet?: string;
  purchased_at?: string;
}

/**
 * Generate a unique meeting ID from session data
 * Returns a longer, more unique identifier
 */
export const generateMeetingId = (
  nftId: string,
  therapistWallet: string,
  sessionDate: string,
  startTime: string
): string => {
  const seed = `${nftId}-${therapistWallet}-${sessionDate}-${startTime}`;
  
  // Create multiple hash values for a longer ID
  let hash1 = 0;
  let hash2 = 0;
  let hash3 = 0;
  
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash1 = ((hash1 << 5) - hash1) + char;
    hash2 = ((hash2 << 7) - hash2) + char;
    hash3 = ((hash3 << 3) - hash3) + char;
    hash1 = hash1 & hash1; // Convert to 32-bit integer
    hash2 = hash2 & hash2;
    hash3 = hash3 & hash3;
  }
  
  // Combine hashes and add timestamp for uniqueness
  const timestamp = Date.now().toString(36);
  const combined = `${Math.abs(hash1).toString(16)}${Math.abs(hash2).toString(16)}${Math.abs(hash3).toString(16)}${timestamp}`;
  
  // Return a 24-character alphanumeric ID
  return combined.slice(0, 24).toUpperCase();
};

/**
 * Generate a deterministic meeting link based on session data
 * Uses a simple hash function for demo purposes
 * @deprecated Use generateMeetingId instead
 */
export const generateMeetingLink = (
  nftId: string,
  therapistWallet: string,
  sessionDate: string,
  startTime: string
): string => {
  const meetingId = generateMeetingId(nftId, therapistWallet, sessionDate, startTime);
  return `https://devmatch.com/session/${meetingId}`;
};

/**
 * Generate a meeting room ID from session data
 */
export const generateMeetingRoomId = (
  nftId: string,
  therapistWallet: string,
  sessionDate: string,
  startTime: string
): string => {
  const seed = `${nftId}-${therapistWallet}-${sessionDate}-${startTime}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).slice(0, 8);
};

/**
 * Generate mock NFT time slots for a therapist
 */
export const generateMockTimeSlots = (therapistWallet: string): SessionNFT[] => {
  const slots: SessionNFT[] = [];
  const today = new Date();
  
  // Generate slots for next 5 days
  for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
    const date = new Date(today);
    date.setDate(today.getDate() + dayOffset);
    const dateString = date.toISOString().split('T')[0];
    
    // Generate time slots from 9:00 AM to 6:00 PM (30-minute intervals)
    for (let hour = 9; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const endHour = minute === 30 ? hour + 1 : hour;
        const endMinute = minute === 30 ? 0 : 30;
        const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
        
        const nftId = `nft-${therapistWallet.slice(-6)}-${dateString}-${startTime.replace(':', '')}`;
        
        // Randomly make some slots unavailable for realism
        const isAvailable = Math.random() > 0.3; // 70% availability rate
        
        slots.push({
          id: nftId,
          therapist_wallet: therapistWallet,
          date: dateString,
          start_time: startTime,
          end_time: endTime,
          price_sui: 5.0,
          status: isAvailable ? 'available' : 'booked',
          meeting_room_id: generateMeetingRoomId(nftId, therapistWallet, dateString, startTime),
        });
      }
    }
  }
  
  return slots;
};

/**
 * Format time for display
 */
export const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

/**
 * Format date for display
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
};

/**
 * Get day name from date string
 */
export const getDayName = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
};

/**
 * Process NFT purchase and generate meeting link
 */
export const processNFTPurchase = (
  selectedSlot: SessionNFT,
  clientWallet: string
): SessionNFT => {
  const meetingLink = generateMeetingLink(
    selectedSlot.id,
    selectedSlot.therapist_wallet,
    selectedSlot.date,
    selectedSlot.start_time
  );
  
  return {
    ...selectedSlot,
    status: 'booked',
    meeting_link: meetingLink,
    client_wallet: clientWallet,
    purchased_at: new Date().toISOString(),
    nft_token_id: `token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };
};