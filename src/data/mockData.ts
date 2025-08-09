import { User, TherapistProfile, Session, Tag, TherapistWithProfile, SessionWithDetails, VibeTag } from '@/types';

// Mock Tags/Vibe Tags
export const mockTags: Tag[] = [
  { id: '1', name: 'Cognitive' },
  { id: '2', name: 'Empathetic' },
  { id: '3', name: 'Direct' },
  { id: '4', name: 'Spiritual' },
  { id: '5', name: 'CBT' },
  { id: '6', name: 'EMDR' },
  { id: '7', name: 'Mindfulness' },
  { id: '8', name: 'Trauma-informed' },
  { id: '9', name: 'LGBTQ+ friendly' },
  { id: '10', name: 'Burnout specialist' },
];

export const mockVibeTags: VibeTag[] = [
  { id: '1', name: 'Cognitive', category: 'approach', color: 'blue' },
  { id: '2', name: 'Empathetic', category: 'style', color: 'green' },
  { id: '3', name: 'Direct', category: 'style', color: 'orange' },
  { id: '4', name: 'Spiritual', category: 'approach', color: 'purple' },
  { id: '5', name: 'CBT', category: 'specialty', color: 'blue' },
  { id: '6', name: 'EMDR', category: 'specialty', color: 'red' },
  { id: '7', name: 'Mindfulness', category: 'approach', color: 'teal' },
  { id: '8', name: 'Trauma-informed', category: 'specialty', color: 'indigo' },
];

// Mock Users
export const mockUsers: User[] = [
  {
    id: 'client-1',
    role: 'client',
    alias: 'Anonymous_Seeker',
    created_at: '2024-01-15T10:30:00Z',
    metadata: {
      vibe_tags: ['burnout', 'anxiety'],
      timezone: 'UTC-8',
    },
  },
  {
    id: 'therapist-1',
    role: 'therapist',
    alias: 'CalmCactus',
    created_at: '2024-01-10T09:00:00Z',
    metadata: {
      vibe_tags: ['empathetic', 'cognitive'],
    },
  },
  {
    id: 'therapist-2',
    role: 'therapist',
    alias: 'MindfulMountain',
    created_at: '2024-01-12T14:20:00Z',
    metadata: {
      vibe_tags: ['spiritual', 'mindfulness'],
    },
  },
  {
    id: 'therapist-3',
    role: 'therapist',
    alias: 'DirectOcean',
    created_at: '2024-01-08T11:45:00Z',
    metadata: {
      vibe_tags: ['direct', 'trauma-informed'],
    },
  },
];

// Mock Therapist Profiles
export const mockTherapistProfiles: TherapistProfile[] = [
  {
    user_id: 'therapist-1',
    bio: 'Gentle approach to cognitive therapy. I believe in creating a safe space for healing and growth.',
    specializations: ['CBT', 'Anxiety', 'Depression'],
    verified: true,
    rating: 4.8,
    created_at: '2024-01-10T09:30:00Z',
  },
  {
    user_id: 'therapist-2',
    bio: 'Mindfulness-based therapy with spiritual elements. Walking the path together towards inner peace.',
    specializations: ['Mindfulness', 'Spiritual Counseling', 'Meditation'],
    verified: true,
    rating: 4.9,
    created_at: '2024-01-12T14:45:00Z',
  },
  {
    user_id: 'therapist-3',
    bio: 'Direct, solution-focused therapy. I help you cut through the noise and find practical paths forward.',
    specializations: ['EMDR', 'Trauma', 'PTSD'],
    verified: true,
    rating: 4.7,
    created_at: '2024-01-08T12:00:00Z',
  },
];

// Mock Sessions
export const mockSessions: Session[] = [
  {
    id: 'session-1',
    client_id: 'client-1',
    therapist_id: 'therapist-1',
    scheduled_time: '2024-08-06T15:00:00Z',
    duration_min: 30,
    price_sui: 5.0,
    nft_token_id: 'nft_0x123...456',
    status: 'scheduled',
    created_at: '2024-08-05T10:30:00Z',
  },
  {
    id: 'session-2',
    client_id: 'client-1',
    therapist_id: 'therapist-2',
    scheduled_time: '2024-08-01T14:00:00Z',
    duration_min: 30,
    price_sui: 5.0,
    nft_token_id: 'nft_0x789...012',
    status: 'completed',
    created_at: '2024-07-31T09:15:00Z',
  },
];

// Combined mock data
export const mockTherapistsWithProfiles: TherapistWithProfile[] = mockUsers
  .filter(user => user.role === 'therapist')
  .map(user => {
    const profile = mockTherapistProfiles.find(p => p.user_id === user.id)!;
    const userTags = mockTags.filter(tag => 
      profile.specializations.includes(tag.name) || 
      user.metadata?.vibe_tags?.includes(tag.name.toLowerCase())
    );
    
    return {
      ...user,
      profile,
      tags: userTags,
    };
  });

export const mockSessionsWithDetails: SessionWithDetails[] = mockSessions.map(session => {
  const client = mockUsers.find(u => u.id === session.client_id)!;
  const therapist = mockTherapistsWithProfiles.find(t => t.id === session.therapist_id)!;
  
  return {
    ...session,
    client,
    therapist,
  };
});

// Available time slots for booking
export const mockAvailableSlots = [
  { time: '09:00', available: true },
  { time: '09:15', available: true },
  { time: '09:30', available: false },
  { time: '09:45', available: true },
  { time: '10:00', available: true },
  { time: '10:15', available: false },
  { time: '10:30', available: true },
  { time: '14:00', available: true },
  { time: '14:15', available: true },
  { time: '14:30', available: true },
  { time: '15:00', available: false },
  { time: '15:15', available: true },
  { time: '15:30', available: true },
];

export const mockWalletData = {
  connected: false,
  address: undefined,
  balance: 0,
};