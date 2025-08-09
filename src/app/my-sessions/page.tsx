"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Clock, 
  Calendar, 
  Star, 
  Video, 
  CheckCircle, 
  Timer,
  User,
  Award,
  ExternalLink,
  Copy,
  MoreHorizontal
} from "lucide-react";
import Link from "next/link";
import { useCurrentAccount } from '@mysten/dapp-kit';
import { formatTime, formatDate, SessionNFT } from "@/lib/meetingLinks";
import { formatSui } from "@/lib/utils";

// Mock session data
const mockUpcomingSessions: SessionNFT[] = [
  {
    id: 'nft-001',
    therapist_wallet: '0x1234...5678',
    date: '2024-12-21',
    start_time: '14:00',
    end_time: '14:30',
    price_sui: 5.0,
    status: 'booked',
    nft_token_id: 'token-20241221-1400-abc123',
    meeting_link: 'https://devmatch.com/session/a1b2c3d4',
    meeting_room_id: 'a1b2c3d4',
    client_wallet: '0xabc...def',
    purchased_at: '2024-12-20T10:30:00Z'
  },
  {
    id: 'nft-002',
    therapist_wallet: '0x5678...9abc',
    date: '2024-12-23',
    start_time: '16:30',
    end_time: '17:00',
    price_sui: 5.0,
    status: 'booked',
    nft_token_id: 'token-20241223-1630-def456',
    meeting_link: 'https://devmatch.com/session/e5f6g7h8',
    meeting_room_id: 'e5f6g7h8',
    client_wallet: '0xabc...def',
    purchased_at: '2024-12-20T14:15:00Z'
  }
];

const mockPastSessions: SessionNFT[] = [
  {
    id: 'nft-003',
    therapist_wallet: '0x9abc...def0',
    date: '2024-12-18',
    start_time: '10:00',
    end_time: '10:30',
    price_sui: 5.0,
    status: 'completed',
    nft_token_id: 'token-20241218-1000-ghi789',
    meeting_link: 'https://devmatch.com/session/i9j0k1l2',
    meeting_room_id: 'i9j0k1l2',
    client_wallet: '0xabc...def',
    purchased_at: '2024-12-17T16:45:00Z'
  }
];

// Mock therapist data
const mockTherapists = {
  '0x1234...5678': { name: 'Dr. Sarah Johnson', rating: 4.8 },
  '0x5678...9abc': { name: 'Dr. Michael Chen', rating: 4.9 },
  '0x9abc...def0': { name: 'Dr. Emily Rodriguez', rating: 4.7 }
};

export default function MySessionsPage() {
  const currentAccount = useCurrentAccount();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'nfts'>('upcoming');
  const [copiedLink, setCopiedLink] = useState<string>('');

  const copyMeetingLink = async (link: string, sessionId: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(sessionId);
      setTimeout(() => setCopiedLink(''), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const getTimeUntilSession = (date: string, time: string) => {
    const sessionDateTime = new Date(`${date}T${time}:00`);
    const now = new Date();
    const diffMs = sessionDateTime.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Session time passed';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 24) {
      const days = Math.floor(diffHours / 24);
      return `In ${days} day${days > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `In ${diffHours}h ${diffMinutes}m`;
    } else {
      return `In ${diffMinutes} minutes`;
    }
  };

  const canJoinSession = (date: string, time: string) => {
    const sessionDateTime = new Date(`${date}T${time}:00`);
    const now = new Date();
    const diffMs = sessionDateTime.getTime() - now.getTime();
    
    // Can join 5 minutes before session
    return diffMs <= 5 * 60 * 1000 && diffMs > -30 * 60 * 1000;
  };

  if (!currentAccount) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/20 cyber-grid">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center py-16">
            <h3 className="text-lg font-medium text-foreground mb-4">Connect your wallet to view sessions</h3>
            <Link href="/marketplace">
              <Button variant="outline">Go to Marketplace</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/20 cyber-grid">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/20 via-background to-blue-900/20 border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/marketplace">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Marketplace
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            My <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Sessions</span>
          </h1>
          <p className="text-muted-foreground mt-2">Manage your therapy appointments and NFT collection</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mb-8 p-1 bg-muted/20 rounded-lg w-fit">
          <Button
            variant={activeTab === 'upcoming' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('upcoming')}
            className="relative"
          >
            <Clock className="w-4 h-4 mr-2" />
            Upcoming ({mockUpcomingSessions.length})
          </Button>
          <Button
            variant={activeTab === 'past' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('past')}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Past ({mockPastSessions.length})
          </Button>
          <Button
            variant={activeTab === 'nfts' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('nfts')}
          >
            <Award className="w-4 h-4 mr-2" />
            NFT Collection ({mockUpcomingSessions.length + mockPastSessions.length})
          </Button>
        </div>

        {/* Upcoming Sessions */}
        {activeTab === 'upcoming' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Upcoming Sessions</h2>
              <Badge variant="outline" className="text-green-400 border-green-400/30">
                {mockUpcomingSessions.length} scheduled
              </Badge>
            </div>

            {mockUpcomingSessions.length > 0 ? (
              <div className="grid gap-4">
                {mockUpcomingSessions.map((session) => {
                  const therapist = mockTherapists[session.therapist_wallet as keyof typeof mockTherapists];
                  const timeUntil = getTimeUntilSession(session.date, session.start_time);
                  const canJoin = canJoinSession(session.date, session.start_time);

                  return (
                    <Card key={session.id} className="glass border-glow hover:glow-purple transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-blue-500 rounded-full flex items-center justify-center">
                                <User className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-foreground">{therapist.name}</h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                  <span>{therapist.rating}</span>
                                  <span>•</span>
                                  <span>30 minutes</span>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Date:</span>
                                <p className="font-medium">{formatDate(session.date)}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Time:</span>
                                <p className="font-medium">{formatTime(session.start_time)} - {formatTime(session.end_time)}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Status:</span>
                                <p className="font-medium text-green-400">Confirmed</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Countdown:</span>
                                <p className="font-medium text-purple-400">{timeUntil}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>NFT ID:</span>
                              <span className="font-mono">{session.nft_token_id?.slice(0, 20)}...</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyMeetingLink(session.meeting_link!, session.id)}
                                className="h-6 px-2"
                              >
                                {copiedLink === session.id ? (
                                  <CheckCircle className="w-3 h-3 text-green-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </Button>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            {canJoin ? (
                              <Button
                                size="sm"
                                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                                asChild
                              >
                                <Link href={`/session/room/${session.meeting_room_id}`}>
                                  <Video className="w-4 h-4 mr-2" />
                                  Join Session
                                </Link>
                              </Button>
                            ) : (
                              <Button variant="outline" size="sm" disabled>
                                <Timer className="w-4 h-4 mr-2" />
                                Not Ready
                              </Button>
                            )}
                            
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="glass border-glow">
                <CardContent className="p-12 text-center">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Upcoming Sessions</h3>
                  <p className="text-muted-foreground mb-4">Book your first therapy session to get started</p>
                  <Link href="/marketplace">
                    <Button>Browse Therapists</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Past Sessions */}
        {activeTab === 'past' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Past Sessions</h2>
              <Badge variant="outline" className="text-blue-400 border-blue-400/30">
                {mockPastSessions.length} completed
              </Badge>
            </div>

            {mockPastSessions.length > 0 ? (
              <div className="grid gap-4">
                {mockPastSessions.map((session) => {
                  const therapist = mockTherapists[session.therapist_wallet as keyof typeof mockTherapists];

                  return (
                    <Card key={session.id} className="glass border-glow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-foreground">{therapist.name}</h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span>Completed</span>
                                  <span>•</span>
                                  <span>{formatDate(session.date)}</span>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Time:</span>
                                <p className="font-medium">{formatTime(session.start_time)} - {formatTime(session.end_time)}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Duration:</span>
                                <p className="font-medium">30 minutes</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Cost:</span>
                                <p className="font-medium">{formatSui(session.price_sui)} SUI</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <Button variant="outline" size="sm">
                              <Star className="w-4 h-4 mr-2" />
                              Rate Session
                            </Button>
                            <Button variant="ghost" size="sm">
                              Book Again
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="glass border-glow">
                <CardContent className="p-12 text-center">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Past Sessions</h3>
                  <p className="text-muted-foreground">Your completed sessions will appear here</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* NFT Collection */}
        {activeTab === 'nfts' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">NFT Collection</h2>
              <Badge variant="outline" className="text-purple-400 border-purple-400/30">
                {mockUpcomingSessions.length + mockPastSessions.length} NFTs owned
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...mockUpcomingSessions, ...mockPastSessions].map((session) => {
                const therapist = mockTherapists[session.therapist_wallet as keyof typeof mockTherapists];

                return (
                  <Card key={session.id} className="glass border-glow hover:glow-purple transition-all duration-300">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Badge variant={session.status === 'completed' ? 'default' : 'outline'} className="text-xs">
                          {session.status === 'completed' ? 'Completed' : 'Upcoming'}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-mono">
                          #{session.nft_token_id?.slice(-8)}
                        </span>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg mx-auto mb-3 flex items-center justify-center">
                          <Award className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="font-semibold text-foreground">{therapist.name}</h3>
                        <p className="text-sm text-muted-foreground">{formatDate(session.date)}</p>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Time:</span>
                          <span>{formatTime(session.start_time)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Value:</span>
                          <span>{formatSui(session.price_sui)} SUI</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <span className={session.status === 'completed' ? 'text-green-400' : 'text-purple-400'}>
                            {session.status === 'completed' ? 'Completed' : 'Active'}
                          </span>
                        </div>
                      </div>

                      <Button variant="outline" size="sm" className="w-full">
                        <ExternalLink className="w-3 h-3 mr-2" />
                        View on Explorer
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}