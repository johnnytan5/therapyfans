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
  MoreHorizontal,
  Eye,
  EyeOff
} from "lucide-react";
import Link from "next/link";
import { useCurrentAccount } from '@mysten/dapp-kit';
import { formatTime, formatDate, SessionNFT } from "@/lib/meetingLinks";
import { formatSui } from "@/lib/utils";
import { SessionService, BookedSession } from "@/lib/sessionService";

// Transform BookedSession to SessionNFT for UI compatibility
const transformBookedSessionToNFT = (session: BookedSession): SessionNFT => ({
  id: session.available_session_id,
  therapist_wallet: session.therapist_wallet,
  date: session.date,
  start_time: session.start_time,
  end_time: session.end_time,
  price_sui: session.price_sui,
  status: session.session_status === 'upcoming' ? 'booked' : 
          session.session_status === 'completed' ? 'completed' : 'booked',
  nft_token_id: session.nft_token_id,
  meeting_link: session.meeting_link,
  meeting_room_id: session.meeting_room_id,
  client_wallet: session.client_wallet,
  purchased_at: session.booked_at
});

export default function MySessionsPage() {
  const currentAccount = useCurrentAccount();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'nfts'>('upcoming');
  const [copiedLink, setCopiedLink] = useState<string>('');
  const [upcomingSessions, setUpcomingSessions] = useState<SessionNFT[]>([]);
  const [pastSessions, setPastSessions] = useState<SessionNFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [revealedMeetingIds, setRevealedMeetingIds] = useState<Set<string>>(new Set());

  // Fetch user's booked sessions
  useEffect(() => {
    async function fetchUserSessions() {
      if (!currentAccount?.address) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        console.log('📋 Fetching sessions for wallet:', currentAccount.address);

        // Fetch upcoming and past sessions
        const [upcoming, past] = await Promise.all([
          SessionService.getClientUpcomingSessions(currentAccount.address),
          SessionService.getClientPastSessions(currentAccount.address)
        ]);

        // Transform to UI-compatible format
        const upcomingNFTs = upcoming.map(transformBookedSessionToNFT);
        const pastNFTs = past.map(transformBookedSessionToNFT);

        setUpcomingSessions(upcomingNFTs);
        setPastSessions(pastNFTs);

        console.log('✅ Sessions loaded:', { 
          upcoming: upcomingNFTs.length, 
          past: pastNFTs.length 
        });

      } catch (err) {
        console.error('❌ Error fetching sessions:', err);
        setError('Failed to load sessions. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchUserSessions();
  }, [currentAccount?.address]);

  const copyMeetingLink = async (link: string, sessionId: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(sessionId);
      setTimeout(() => setCopiedLink(''), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const toggleMeetingIdReveal = (sessionId: string) => {
    setRevealedMeetingIds((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }
      return next;
    });
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
                            Upcoming ({upcomingSessions.length})
          </Button>
          <Button
            variant={activeTab === 'past' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('past')}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
                            Past ({pastSessions.length})
          </Button>
          <Button
            variant={activeTab === 'nfts' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('nfts')}
          >
            <Award className="w-4 h-4 mr-2" />
                            NFT Collection ({upcomingSessions.length + pastSessions.length})
          </Button>
        </div>

        {/* Upcoming Sessions */}
        {activeTab === 'upcoming' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Upcoming Sessions</h2>
              <Badge variant="outline" className="text-green-400 border-green-400/30">
                {upcomingSessions.length} scheduled
              </Badge>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading sessions...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-400 mb-4">{error}</p>
                <Button onClick={() => window.location.reload()}>Try Again</Button>
              </div>
            ) : upcomingSessions.length > 0 ? (
              <div className="grid gap-4">
                {upcomingSessions.map((session) => {
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
                                <h3 className="font-semibold text-foreground">Therapist</h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span className="font-mono text-xs">
                                    {session.therapist_wallet.slice(0, 8)}...{session.therapist_wallet.slice(-6)}
                                  </span>
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
                              {session.nft_token_id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyMeetingLink(session.nft_token_id!, `nft-${session.id}`)}
                                  className="h-6 px-2"
                                >
                                  {copiedLink === `nft-${session.id}` ? (
                                    <CheckCircle className="w-3 h-3 text-green-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </Button>
                              )}
                            </div>

                            {session.meeting_link && (
                              <div className="mt-2">
                                <div className="text-xs text-purple-700 font-semibold flex items-center">
                                  <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
                                  Meeting ID
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleMeetingIdReveal(session.id)}
                                    className="ml-2 h-6 px-3 text-xs bg-purple-100/60 hover:bg-purple-200/80 border border-purple-200 rounded-md"
                                  >
                                    {revealedMeetingIds.has(session.id) ? (
                                      <>
                                        <EyeOff className="w-3 h-3 mr-1 text-purple-600" />
                                        Hide
                                      </>
                                    ) : (
                                      <>
                                        <Eye className="w-3 h-3 mr-1 text-purple-600" />
                                        Reveal
                                      </>
                                    )}
                                  </Button>
                                  {revealedMeetingIds.has(session.id) && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => copyMeetingLink(session.meeting_link!, `meet-${session.id}`)}
                                      className="ml-2 h-6 px-2"
                                    >
                                      {copiedLink === `meet-${session.id}` ? (
                                        <CheckCircle className="w-3 h-3 text-green-400" />
                                      ) : (
                                        <Copy className="w-3 h-3" />
                                      )}
                                    </Button>
                                  )}
                                </div>
                                {revealedMeetingIds.has(session.id) && (
                                  <div className="text-xs text-purple-800 break-all font-mono bg-purple-50/80 p-2 rounded border border-purple-100 mt-1">
                                    {session.meeting_link}
                                  </div>
                                )}
                              </div>
                            )}
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
                {pastSessions.length} completed
              </Badge>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading sessions...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-400 mb-4">{error}</p>
                <Button onClick={() => window.location.reload()}>Try Again</Button>
              </div>
            ) : pastSessions.length > 0 ? (
              <div className="grid gap-4">
                {pastSessions.map((session) => {

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
                                <h3 className="font-semibold text-foreground">Therapist</h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span className="font-mono text-xs">
                                    {session.therapist_wallet.slice(0, 8)}...{session.therapist_wallet.slice(-6)}
                                  </span>
                                  <span>•</span>
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
                {upcomingSessions.length + pastSessions.length} NFTs owned
              </Badge>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading NFTs...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-400 mb-4">{error}</p>
                <Button onClick={() => window.location.reload()}>Try Again</Button>
              </div>
            ) : (upcomingSessions.length + pastSessions.length) > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...upcomingSessions, ...pastSessions].map((session) => {

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
                        <h3 className="font-semibold text-foreground">Therapist Session</h3>
                        <p className="text-xs text-muted-foreground font-mono">
                          {session.therapist_wallet.slice(0, 8)}...{session.therapist_wallet.slice(-6)}
                        </p>
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
            ) : (
              <div className="text-center py-12">
                <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Session NFTs</h3>
                <p className="text-muted-foreground mb-4">
                  Book your first therapy session to start collecting NFTs
                </p>
                <Link href="/marketplace">
                  <Button>Explore Therapists</Button>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Empty states for upcoming and past sessions */}
        {activeTab === 'upcoming' && !loading && !error && upcomingSessions.length === 0 && (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Upcoming Sessions</h3>
            <p className="text-muted-foreground mb-4">
              You don't have any scheduled therapy sessions yet
            </p>
            <Link href="/marketplace">
              <Button>Book a Session</Button>
            </Link>
          </div>
        )}

        {activeTab === 'past' && !loading && !error && pastSessions.length === 0 && (
          <div className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Past Sessions</h3>
            <p className="text-muted-foreground mb-4">
              Your completed therapy sessions will appear here
            </p>
            <Link href="/marketplace">
              <Button>Book Your First Session</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}